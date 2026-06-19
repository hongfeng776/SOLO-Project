import { Op } from 'sequelize';
import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';

export interface TimelineItem {
  time: Date;
  type: string;
  typeLabel: string;
  content: string;
  operator?: string;
  data?: any;
}

export interface AccuracyCheckItem {
  name: string;
  label: string;
  passed: boolean;
  message: string;
  detail?: any;
}

export interface AccuracyCheckResult {
  total: number;
  passed: number;
  failed: number;
  accuracyRate: number;
  items: AccuracyCheckItem[];
}

const {
  merchantBusinessDataDao,
  merchantBusinessCorrectLogDao,
  merchantLevelAssessLogDao,
  merchantBusinessAbnormalLogDao,
  orderDao,
  orderItemDao,
  fundSettlementDao,
  merchantDao,
} = daos;

class MerchantBusinessTraceService {
  async getFullTrace(businessDataId: number): Promise<{ businessData: any; timeline: TimelineItem[] }> {
    const businessData = await merchantBusinessDataDao.findById(businessDataId);
    if (!businessData) {
      throw new AppError('经营数据不存在', 404);
    }

    const timeline: TimelineItem[] = [];

    timeline.push({
      time: businessData.created_at,
      type: 'create',
      typeLabel: '数据创建',
      content: `创建经营数据，统计周期：${businessData.stat_start_date} 至 ${businessData.stat_end_date}`,
      operator: businessData.operator_name,
      data: businessData.toJSON(),
    });

    const correctLogs = await merchantBusinessCorrectLogDao.findAll({
      where: { business_data_id: businessDataId },
      order: [['created_at', 'ASC']],
    });

    for (const log of correctLogs) {
      timeline.push({
        time: log.created_at,
        type: 'correct',
        typeLabel: '数据修正',
        content: `修正字段${log.field_label}：${log.value_before} → ${log.value_after}`,
        operator: log.operator_name,
        data: log.toJSON(),
      });
    }

    const assessLogs = await merchantLevelAssessLogDao.findAll({
      where: { merchant_id: businessData.merchant_id },
      order: [['created_at', 'ASC']],
    });

    for (const log of assessLogs) {
      timeline.push({
        time: log.created_at,
        type: 'assess',
        typeLabel: '等级评定',
        content: `店铺等级变更：${log.old_shop_level || 1}级 → ${log.new_shop_level || 1}级`,
        operator: log.operator_name,
        data: log.toJSON(),
      });
    }

    const abnormalLogs = await merchantBusinessAbnormalLogDao.findAll({
      where: { business_data_id: businessDataId },
      order: [['created_at', 'ASC']],
    });

    for (const log of abnormalLogs) {
      const statusMap: Record<number, string> = { 1: '待处理', 2: '已校准', 3: '已忽略', 4: '标记风险' };
      timeline.push({
        time: log.created_at,
        type: 'abnormal',
        typeLabel: '异常检测',
        content: `字段${log.field_label}检测到异常波动，当前状态：${statusMap[log.check_status || 1]}`,
        operator: log.operator_name,
        data: log.toJSON(),
      });
    }

    timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return {
      businessData: businessData.toJSON(),
      timeline,
    };
  }

  async checkDataAccuracy(businessDataId: number): Promise<AccuracyCheckResult> {
    const businessData = await merchantBusinessDataDao.findById(businessDataId);
    if (!businessData) {
      throw new AppError('经营数据不存在', 404);
    }

    const items: AccuracyCheckItem[] = [];

    const start = new Date(businessData.stat_start_date);
    const end = new Date(businessData.stat_end_date);
    end.setHours(23, 59, 59, 999);

    const allOrders = await orderDao.findAll({
      where: {
        merchant_id: businessData.merchant_id,
        created_at: {
          [Op.between]: [start, end],
        },
      },
    });

    const actualTotalOrders = allOrders.length;
    const recordTotalOrders = businessData.total_order_count || 0;
    items.push({
      name: 'total_order_count_match',
      label: '订单数匹配校验',
      passed: actualTotalOrders === recordTotalOrders,
      message: actualTotalOrders === recordTotalOrders
        ? `订单数校验通过：${recordTotalOrders}`
        : `订单数不匹配：记录${recordTotalOrders}，实际${actualTotalOrders}`,
      detail: { recorded: recordTotalOrders, actual: actualTotalOrders },
    });

    const actualTotalAmount = allOrders.reduce((sum, o) => sum + parseFloat((o.total_amount as any) || 0), 0);
    const recordTotalAmount = parseFloat((businessData.total_sales_amount as any) || 0);
    items.push({
      name: 'total_sales_amount_match',
      label: '金额匹配校验',
      passed: Math.abs(actualTotalAmount - recordTotalAmount) < 0.01,
      message: Math.abs(actualTotalAmount - recordTotalAmount) < 0.01
        ? `销售额校验通过：${recordTotalAmount}`
        : `销售额不匹配：记录${recordTotalAmount}，实际${actualTotalAmount.toFixed(2)}`,
      detail: { recorded: recordTotalAmount, actual: actualTotalAmount },
    });

    const settlements = await fundSettlementDao.findAll({
      where: {
        merchant_id: businessData.merchant_id,
        created_at: {
          [Op.between]: [start, end],
        },
      },
    });
    const invalidSettlements = settlements.filter(s => s.status === 2);
    items.push({
      name: 'settlement_status_valid',
      label: '结算状态校验',
      passed: invalidSettlements.length === 0,
      message: invalidSettlements.length === 0
        ? '结算状态校验通过'
        : `存在${invalidSettlements.length}条异常结算记录`,
      detail: { invalidCount: invalidSettlements.length },
    });

    const duplicateData = await merchantBusinessDataDao.findAll({
      where: {
        merchant_id: businessData.merchant_id,
        stat_period_type: businessData.stat_period_type,
        stat_start_date: businessData.stat_start_date,
        stat_end_date: businessData.stat_end_date,
      },
    });
    items.push({
      name: 'no_duplicate_stat',
      label: '重复统计校验',
      passed: duplicateData.length <= 1,
      message: duplicateData.length <= 1
        ? '重复统计校验通过'
        : `检测到${duplicateData.length}条重复统计记录`,
      detail: { duplicateCount: duplicateData.length },
    });

    let consistencyPassed = true;
    const consistencyErrors: string[] = [];
    if ((businessData.valid_order_count || 0) > (businessData.total_order_count || 0)) {
      consistencyPassed = false;
      consistencyErrors.push('有效订单数大于总订单数');
    }
    if (parseFloat((businessData.valid_sales_amount as any) || 0) > parseFloat((businessData.total_sales_amount as any) || 0)) {
      consistencyPassed = false;
      consistencyErrors.push('有效销售额大于总销售额');
    }
    if ((businessData.positive_review_rate || 0) < 0 || (businessData.positive_review_rate || 0) > 100) {
      consistencyPassed = false;
      consistencyErrors.push('好评率超出0-100范围');
    }
    items.push({
      name: 'data_consistency',
      label: '逻辑一致性校验',
      passed: consistencyPassed,
      message: consistencyPassed ? '逻辑一致性校验通过' : consistencyErrors.join('; '),
    });

    const abnormalLogs = await merchantBusinessAbnormalLogDao.findAll({
      where: { business_data_id: businessDataId, check_status: 1 },
    });
    items.push({
      name: 'no_pending_abnormal',
      label: '异常波动校验',
      passed: abnormalLogs.length === 0,
      message: abnormalLogs.length === 0
        ? '异常波动校验通过'
        : `存在${abnormalLogs.length}条待处理异常记录`,
      detail: { pendingAbnormalCount: abnormalLogs.length },
    });

    const merchant = await merchantDao.findById(businessData.merchant_id);
    const levelMatch = !merchant || !businessData.shop_level || merchant.shop_level === businessData.shop_level;
    items.push({
      name: 'shop_level_match',
      label: '等级匹配校验',
      passed: levelMatch,
      message: levelMatch
        ? '店铺等级校验通过'
        : `店铺等级不匹配：经营数据${businessData.shop_level}级，商家表${merchant?.shop_level}级`,
      detail: { dataLevel: businessData.shop_level, merchantLevel: merchant?.shop_level },
    });

    items.push({
      name: 'review_valid',
      label: '评价有效校验',
      passed: true,
      message: '评价有效校验通过（暂未接入评价系统）',
    });

    const passed = items.filter(i => i.passed).length;
    const failed = items.length - passed;

    return {
      total: items.length,
      passed,
      failed,
      accuracyRate: parseFloat(((passed / items.length) * 100).toFixed(2)),
      items,
    };
  }

  async getOrderDetailsByBusinessData(
    businessDataId: number,
    page: number = 1,
    pageSize: number = 20
  ) {
    const businessData = await merchantBusinessDataDao.findById(businessDataId);
    if (!businessData) {
      throw new AppError('经营数据不存在', 404);
    }

    const start = new Date(businessData.stat_start_date);
    const end = new Date(businessData.stat_end_date);
    end.setHours(23, 59, 59, 999);

    const { count, rows } = await orderDao.getModel().findAndCountAll({
      where: {
        merchant_id: businessData.merchant_id,
        created_at: {
          [Op.between]: [start, end],
        },
      },
      include: [{
        model: orderItemDao.getModel(),
        as: 'order_items',
        required: false,
      }],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  async getSettlementRecordsByBusinessData(
    businessDataId: number,
    page: number = 1,
    pageSize: number = 20
  ) {
    const businessData = await merchantBusinessDataDao.findById(businessDataId);
    if (!businessData) {
      throw new AppError('经营数据不存在', 404);
    }

    const start = new Date(businessData.stat_start_date);
    const end = new Date(businessData.stat_end_date);
    end.setHours(23, 59, 59, 999);

    return fundSettlementDao.findPage({
      page,
      pageSize,
      where: {
        merchant_id: businessData.merchant_id,
        created_at: {
          [Op.between]: [start, end],
        },
      },
      order: [['created_at', 'DESC']],
    });
  }

  async getAbnormalLogsByMerchant(
    merchantId: number,
    page: number = 1,
    pageSize: number = 20
  ) {
    return merchantBusinessAbnormalLogDao.findPage({
      page,
      pageSize,
      where: { merchant_id: merchantId },
      order: [['created_at', 'DESC']],
    });
  }
}

export const merchantBusinessTraceService = new MerchantBusinessTraceService();
export default MerchantBusinessTraceService;
