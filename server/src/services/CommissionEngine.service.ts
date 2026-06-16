import { commissionDao, channelDao, promoterDao, orderDao } from '../dao';
import { CommissionStatus } from '../constants/enum';
import MoneyUtils from '../utils/money';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import riskControlService from './RiskControl.service';

interface CommissionCalcResult {
  promoterId: string;
  orderId: string;
  orderNo: string;
  channelId?: string;
  amount: number;
  rate: number;
  type: number;
  parentId?: string;
  parentCommission?: number;
  parentRate?: number;
}

class CommissionEngineService {
  public async calculateFromOrder(orderId: string): Promise<CommissionCalcResult[]> {
    const order = await orderDao.findById(orderId);
    if (!order) {
      return [];
    }

    if (!order.promoterId) {
      return [];
    }

    const promoter = await promoterDao.findById(order.promoterId);
    if (!promoter) {
      return [];
    }

    let rate = 0;
    let rateSource = 'default';
    if (order.channelId) {
      const channel = await channelDao.findById(order.channelId);
      if (channel && (channel as any).commissionRate) {
        rate = Number((channel as any).commissionRate);
        rateSource = 'channel';
      }
    }

    const payAmount = Number(order.payAmount || order.totalAmount || 0);
    const amount = MoneyUtils.multiply(payAmount, rate / 100);

    await riskControlService.checkCommission(amount, promoter.id);

    await commissionDao.create({
      orderId: order.id,
      orderNo: order.orderNo,
      promoterId: promoter.id,
      channelId: order.channelId,
      type: 1,
      amount,
      rate,
      status: CommissionStatus.PENDING as any,
      sourceType: 'order_direct',
      calcRule: {
        rateSource,
        formula: `payAmount * commissionRate / 100`,
        payAmount,
        commissionRate: rate,
      },
    } as any);

    await promoterDao.updateCommission(promoter.id, amount, amount);

    const results: CommissionCalcResult[] = [
      {
        promoterId: promoter.id,
        orderId: order.id,
        orderNo: order.orderNo,
        channelId: order.channelId || undefined,
        amount,
        rate,
        type: 1,
      },
    ];

    if (promoter.parentId) {
      const parentRate = MoneyUtils.multiply(rate / 100, 0.3) * 100;
      const parentCommission = MoneyUtils.multiply(payAmount, parentRate / 100);

      await commissionDao.create({
        orderId: order.id,
        orderNo: order.orderNo,
        promoterId: promoter.parentId,
        channelId: order.channelId,
        type: 1,
        amount: parentCommission,
        rate: parentRate,
        status: CommissionStatus.PENDING as any,
        remark: '间接佣金',
        sourceType: 'order_indirect',
        calcRule: {
          rateSource: 'parent',
          formula: `payAmount * (commissionRate * 0.3) / 100`,
          payAmount,
          commissionRate: rate,
          indirectRate: parentRate,
          indirectRatio: 0.3,
        },
      } as any);

      await promoterDao.updateCommission(promoter.parentId, parentCommission, parentCommission);

      results.push({
        promoterId: promoter.parentId,
        orderId: order.id,
        orderNo: order.orderNo,
        channelId: order.channelId || undefined,
        amount: parentCommission,
        rate: parentRate,
        type: 1,
        parentId: promoter.parentId,
        parentCommission,
        parentRate,
      });
    }

    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${promoter.id}`);
    if (promoter.parentId) {
      await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${promoter.parentId}`);
    }
    await CacheUtils.delPattern(`${CacheKey.COMMISSION_LIST}*`);
    await CacheUtils.del(`${CacheKey.COMMISSION_SUMMARY}`);

    return results;
  }

  public async deductFromOrder(orderId: string, reason: string): Promise<void> {
    const commissions = await commissionDao.findByOrderId(orderId);

    for (const commission of commissions) {
      if (commission.status === CommissionStatus.PENDING || commission.status === CommissionStatus.SETTLING) {
        await commissionDao.update(
          { status: CommissionStatus.DEDUCTED as any, remark: reason } as any,
          { where: { id: commission.id } }
        );

        const deductAmount = Number(commission.amount);
        const promoter = await promoterDao.findById(commission.promoterId);
        if (promoter) {
          const available = Number(promoter.availableCommission || 0);
          if (MoneyUtils.isGreaterOrEqual(available, deductAmount)) {
            await promoterDao.updateCommission(
              commission.promoterId,
              -deductAmount,
              -deductAmount
            );
          } else {
            await promoterDao.updateCommission(
              commission.promoterId,
              -deductAmount,
              -available
            );
          }
        }

        await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${commission.promoterId}`);
      }
    }

    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
    await CacheUtils.delPattern(`${CacheKey.COMMISSION_LIST}*`);
    await CacheUtils.del(`${CacheKey.COMMISSION_SUMMARY}`);
  }

  public async calculateMarketingBonus(orderId: string, marketingId: string): Promise<CommissionCalcResult | null> {
    const order = await orderDao.findById(orderId);
    if (!order || !order.promoterId) {
      return null;
    }

    const { marketingDao } = await import('../dao');
    const marketing = await marketingDao.findById(marketingId);
    if (!marketing) {
      return null;
    }

    if (marketing.status !== 1) {
      return null;
    }

    const now = new Date();
    if (marketing.endTime && new Date(marketing.endTime) < now) {
      return null;
    }
    if (marketing.startTime && new Date(marketing.startTime) > now) {
      return null;
    }

    const bonusRate = marketing.maxCommissionRate ? Number(marketing.maxCommissionRate) : 0;
    if (bonusRate <= 0) {
      return null;
    }

    const payAmount = Number(order.payAmount || order.totalAmount || 0);
    const bonusAmount = MoneyUtils.multiply(payAmount, bonusRate / 100);

    await commissionDao.create({
      orderId: order.id,
      orderNo: order.orderNo,
      promoterId: order.promoterId,
      channelId: order.channelId,
      type: 2,
      amount: bonusAmount,
      rate: bonusRate,
      status: CommissionStatus.PENDING as any,
      remark: `营销活动加成: ${marketing.name}`,
      sourceType: 'marketing_bonus',
      calcRule: {
        rateSource: 'marketing',
        formula: `payAmount * bonusRate / 100`,
        payAmount,
        bonusRate,
        marketingId,
        marketingName: marketing.name,
      },
    } as any);

    await promoterDao.updateCommission(order.promoterId, bonusAmount, bonusAmount);

    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${order.promoterId}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
    await CacheUtils.delPattern(`${CacheKey.COMMISSION_LIST}*`);
    await CacheUtils.del(`${CacheKey.COMMISSION_SUMMARY}`);
    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
    await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${marketingId}`);

    return {
      promoterId: order.promoterId,
      orderId: order.id,
      orderNo: order.orderNo,
      channelId: order.channelId || undefined,
      amount: bonusAmount,
      rate: bonusRate,
      type: 2,
    };
  }
}

export default new CommissionEngineService();
