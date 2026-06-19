import { Op } from 'sequelize';
import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { FIELD_LABEL_MAP, BUSINESS_QUALITY_LABEL_MAP } from './MerchantBusinessService';
import { BusinessDataQueryParams } from './MerchantBusinessService';

export const EXPORT_MAX_COUNT = 5000;

export const BATCH_SCOPE_CONFIG: Record<number, number> = {
  1: 50,
  2: 200,
  3: 1000,
};

export interface BatchOperationResult {
  success: boolean;
  total: number;
  successCount: number;
  failCount: number;
  messages: string[];
}

export interface ExportParams extends BusinessDataQueryParams {
  exportFields?: string[];
}

const {
  merchantBusinessDataDao,
  merchantDao,
  merchantBusinessAbnormalLogDao,
} = daos;

class MerchantBusinessBatchService {
  getBatchScope(permissionLevel: number): number {
    return BATCH_SCOPE_CONFIG[permissionLevel] || 50;
  }

  buildWhereConditions(params: ExportParams) {
    const where: any = {};

    if (params.merchant_id !== undefined) {
      where.merchant_id = params.merchant_id;
    }
    if (params.stat_period_type !== undefined) {
      where.stat_period_type = params.stat_period_type;
    }
    if (params.data_status !== undefined) {
      where.data_status = params.data_status;
    }
    if (params.risk_level !== undefined) {
      where.risk_level = params.risk_level;
    }
    if (params.shop_category) {
      where.shop_category = { [Op.like]: `%${params.shop_category}%` };
    }
    if (params.shop_level !== undefined) {
      where.shop_level = params.shop_level;
    }
    if (params.stat_start_date && params.stat_end_date) {
      where.stat_start_date = { [Op.gte]: new Date(params.stat_start_date) };
      where.stat_end_date = { [Op.lte]: new Date(params.stat_end_date) };
    }
    if (params.sales_amount_min !== undefined || params.sales_amount_max !== undefined) {
      where.valid_sales_amount = {};
      if (params.sales_amount_min !== undefined) {
        where.valid_sales_amount[Op.gte] = params.sales_amount_min;
      }
      if (params.sales_amount_max !== undefined) {
        where.valid_sales_amount[Op.lte] = params.sales_amount_max;
      }
    }

    return where;
  }

  async batchExport(params: ExportParams): Promise<{ csvContent: string; filename: string; count: number }> {
    const where = this.buildWhereConditions(params);

    const allFields = [
      'id', 'merchant_id', 'merchant_name', 'shop_category', 'shop_level',
      'stat_period_type', 'stat_start_date', 'stat_end_date',
      'total_order_count', 'valid_order_count', 'completed_order_count',
      'total_sales_amount', 'valid_sales_amount', 'settled_amount', 'unsettled_amount',
      'total_refund_amount', 'refund_order_count', 'avg_order_amount',
      'new_customer_count', 'repeat_customer_count', 'valid_review_count',
      'positive_review_rate', 'data_status', 'risk_level', 'quality_label',
      'created_at',
    ];

    const exportFields = params.exportFields && params.exportFields.length > 0
      ? params.exportFields.filter(f => allFields.includes(f))
      : allFields;

    const result = await merchantBusinessDataDao.findAndCountAll({
      where,
      limit: EXPORT_MAX_COUNT,
      order: [['created_at', 'DESC']],
    });

    if (result.count === 0) {
      throw new AppError('没有可导出的数据', 400);
    }

    const headers = exportFields.map(f => FIELD_LABEL_MAP[f] || f).join(',');
    const rows = result.rows.map(row => {
      return exportFields.map(field => {
        let value = (row as any)[field];
        if (value === null || value === undefined) {
          value = '';
        }
        if (field === 'stat_period_type') {
          const map: Record<number, string> = { 1: '日', 2: '周', 3: '月', 4: '季', 5: '年' };
          value = map[value] || value;
        }
        if (field === 'data_status') {
          const map: Record<number, string> = { 1: '正常', 2: '已修正', 3: '异常', 4: '已校准' };
          value = map[value] || value;
        }
        if (field === 'quality_label') {
          value = BUSINESS_QUALITY_LABEL_MAP[value] || value;
        }
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        }
        return value;
      }).join(',');
    });

    const csvContent = '\uFEFF' + headers + '\n' + rows.join('\n');
    const filename = `merchant_business_data_${Date.now()}.csv`;

    return {
      csvContent,
      filename,
      count: result.rows.length,
    };
  }

  async batchCalibrate(
    merchantIds: number[],
    reason: string,
    operatorId?: number,
    operatorName?: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: merchantIds.length,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    if (!merchantIds || merchantIds.length === 0) {
      throw new AppError('请选择要校准的商家', 400);
    }

    if (!reason || reason.trim().length === 0) {
      throw new AppError('请填写校准原因', 400);
    }

    const t = await sequelize.transaction();

    try {
      for (const merchantId of merchantIds) {
        try {
          const businessDataList = await merchantBusinessDataDao.findAll({
            where: {
              merchant_id: merchantId,
              data_status: 3,
            },
            transaction: t,
          });

          for (const data of businessDataList) {
            await merchantBusinessDataDao.update(data.id, {
              data_status: 4,
            }, { transaction: t });
          }

          const abnormalLogs = await merchantBusinessAbnormalLogDao.findAll({
            where: {
              merchant_id: merchantId,
              check_status: 1,
            },
            transaction: t,
          });

          for (const log of abnormalLogs) {
            await merchantBusinessAbnormalLogDao.update(log.id, {
              check_status: 2,
              operator_id: operatorId,
              operator_name: operatorName,
              check_reason: reason,
              checked_at: new Date(),
            }, { transaction: t });
          }

          result.successCount++;
        } catch (err) {
          result.failCount++;
          result.messages.push(`商家ID:${merchantId} 校准失败: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }

      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async batchMarkQuality(
    merchantIds: number[],
    qualityLevel: number,
    reason: string,
    _operatorId?: number,
    _operatorName?: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: merchantIds.length,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    if (!merchantIds || merchantIds.length === 0) {
      throw new AppError('请选择要标记的商家', 400);
    }

    if (![1, 2, 3].includes(qualityLevel)) {
      throw new AppError('无效的质量等级，可选值：1-优质 2-普通 3-劣质', 400);
    }

    if (!reason || reason.trim().length === 0) {
      throw new AppError('请填写标记原因', 400);
    }

    const t = await sequelize.transaction();

    try {
      for (const merchantId of merchantIds) {
        try {
          const merchant = await merchantDao.findById(merchantId);
          if (!merchant) {
            result.failCount++;
            result.messages.push(`商家ID:${merchantId} 不存在`);
            continue;
          }

          await merchantDao.update(merchantId, {
            ...(merchant as any),
            updated_at: new Date(),
          }, { transaction: t });

          const latestData = await merchantBusinessDataDao.findOne({
            where: { merchant_id: merchantId },
            order: [['stat_end_date', 'DESC']],
            transaction: t,
          });

          if (latestData) {
            await merchantBusinessDataDao.update(latestData.id, {
              quality_label: qualityLevel,
            } as any, { transaction: t });
          }

          result.successCount++;
        } catch (err) {
          result.failCount++;
          result.messages.push(`商家ID:${merchantId} 标记失败: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }

      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

export const merchantBusinessBatchService = new MerchantBusinessBatchService();
export default MerchantBusinessBatchService;
