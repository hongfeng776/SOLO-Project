import { Op, WhereOptions } from 'sequelize';
import { daos } from '../dao';
import { PageResult } from '../dao/BaseDao';
import { MerchantBusinessData } from '../models/MerchantBusinessData';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';

export const STAT_PERIOD_TYPE_MAP: Record<number, string> = {
  1: '日',
  2: '周',
  3: '月',
  4: '季',
  5: '年',
};

export const BUSINESS_DATA_STATUS_MAP: Record<number, string> = {
  1: '正常',
  2: '已修正',
  3: '异常',
  4: '已校准',
};

export const BUSINESS_QUALITY_LABEL_MAP: Record<number, string> = {
  0: '未标记',
  1: '优质',
  2: '普通',
  3: '劣质',
};

export const FIELD_LABEL_MAP: Record<string, string> = {
  total_order_count: '总订单数',
  valid_order_count: '有效订单数',
  completed_order_count: '已完成订单数',
  total_sales_amount: '总销售额',
  valid_sales_amount: '有效销售额',
  settled_amount: '已结算金额',
  unsettled_amount: '待结算金额',
  total_refund_amount: '总退款金额',
  refund_order_count: '退款订单数',
  avg_order_amount: '客单价',
  new_customer_count: '新客数',
  repeat_customer_count: '复购客数',
  valid_review_count: '有效评价数',
  positive_review_rate: '好评率',
};

export const CALCULATED_FIELDS: string[] = ['avg_order_amount', 'positive_review_rate'];

export const ABNORMAL_THRESHOLD = 0.5;

export interface BusinessDataCreatePayload {
  merchant_id: number;
  stat_period_type: number;
  stat_start_date: string;
  stat_end_date: string;
  total_order_count?: number;
  valid_order_count?: number;
  completed_order_count?: number;
  total_sales_amount?: number;
  valid_sales_amount?: number;
  settled_amount?: number;
  unsettled_amount?: number;
  total_refund_amount?: number;
  refund_order_count?: number;
  avg_order_amount?: number;
  new_customer_count?: number;
  repeat_customer_count?: number;
  valid_review_count?: number;
  positive_review_rate?: number;
  remark?: string;
}

export interface BusinessDataQueryParams {
  page?: number;
  pageSize?: number;
  merchant_id?: number;
  stat_period_type?: number;
  stat_start_date?: string;
  stat_end_date?: string;
  data_status?: number;
  risk_level?: number;
  shop_category?: string;
  shop_level?: number;
  sales_amount_min?: number;
  sales_amount_max?: number;
  sortField?: string;
  sortOrder?: string;
}

export interface ValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const {
  merchantBusinessDataDao,
  merchantDao,
  orderDao,
  fundSettlementDao,
  merchantBusinessAbnormalLogDao,
} = daos;

class MerchantBusinessService {
  validateOrderStatus(status: number): boolean {
    return status === 3;
  }

  validateSettlementStatus(status: number): boolean {
    return status === 1;
  }

  validateReviewStatus(status: number): boolean {
    return status !== 0 && status !== 99;
  }

  validateStatPeriod(periodType: number, startDate: string, endDate: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (![1, 2, 3, 4, 5].includes(periodType)) {
      errors.push('无效的统计周期类型');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      errors.push('日期格式不正确');
    }

    if (start > end) {
      errors.push('统计开始日期不能晚于结束日期');
    }

    if (end > now) {
      errors.push('统计周期不能包含未来日期');
    }

    if (errors.length === 0) {
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      switch (periodType) {
        case 1:
          if (Math.floor(diffDays) !== 0) {
            errors.push('日统计周期应为1天');
          }
          break;
        case 2:
          if (diffDays < 6 || diffDays > 8) {
            errors.push('周统计周期应为7天左右');
          }
          break;
        case 3:
          if (diffDays < 27 || diffDays > 32) {
            errors.push('月统计周期应在28-31天');
          }
          break;
        case 4:
          if (diffDays < 89 || diffDays > 93) {
            errors.push('季统计周期应在90-92天');
          }
          break;
        case 5:
          if (diffDays < 364 || diffDays > 367) {
            errors.push('年统计周期应为365天左右');
          }
          break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  validateDataConsistency(data: Partial<BusinessDataCreatePayload>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.valid_order_count !== undefined && data.total_order_count !== undefined) {
      if (data.valid_order_count > data.total_order_count) {
        errors.push('有效订单数不能大于总订单数');
      }
    }

    if (data.completed_order_count !== undefined && data.valid_order_count !== undefined) {
      if (data.completed_order_count > data.valid_order_count) {
        errors.push('已完成订单数不能大于有效订单数');
      }
    }

    if (data.valid_sales_amount !== undefined && data.total_sales_amount !== undefined) {
      if (data.valid_sales_amount > data.total_sales_amount) {
        errors.push('有效销售额不能大于总销售额');
      }
    }

    if (data.settled_amount !== undefined && data.valid_sales_amount !== undefined) {
      if (data.settled_amount > data.valid_sales_amount) {
        errors.push('已结算金额不能大于有效销售额');
      }
    }

    if (data.positive_review_rate !== undefined) {
      if (data.positive_review_rate < 0 || data.positive_review_rate > 100) {
        errors.push('好评率应在0-100之间');
      }
    }

    if (data.refund_order_count !== undefined && data.total_order_count !== undefined) {
      if (data.refund_order_count > data.total_order_count) {
        errors.push('退款订单数不能大于总订单数');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async detectAbnormalFluctuation(
    merchantId: number,
    statPeriodType: number,
    data: Partial<BusinessDataCreatePayload>
  ): Promise<{ abnormal: boolean; abnormalFields: string[] }> {
    const abnormalFields: string[] = [];

    const historyData = await merchantBusinessDataDao.findAll({
      where: {
        merchant_id: merchantId,
        stat_period_type: statPeriodType,
        stat_end_date: {
          [Op.lt]: new Date(data.stat_start_date!),
        },
      },
      order: [['stat_end_date', 'DESC']],
      limit: 3,
    });

    if (historyData.length < 3) {
      return { abnormal: false, abnormalFields };
    }

    const fieldsToCheck = [
      'total_order_count',
      'valid_order_count',
      'total_sales_amount',
      'valid_sales_amount',
      'settled_amount',
    ];

    for (const field of fieldsToCheck) {
      const historyAvg = historyData.reduce((sum, item) => sum + parseFloat((item as any)[field] || 0), 0) / historyData.length;
      const currentValue = parseFloat((data as any)[field] || 0);

      if (historyAvg > 0) {
        const fluctuation = Math.abs(currentValue - historyAvg) / historyAvg;
        if (fluctuation > ABNORMAL_THRESHOLD) {
          abnormalFields.push(field);
        }
      }
    }

    return { abnormal: abnormalFields.length > 0, abnormalFields };
  }

  async detectDuplicateStat(
    merchantId: number,
    periodType: number,
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    const existing = await merchantBusinessDataDao.findOne({
      where: {
        merchant_id: merchantId,
        stat_period_type: periodType,
        stat_start_date: new Date(startDate),
        stat_end_date: new Date(endDate),
      },
    });
    return !!existing;
  }

  async validateAll(payload: BusinessDataCreatePayload): Promise<ValidateResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const periodResult = this.validateStatPeriod(payload.stat_period_type, payload.stat_start_date, payload.stat_end_date);
    errors.push(...periodResult.errors);

    const consistencyResult = this.validateDataConsistency(payload);
    errors.push(...consistencyResult.errors);

    const isDuplicate = await this.detectDuplicateStat(
      payload.merchant_id,
      payload.stat_period_type,
      payload.stat_start_date,
      payload.stat_end_date
    );
    if (isDuplicate) {
      errors.push('该商家此统计周期数据已存在');
    }

    const merchant = await merchantDao.findById(payload.merchant_id);
    if (!merchant) {
      errors.push('商家不存在');
    }

    const { abnormal, abnormalFields } = await this.detectAbnormalFluctuation(
      payload.merchant_id,
      payload.stat_period_type,
      payload
    );
    if (abnormal) {
      warnings.push(`检测到数据异常波动字段: ${abnormalFields.map(f => FIELD_LABEL_MAP[f] || f).join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async autoCalculateBusinessData(
    merchantId: number,
    periodType: number,
    startDate: string,
    endDate: string,
    operatorId?: number,
    operatorName?: string
  ): Promise<MerchantBusinessData> {
    const t = await sequelize.transaction();

    try {
      const merchant = await merchantDao.findById(merchantId);
      if (!merchant) {
        throw new AppError('商家不存在', 404);
      }

      const periodValidation = this.validateStatPeriod(periodType, startDate, endDate);
      if (!periodValidation.valid) {
        throw new AppError(periodValidation.errors.join('; '), 400);
      }

      const isDuplicate = await this.detectDuplicateStat(merchantId, periodType, startDate, endDate);
      if (isDuplicate) {
        throw new AppError('该商家此统计周期数据已存在', 400);
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      const allOrders = await orderDao.findAll({
        where: {
          merchant_id: merchantId,
          created_at: {
            [Op.between]: [start, end],
          },
        },
        transaction: t,
      });

      const validOrders = allOrders.filter(o => this.validateOrderStatus(o.status || 0));
      const completedOrders = allOrders.filter(o => o.status === 3);

      const totalOrderCount = allOrders.length;
      const validOrderCount = validOrders.length;
      const completedOrderCount = completedOrders.length;

      const totalSalesAmount = allOrders.reduce((sum, o) => sum + parseFloat((o.total_amount as any) || 0), 0);
      const validSalesAmount = validOrders.reduce((sum, o) => sum + parseFloat((o.pay_amount as any) || 0), 0);

      const settlements = await fundSettlementDao.findAll({
        where: {
          merchant_id: merchantId,
          created_at: {
            [Op.between]: [start, end],
          },
        },
        transaction: t,
      });

      const settledAmount = settlements
        .filter(s => this.validateSettlementStatus(s.status || 0))
        .reduce((sum, s) => sum + parseFloat((s.settle_amount as any) || 0), 0);
      const unsettledAmount = settlements
        .filter(s => !this.validateSettlementStatus(s.status || 0))
        .reduce((sum, s) => sum + parseFloat((s.settle_amount as any) || 0), 0);

      const refundOrders = allOrders.filter(o => o.refund_status && o.refund_status > 0);
      const totalRefundAmount = refundOrders.reduce((sum, o) => sum + parseFloat((o.refund_amount as any) || 0), 0);
      const refundOrderCount = refundOrders.length;

      const avgOrderAmount = validOrderCount > 0 ? validSalesAmount / validOrderCount : 0;

      const uniqueUsers = new Set(allOrders.map(o => o.user_id));
      const newCustomerCount = uniqueUsers.size;
      const repeatCustomerCount = 0;

      const validReviewCount = 0;
      const positiveReviewRate = 0;

      const businessData = await merchantBusinessDataDao.create({
        merchant_id: merchantId,
        merchant_name: merchant.name,
        shop_category: merchant.shop_category,
        shop_level: merchant.shop_level,
        stat_period_type: periodType,
        stat_start_date: start,
        stat_end_date: end,
        total_order_count: totalOrderCount,
        valid_order_count: validOrderCount,
        completed_order_count: completedOrderCount,
        total_sales_amount: totalSalesAmount,
        valid_sales_amount: validSalesAmount,
        settled_amount: settledAmount,
        unsettled_amount: unsettledAmount,
        total_refund_amount: totalRefundAmount,
        refund_order_count: refundOrderCount,
        avg_order_amount: parseFloat(avgOrderAmount.toFixed(2)),
        new_customer_count: newCustomerCount,
        repeat_customer_count: repeatCustomerCount,
        valid_review_count: validReviewCount,
        positive_review_rate: positiveReviewRate,
        data_status: 1,
        risk_level: 0,
        quality_label: 0,
        operator_id: operatorId,
        operator_name: operatorName,
      } as any, { transaction: t });

      const { abnormal, abnormalFields } = await this.detectAbnormalFluctuation(merchantId, periodType, {
        stat_start_date: startDate,
        total_order_count: totalOrderCount,
        valid_order_count: validOrderCount,
        total_sales_amount: totalSalesAmount,
        valid_sales_amount: validSalesAmount,
        settled_amount: settledAmount,
      });

      if (abnormal) {
        for (const field of abnormalFields) {
          await merchantBusinessAbnormalLogDao.create({
            business_data_id: businessData.id,
            merchant_id: merchantId,
            abnormal_field: field,
            field_label: FIELD_LABEL_MAP[field],
            abnormal_type: 1,
            abnormal_level: 2,
            check_status: 1,
          }, { transaction: t });
        }

        await merchantBusinessDataDao.update(businessData.id, {
          data_status: 3,
          risk_level: 2,
        }, { transaction: t });
      }

      await t.commit();
      return businessData;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async manualCreateBusinessData(
    payload: BusinessDataCreatePayload,
    operatorId?: number,
    operatorName?: string
  ): Promise<MerchantBusinessData> {
    const t = await sequelize.transaction();

    try {
      const validation = await this.validateAll(payload);
      if (!validation.valid) {
        throw new AppError(validation.errors.join('; '), 400);
      }

      const merchant = await merchantDao.findById(payload.merchant_id);

      let avgOrderAmount = payload.avg_order_amount;
      if (avgOrderAmount === undefined && payload.valid_order_count && payload.valid_order_count > 0) {
        avgOrderAmount = (payload.valid_sales_amount || 0) / payload.valid_order_count;
      }

      const businessData = await merchantBusinessDataDao.create({
        ...payload,
        merchant_name: merchant?.name,
        shop_category: merchant?.shop_category,
        shop_level: merchant?.shop_level,
        avg_order_amount: avgOrderAmount ? parseFloat(avgOrderAmount.toFixed(2)) : 0,
        data_status: 1,
        risk_level: 0,
        quality_label: 0,
        operator_id: operatorId,
        operator_name: operatorName,
      } as any, { transaction: t });

      const { abnormal, abnormalFields } = await this.detectAbnormalFluctuation(
        payload.merchant_id,
        payload.stat_period_type,
        payload
      );

      if (abnormal) {
        for (const field of abnormalFields) {
          await merchantBusinessAbnormalLogDao.create({
            business_data_id: businessData.id,
            merchant_id: payload.merchant_id,
            abnormal_field: field,
            field_label: FIELD_LABEL_MAP[field],
            abnormal_type: 1,
            abnormal_level: 2,
            check_status: 1,
          }, { transaction: t });
        }
      }

      await t.commit();
      return businessData;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getBusinessDataList(params: BusinessDataQueryParams): Promise<PageResult<MerchantBusinessData>> {
    const {
      page = 1,
      pageSize = 10,
      merchant_id,
      stat_period_type,
      stat_start_date,
      stat_end_date,
      data_status,
      risk_level,
      shop_category,
      shop_level,
      sales_amount_min,
      sales_amount_max,
      sortField,
      sortOrder,
    } = params;

    const where: WhereOptions<MerchantBusinessData> = {};

    if (merchant_id !== undefined) {
      where.merchant_id = merchant_id;
    }
    if (stat_period_type !== undefined) {
      where.stat_period_type = stat_period_type;
    }
    if (data_status !== undefined) {
      where.data_status = data_status;
    }
    if (risk_level !== undefined) {
      where.risk_level = risk_level;
    }
    if (shop_category) {
      (where as any).shop_category = {
        [Op.like]: `%${shop_category}%`,
      };
    }
    if (shop_level !== undefined) {
      (where as any).shop_level = shop_level;
    }    if (stat_start_date && stat_end_date) {
      (where as any).stat_start_date = {
        [Op.gte]: new Date(stat_start_date),
      };
      (where as any).stat_end_date = {
        [Op.lte]: new Date(stat_end_date),
      };
    }
    if (sales_amount_min !== undefined || sales_amount_max !== undefined) {
      (where as any).valid_sales_amount = {};
      if (sales_amount_min !== undefined) {
        (where as any).valid_sales_amount[Op.gte] = sales_amount_min;
      }
      if (sales_amount_max !== undefined) {
        (where as any).valid_sales_amount[Op.lte] = sales_amount_max;
      }
    }

    let order: any = [['created_at', 'DESC']];
    if (sortField && sortOrder) {
      const validSortFields = [
        'total_order_count', 'valid_order_count', 'total_sales_amount',
        'valid_sales_amount', 'settled_amount', 'created_at',
      ];
      if (validSortFields.includes(sortField)) {
        order = [[sortField, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']];
      }
    }

    return merchantBusinessDataDao.findPage({
      page,
      pageSize,
      where,
      order,
    });
  }

  async getBusinessDataDetail(id: number): Promise<MerchantBusinessData> {
    const data = await merchantBusinessDataDao.findById(id);
    if (!data) {
      throw new AppError('经营数据不存在', 404);
    }
    return data;
  }
}

export const merchantBusinessService = new MerchantBusinessService();
export default MerchantBusinessService;
