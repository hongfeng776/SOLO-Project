import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { FIELD_LABEL_MAP } from './MerchantBusinessService';

export const CORRECT_DIFF_WARN_THRESHOLD = 0.3;
export const CORRECT_DIFF_BLOCK_THRESHOLD = 0.8;

export interface LevelThreshold {
  level: number;
  minSales: number;
  minOrders: number;
}

export const LEVEL_UPDATE_RULES: LevelThreshold[] = [
  { level: 1, minSales: 0, minOrders: 0 },
  { level: 2, minSales: 10000, minOrders: 50 },
  { level: 3, minSales: 50000, minOrders: 200 },
  { level: 4, minSales: 200000, minOrders: 500 },
  { level: 5, minSales: 1000000, minOrders: 2000 },
];

export interface CorrectDiffResult {
  level: 'normal' | 'warn' | 'block';
  diffValue: number;
  diffPercent: number;
}

export interface CorrectDetail {
  fieldName: string;
  fieldLabel: string;
  beforeValue: number | string;
  afterValue: number | string;
  diffValue: number;
  diffPercent: number;
  diffLevel: number;
}

export interface CorrectResult {
  businessData: any;
  correctDetails: CorrectDetail[];
  levelUpdated?: boolean;
  oldLevel?: number;
  newLevel?: number;
}

const {
  merchantBusinessDataDao,
  merchantDao,
  merchantBusinessCorrectLogDao,
  merchantLevelAssessLogDao,
} = daos;

class MerchantBusinessCorrectService {
  validateCorrectDiff(_field: string, before: number, after: number): CorrectDiffResult {
    const diffValue = after - before;
    const diffPercent = before > 0 ? Math.abs(diffValue) / before : 0;

    let level: 'normal' | 'warn' | 'block' = 'normal';
    if (diffPercent >= CORRECT_DIFF_BLOCK_THRESHOLD) {
      level = 'block';
    } else if (diffPercent >= CORRECT_DIFF_WARN_THRESHOLD) {
      level = 'warn';
    }

    return {
      level,
      diffValue,
      diffPercent,
    };
  }

  validateCorrectConsistency(
    _merchantId: number,
    field: string,
    after: number,
    allData: any
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (field) {
      case 'valid_order_count':
        if (allData.total_order_count !== undefined && after > allData.total_order_count) {
          errors.push('有效订单数不能大于总订单数');
        }
        break;
      case 'completed_order_count':
        if (allData.valid_order_count !== undefined && after > allData.valid_order_count) {
          errors.push('已完成订单数不能大于有效订单数');
        }
        break;
      case 'valid_sales_amount':
        if (allData.total_sales_amount !== undefined && after > allData.total_sales_amount) {
          errors.push('有效销售额不能大于总销售额');
        }
        break;
      case 'settled_amount':
        if (allData.valid_sales_amount !== undefined && after > allData.valid_sales_amount) {
          errors.push('已结算金额不能大于有效销售额');
        }
        break;
      case 'positive_review_rate':
        if (after < 0 || after > 100) {
          errors.push('好评率应在0-100之间');
        }
        break;
      case 'refund_order_count':
        if (allData.total_order_count !== undefined && after > allData.total_order_count) {
          errors.push('退款订单数不能大于总订单数');
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  checkLevelUpdateTrigger(_merchantId: number, newData: any): { needUpdate: boolean; newLevel: number } {
    let totalSales = 0;
    let totalOrders = 0;

    if (newData.valid_sales_amount !== undefined) {
      totalSales = newData.valid_sales_amount;
    }
    if (newData.valid_order_count !== undefined) {
      totalOrders = newData.valid_order_count;
    }

    let newLevel = 1;
    for (let i = LEVEL_UPDATE_RULES.length - 1; i >= 0; i--) {
      if (totalSales >= LEVEL_UPDATE_RULES[i].minSales && totalOrders >= LEVEL_UPDATE_RULES[i].minOrders) {
        newLevel = LEVEL_UPDATE_RULES[i].level;
        break;
      }
    }

    return { needUpdate: newLevel !== (newData.shop_level || 1), newLevel };
  }

  async correctBusinessData(
    dataId: number,
    corrections: Record<string, any>,
    correctReason: string,
    operatorId?: number,
    operatorName?: string
  ): Promise<CorrectResult> {
    const t = await sequelize.transaction();

    try {
      const businessData = await merchantBusinessDataDao.findById(dataId);
      if (!businessData) {
        throw new AppError('经营数据不存在', 404);
      }

      if (!correctReason || correctReason.trim().length === 0) {
        throw new AppError('请填写修正原因', 400);
      }

      const correctDetails: CorrectDetail[] = [];
      const updateData: Record<string, any> = {};

      for (const field of Object.keys(corrections)) {
        const beforeValue = parseFloat((businessData as any)[field] || 0);
        const afterValue = parseFloat(corrections[field] || 0);

        if (isNaN(beforeValue) || isNaN(afterValue)) {
          throw new AppError(`字段${FIELD_LABEL_MAP[field] || field}值格式错误`, 400);
        }

        const diffResult = this.validateCorrectDiff(field, beforeValue, afterValue);
        if (diffResult.level === 'block') {
          throw new AppError(
            `字段${FIELD_LABEL_MAP[field] || field}修正差异过大(${((diffResult.diffPercent) * 100).toFixed(2)}%)，已超过阻断阈值`,
            400
          );
        }

        const consistencyResult = this.validateCorrectConsistency(
          businessData.merchant_id,
          field,
          afterValue,
          businessData
        );
        if (!consistencyResult.valid) {
          throw new AppError(consistencyResult.errors.join('; '), 400);
        }

        const diffLevel = diffResult.level === 'normal' ? 1 : diffResult.level === 'warn' ? 2 : 3;

        correctDetails.push({
          fieldName: field,
          fieldLabel: FIELD_LABEL_MAP[field] || field,
          beforeValue,
          afterValue,
          diffValue: diffResult.diffValue,
          diffPercent: diffResult.diffPercent,
          diffLevel,
        });

        updateData[field] = afterValue;
      }

      if (correctDetails.length === 0) {
        throw new AppError('没有需要修正的字段', 400);
      }

      if (updateData.valid_order_count !== undefined && updateData.valid_order_count > 0) {
        const sales = updateData.valid_sales_amount !== undefined
          ? updateData.valid_sales_amount
          : parseFloat((businessData as any).valid_sales_amount || 0);
        updateData.avg_order_amount = parseFloat((sales / updateData.valid_order_count).toFixed(2));
      }

      updateData.data_status = 2;

      await merchantBusinessDataDao.update(dataId, updateData, { transaction: t });

      for (const detail of correctDetails) {
        await merchantBusinessCorrectLogDao.create({
          business_data_id: dataId,
          merchant_id: businessData.merchant_id,
          correct_field: detail.fieldName,
          field_label: detail.fieldLabel,
          value_before: Number(detail.beforeValue),
          value_after: Number(detail.afterValue),
          diff_value: detail.diffValue,
          diff_percent: detail.diffPercent,
          correct_reason: correctReason,
          operator_id: operatorId,
          operator_name: operatorName,
        }, { transaction: t });
      }

      const allNewData = {
        ...businessData.toJSON(),
        ...updateData,
      };
      const levelResult = this.checkLevelUpdateTrigger(businessData.merchant_id, allNewData);

      let levelUpdated = false;
      let oldLevel = businessData.shop_level;
      let newLevel = oldLevel;

      if (levelResult.needUpdate) {
        const merchant = await merchantDao.findById(businessData.merchant_id);
        if (merchant) {
          oldLevel = merchant.shop_level || 1;
          newLevel = levelResult.newLevel;

          await merchantDao.update(businessData.merchant_id, {
            shop_level: newLevel,
          }, { transaction: t });

          await merchantLevelAssessLogDao.create({
            merchant_id: businessData.merchant_id,
            assess_period_type: 3,
            assess_start_date: new Date(),
            assess_end_date: new Date(),
            old_shop_level: oldLevel,
            new_shop_level: newLevel,
            old_business_rank: 0,
            new_business_rank: 0,
            old_estimated_settle: 0,
            new_estimated_settle: allNewData.valid_sales_amount || 0,
            assess_basis: { sales: allNewData.valid_sales_amount, orders: allNewData.valid_order_count },
            assess_reason: `数据修正触发等级评定`,
            operator_id: operatorId,
            operator_name: operatorName,
          }, { transaction: t });

          levelUpdated = true;
        }
      }

      await t.commit();

      const updatedData = await merchantBusinessDataDao.findById(dataId);

      return {
        businessData: updatedData,
        correctDetails,
        levelUpdated,
        oldLevel,
        newLevel,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async recalcLevelAndRank(
    merchantId: number,
    assessReason: string,
    operatorId?: number,
    operatorName?: string
  ): Promise<{ oldLevel: number; newLevel: number; oldRank?: number; newRank?: number }> {
    const t = await sequelize.transaction();

    try {
      const merchant = await merchantDao.findById(merchantId);
      if (!merchant) {
        throw new AppError('商家不存在', 404);
      }

      const latestData = await merchantBusinessDataDao.findOne({
        where: { merchant_id: merchantId },
        order: [['stat_end_date', 'DESC']],
      });

      const totalSales = latestData ? parseFloat((latestData as any).valid_sales_amount || 0) : 0;
      const totalOrders = latestData ? parseInt((latestData as any).valid_order_count || 0) : 0;

      const { newLevel } = this.checkLevelUpdateTrigger(merchantId, {
        valid_sales_amount: totalSales,
        valid_order_count: totalOrders,
        shop_level: merchant.shop_level,
      });

      const oldLevel = merchant.shop_level || 1;

      if (newLevel !== oldLevel) {
        await merchantDao.update(merchantId, {
          shop_level: newLevel,
        }, { transaction: t });
      }

      await merchantLevelAssessLogDao.create({
        merchant_id: merchantId,
        assess_period_type: 3,
        assess_start_date: new Date(),
        assess_end_date: new Date(),
        old_shop_level: oldLevel,
        new_shop_level: newLevel,
        old_business_rank: 0,
        new_business_rank: 0,
        old_estimated_settle: 0,
        new_estimated_settle: totalSales || 0,
        assess_basis: { sales: totalSales, orders: totalOrders },
        assess_reason: assessReason || '手动重新计算等级',
        operator_id: operatorId,
        operator_name: operatorName,
      }, { transaction: t });

      await t.commit();

      return {
        oldLevel,
        newLevel,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getCorrectLogsByMerchant(merchantId: number, page: number = 1, pageSize: number = 20) {
    return merchantBusinessCorrectLogDao.findPage({
      page,
      pageSize,
      where: { merchant_id: merchantId },
      order: [['created_at', 'DESC']],
    });
  }
}

export const merchantBusinessCorrectService = new MerchantBusinessCorrectService();
export default MerchantBusinessCorrectService;
