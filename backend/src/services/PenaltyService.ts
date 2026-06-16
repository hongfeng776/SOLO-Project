import { Op, WhereOptions } from 'sequelize';
import { daos } from '../dao';
import { Penalty } from '../models/Penalty';
import { Goods } from '../models/Goods';
import { Order } from '../models/Order';
import { AppError } from '../middlewares/errorHandler';
import { PageResult } from '../dao/BaseDao';

const {
  penaltyDao,
  merchantDao,
  goodsDao,
  orderDao,
} = daos;

export const PenaltyType = {
  WARNING: 1,
  DEMOTION: 2,
  FINE: 3,
  SHUTDOWN: 4,
} as const;

export const PenaltyStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
} as const;

export const ViolationType = {
  FALSE_ADVERTISING: 'false_advertising',
  PRICE_GOUGING: 'price_gouging',
  SELLING_FAKE: 'selling_fake',
  POOR_SERVICE: 'poor_service',
  EXCESSIVE_REFUNDS: 'excessive_refunds',
  VIOLATION_OF_RULES: 'violation_of_rules',
} as const;

export interface PenaltyCreatePayload {
  merchant_id: number;
  type: number;
  amount?: number;
  reason: string;
  expire_time?: Date | string;
  auto_offline?: boolean;
  auto_block_orders?: boolean;
}

export interface PenaltyUpdatePayload {
  type?: number;
  amount?: number;
  reason?: string;
  status?: number;
  expire_time?: Date | string;
}

export interface PenaltyQueryParams {
  page?: number;
  pageSize?: number;
  merchant_id?: number;
  type?: number;
  status?: number;
  startDate?: string;
  endDate?: string;
}

export interface ViolationCheckResult {
  hasViolation: boolean;
  violations: string[];
  suggestedPenaltyType: number;
  suggestedReason: string;
}

export interface ExecuteResult {
  penalty: Penalty;
  offline_goods?: number;
  blocked_orders?: number;
  merchant_status_updated?: boolean;
}

export interface AutoLiftResult {
  lifted_count: number;
  lifted_ids: number[];
  restored_goods?: number;
  restored_merchants?: number;
}

class PenaltyService {
  private readonly REFUND_RATE_THRESHOLD = 0.3;
  private readonly ORDER_CHECK_WINDOW_DAYS = 30;

  async getList(params: PenaltyQueryParams): Promise<PageResult<Penalty>> {
    const { page = 1, pageSize = 10, merchant_id, type, status, startDate, endDate } = params;

    const where: any = {};

    if (merchant_id !== undefined) {
      where.merchant_id = merchant_id;
    }
    if (type !== undefined) {
      where.type = type;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    return penaltyDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getDetail(id: number): Promise<Penalty> {
    const penalty = await penaltyDao.findById(id);
    if (!penalty) {
      throw new AppError('处罚记录不存在', 404);
    }
    return penalty;
  }

  async getMerchantPenalties(merchantId: number): Promise<Penalty[]> {
    const merchant = await merchantDao.findById(merchantId);
    if (!merchant) {
      throw new AppError('商家不存在', 404);
    }
    return penaltyDao.findByMerchant(merchantId);
  }

  async getActivePenalties(merchantId: number): Promise<Penalty[]> {
    const merchant = await merchantDao.findById(merchantId);
    if (!merchant) {
      throw new AppError('商家不存在', 404);
    }
    return penaltyDao.findActiveByMerchant(merchantId);
  }

  async create(payload: PenaltyCreatePayload): Promise<ExecuteResult> {
    const {
      merchant_id,
      type,
      amount = 0,
      reason,
      expire_time,
      auto_offline = false,
      auto_block_orders = false,
    } = payload;

    this.validatePenaltyType(type);

    const merchant = await merchantDao.findById(merchant_id);
    if (!merchant) {
      throw new AppError('商家不存在', 404);
    }

    if (type === PenaltyType.FINE && (!amount || amount <= 0)) {
      throw new AppError('罚款类型必须指定罚款金额', 400);
    }

    if (type === PenaltyType.SHUTDOWN) {
      const existingShutdown = await penaltyDao.findByTypeAndMerchant(
        merchant_id,
        PenaltyType.SHUTDOWN
      );
      if (existingShutdown) {
        throw new AppError('该商家已存在封店处罚', 400);
      }
    }

    const penaltyData: any = {
      merchant_id,
      type,
      amount,
      reason,
      status: PenaltyStatus.ACTIVE,
    };

    if (expire_time) {
      penaltyData.expire_time = new Date(expire_time);
    }

    const penalty = await penaltyDao.create(penaltyData);

    const executeResult = await this.executePenalty(penalty, {
      auto_offline,
      auto_block_orders,
    });

    return {
      penalty,
      ...executeResult,
    };
  }

  async update(id: number, payload: PenaltyUpdatePayload): Promise<Penalty> {
    const penalty = await penaltyDao.findById(id);
    if (!penalty) {
      throw new AppError('处罚记录不存在', 404);
    }

    if (payload.type !== undefined) {
      this.validatePenaltyType(payload.type);
    }

    const updateData: any = { ...payload };
    if (payload.expire_time) {
      updateData.expire_time = new Date(payload.expire_time);
    }

    await penaltyDao.update(id, updateData);

    const updated = await penaltyDao.findById(id);
    if (!updated) {
      throw new AppError('处罚记录不存在', 404);
    }

    return updated;
  }

  async revoke(id: number): Promise<Penalty> {
    const penalty = await penaltyDao.findById(id);
    if (!penalty) {
      throw new AppError('处罚记录不存在', 404);
    }

    if (penalty.status === PenaltyStatus.INACTIVE) {
      throw new AppError('该处罚已解除', 400);
    }

    await penaltyDao.update(id, { status: PenaltyStatus.INACTIVE });

    await this.restoreMerchantStatus(penalty.merchant_id);

    if (penalty.type === PenaltyType.SHUTDOWN || penalty.type === PenaltyType.DEMOTION) {
      await this.restoreMerchantGoods(penalty.merchant_id);
    }

    const updated = await penaltyDao.findById(id);
    if (!updated) {
      throw new AppError('处罚记录不存在', 404);
    }

    return updated;
  }

  async checkViolation(merchantId: number): Promise<ViolationCheckResult> {
    const merchant = await merchantDao.findById(merchantId);
    if (!merchant) {
      throw new AppError('商家不存在', 404);
    }

    const violations: string[] = [];
    let suggestedPenaltyType: number = PenaltyType.WARNING;

    const now = new Date();
    const windowStart = new Date(
      now.getTime() - this.ORDER_CHECK_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    const merchantGoods = await goodsDao.findAll({
      where: { merchant_id: merchantId } as WhereOptions<Goods>,
    });

    if (merchantGoods.length === 0) {
      return {
        hasViolation: false,
        violations: [],
        suggestedPenaltyType: PenaltyType.WARNING,
        suggestedReason: '',
      };
    }

    const abnormalPriceGoods = merchantGoods.filter(g => {
      const price = Number(g.price);
      const originalPrice = g.original_price ? Number(g.original_price) : price;
      if (price <= 0) return true;
      if (originalPrice > 0 && price < originalPrice * 0.3) return true;
      if (originalPrice > 0 && price > originalPrice * 3) return true;
      return false;
    });

    if (abnormalPriceGoods.length > 0) {
      violations.push(`检测到${abnormalPriceGoods.length}件商品价格异常`);
      suggestedPenaltyType = Math.max(suggestedPenaltyType, PenaltyType.DEMOTION);
    }

    const recentOrders = await orderDao.findAll({
      where: {
        status: { [Op.in]: [2, 3, 4] },
        created_at: { [Op.gte]: windowStart },
      } as WhereOptions<Order>,
    });

    const merchantOrders = recentOrders;

    const cancelledOrders = merchantOrders.filter(o => o.status === 4);

    if (merchantOrders.length > 10) {
      const refundRate = cancelledOrders.length / merchantOrders.length;
      if (refundRate > this.REFUND_RATE_THRESHOLD) {
        violations.push(
          `近${this.ORDER_CHECK_WINDOW_DAYS}天退款率${(refundRate * 100).toFixed(1)}%，超过阈值${(this.REFUND_RATE_THRESHOLD * 100).toFixed(0)}%`
        );
        suggestedPenaltyType = Math.max(suggestedPenaltyType, PenaltyType.FINE);
      }
    }

    const activePenalties = await penaltyDao.findActiveByMerchant(merchantId);
    if (activePenalties.length >= 3) {
      violations.push(`累计${activePenalties.length}次有效处罚`);
      suggestedPenaltyType = PenaltyType.SHUTDOWN;
    }

    const reason = violations.length > 0
      ? `违规检测：${violations.join('；')}`
      : '';

    return {
      hasViolation: violations.length > 0,
      violations,
      suggestedPenaltyType,
      suggestedReason: reason,
    };
  }

  async executePenalty(
    penalty: Penalty,
    options: { auto_offline?: boolean; auto_block_orders?: boolean } = {}
  ): Promise<{
    offline_goods?: number;
    blocked_orders?: number;
    merchant_status_updated?: boolean;
  }> {
    const result: {
      offline_goods?: number;
      blocked_orders?: number;
      merchant_status_updated?: boolean;
    } = {};

    const { auto_offline = false, auto_block_orders = false } = options;

    if (penalty.type === PenaltyType.SHUTDOWN || auto_offline) {
      const offlineCount = await this.offlineMerchantGoods(penalty.merchant_id);
      result.offline_goods = offlineCount;
    }

    if (penalty.type === PenaltyType.DEMOTION && auto_offline) {
      const offlineCount = await this.offlineMerchantGoods(penalty.merchant_id, true);
      result.offline_goods = offlineCount;
    }

    if (penalty.type === PenaltyType.SHUTDOWN || auto_block_orders) {
      const blockedCount = await this.blockPendingOrders(penalty.merchant_id);
      result.blocked_orders = blockedCount;
    }

    if (penalty.type === PenaltyType.SHUTDOWN) {
      await merchantDao.update(penalty.merchant_id, { status: 0 });
      result.merchant_status_updated = true;
    }

    return result;
  }

  async autoLiftExpired(): Promise<AutoLiftResult> {
    const now = new Date();

    const expiredPenalties = await penaltyDao.findAll({
      where: {
        status: PenaltyStatus.ACTIVE,
        expire_time: {
          [Op.lt]: now,
          [Op.ne]: null,
        },
      } as WhereOptions<Penalty>,
    });

    if (expiredPenalties.length === 0) {
      return {
        lifted_count: 0,
        lifted_ids: [],
      };
    }

    const expiredIds = expiredPenalties.map(p => p.id);
    await penaltyDao.expirePenalties(expiredIds);

    const merchantIds = [...new Set(expiredPenalties.map(p => p.merchant_id))];

    let restoredMerchants = 0;
    let restoredGoods = 0;

    for (const merchantId of merchantIds) {
      const stillActive = await penaltyDao.findActiveByMerchant(merchantId);
      if (stillActive.length === 0) {
        await this.restoreMerchantStatus(merchantId);
        restoredMerchants++;

        const hasShutdown = expiredPenalties.some(
          p => p.merchant_id === merchantId && p.type === PenaltyType.SHUTDOWN
        );
        if (hasShutdown) {
          restoredGoods += await this.restoreMerchantGoods(merchantId);
        }
      }
    }

    return {
      lifted_count: expiredPenalties.length,
      lifted_ids: expiredIds,
      restored_goods: restoredGoods,
      restored_merchants: restoredMerchants,
    };
  }

  private async offlineMerchantGoods(
    merchantId: number,
    partial: boolean = false
  ): Promise<number> {
    const goods = await goodsDao.findAll({
      where: {
        merchant_id: merchantId,
        status: 1,
      } as WhereOptions<Goods>,
    });

    if (goods.length === 0) {
      return 0;
    }

    const goodsToOffline = partial ? goods.slice(0, Math.ceil(goods.length / 2)) : goods;
    let count = 0;

    for (const g of goodsToOffline) {
      try {
        await goodsDao.update(g.id, { status: 0 });
        count++;
      } catch (error) {
        console.error(`下架商品失败 ID=${g.id}:`, error);
      }
    }

    return count;
  }

  private async restoreMerchantGoods(merchantId: number): Promise<number> {
    const goods = await goodsDao.findAll({
      where: {
        merchant_id: merchantId,
        status: 0,
      } as WhereOptions<Goods>,
    });

    if (goods.length === 0) {
      return 0;
    }

    let count = 0;
    for (const g of goods) {
      try {
        await goodsDao.update(g.id, { status: 1 });
        count++;
      } catch (error) {
        console.error(`恢复商品上架失败 ID=${g.id}:`, error);
      }
    }

    return count;
  }

  private async blockPendingOrders(_merchantId: number): Promise<number> {
    const pendingOrders = await orderDao.findAll({
      where: {
        status: { [Op.in]: [0, 1] },
      } as WhereOptions<Order>,
    });

    if (pendingOrders.length === 0) {
      return 0;
    }

    let count = 0;
    for (const order of pendingOrders) {
      try {
        await orderDao.update(order.id, { status: 4 });
        count++;
      } catch (error) {
        console.error(`拦截订单失败 ID=${order.id}:`, error);
      }
    }

    return count;
  }

  private async restoreMerchantStatus(merchantId: number): Promise<void> {
    const merchant = await merchantDao.findById(merchantId);
    if (merchant && merchant.status === 0) {
      await merchantDao.update(merchantId, { status: 1 });
    }
  }

  private validatePenaltyType(type: number): void {
    const validTypes: number[] = [
      PenaltyType.WARNING,
      PenaltyType.DEMOTION,
      PenaltyType.FINE,
      PenaltyType.SHUTDOWN,
    ];

    if (!validTypes.includes(type)) {
      throw new AppError('无效的处罚类型', 400);
    }
  }
}

export const penaltyService = new PenaltyService();
export default PenaltyService;
