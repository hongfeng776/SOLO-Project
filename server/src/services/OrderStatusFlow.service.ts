import { distributionOrderDao, orderStatusChangeLogDao, commissionDao, promoterDao, channelDao } from '../dao';
import { OrderStatus, CommissionStatus } from '../constants/enum';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import commissionEngineService from './CommissionEngine.service';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';

const STATUS_LABELS: Record<number, string> = {
  [OrderStatus.PENDING_PAY]: '待支付',
  [OrderStatus.PAID]: '已支付',
  [OrderStatus.SHIPPED]: '已发货',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.REFUNDING]: '退款中',
  [OrderStatus.REFUNDED]: '已退款',
};

const VALID_TRANSITIONS: Record<number, OrderStatus[]> = {
  [OrderStatus.PENDING_PAY]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDING],
  [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDING],
  [OrderStatus.COMPLETED]: [OrderStatus.REFUNDING],
  [OrderStatus.REFUNDING]: [OrderStatus.REFUNDED, OrderStatus.COMPLETED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

const TERMINAL_STATUSES: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.REFUNDED];

const COMMISSION_IMPACT_STATUSES: OrderStatus[] = [
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDING,
  OrderStatus.REFUNDED,
];

const MALICIOUS_CHANGE_THRESHOLD = {
  OPERATOR_WINDOW_MINUTES: 5,
  OPERATOR_MAX_CHANGES: 50,
  IP_WINDOW_MINUTES: 5,
  IP_MAX_CHANGES: 100,
};

export interface StatusTransitionResult {
  success: boolean;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  commissionAffected: boolean;
  commissionChangeAmount: number;
  promoterSynced: boolean;
  channelSynced: boolean;
  message: string;
}

export interface StatusTransitionValidation {
  valid: boolean;
  message?: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  requiresReason: boolean;
  commissionImpact: boolean;
  warnings: string[];
}

export interface BatchStatusCheckResult {
  totalCount: number;
  abnormalCount: number;
  pendingReviewCount: number;
  normalFulfillmentCount: number;
  filteredIds: string[];
  filterReason: string;
}

class OrderStatusFlowService {
  public validateTransition(fromStatus: OrderStatus, toStatus: OrderStatus): StatusTransitionValidation {
    const warnings: string[] = [];
    let requiresReason = false;

    if (fromStatus === toStatus) {
      return {
        valid: false,
        message: '目标状态与当前状态相同，无需变更',
        fromStatus,
        toStatus,
        requiresReason: false,
        commissionImpact: false,
        warnings,
      };
    }

    if (TERMINAL_STATUSES.includes(fromStatus)) {
      return {
        valid: false,
        message: `${STATUS_LABELS[fromStatus]}为终态，禁止状态变更`,
        fromStatus,
        toStatus,
        requiresReason: false,
        commissionImpact: false,
        warnings,
      };
    }

    if (fromStatus === OrderStatus.COMPLETED && !VALID_TRANSITIONS[OrderStatus.COMPLETED].includes(toStatus)) {
      return {
        valid: false,
        message: '已完成订单禁止退回修改',
        fromStatus,
        toStatus,
        requiresReason: false,
        commissionImpact: false,
        warnings,
      };
    }

    const allowed = VALID_TRANSITIONS[fromStatus];
    if (!allowed || !allowed.includes(toStatus)) {
      return {
        valid: false,
        message: `订单状态不能从【${STATUS_LABELS[fromStatus]}】变更为【${STATUS_LABELS[toStatus]}】，禁止越级修改`,
        fromStatus,
        toStatus,
        requiresReason: false,
        commissionImpact: false,
        warnings,
      };
    }

    const commissionImpact = COMMISSION_IMPACT_STATUSES.includes(toStatus);

    if (toStatus === OrderStatus.CANCELLED) {
      requiresReason = true;
      warnings.push('取消订单将联动锁定/扣减对应佣金结算数据');
    }

    if (toStatus === OrderStatus.REFUNDING) {
      requiresReason = true;
      warnings.push('退款将终止佣金核算，已结算佣金将触发追回流程');
    }

    if (toStatus === OrderStatus.REFUNDED) {
      requiresReason = true;
      warnings.push('已退款订单佣金将被追回');
    }

    return {
      valid: true,
      fromStatus,
      toStatus,
      requiresReason,
      commissionImpact,
      warnings,
    };
  }

  public async executeStatusChange(
    orderId: string,
    toStatus: OrderStatus,
    operatorId: string,
    operatorName: string,
    reason?: string,
    ip?: string,
    userAgent?: string
  ): Promise<StatusTransitionResult> {
    const order = await distributionOrderDao.findById(orderId);
    if (!order) {
      throw new AppError('订单不存在', BusinessCode.NOT_FOUND);
    }

    const fromStatus = order.status as OrderStatus;

    const validation = this.validateTransition(fromStatus, toStatus);
    if (!validation.valid) {
      throw new AppError(validation.message!, BusinessCode.ERROR);
    }

    if (validation.requiresReason && !reason) {
      throw new AppError(`状态变更为【${STATUS_LABELS[toStatus]}】必须填写变更原因`, BusinessCode.PARAM_ERROR);
    }

    const consistency = await orderStatusChangeLogDao.validateChangeConsistency(orderId, fromStatus);
    if (!consistency.valid) {
      throw new AppError(`状态一致性校验失败: ${consistency.message}`, BusinessCode.ERROR);
    }

    if (ip) {
      await this.checkMaliciousBehavior(operatorId, ip);
    }

    const updateData: any = { status: toStatus };

    switch (toStatus) {
      case OrderStatus.PAID:
        updateData.payTime = new Date();
        break;
      case OrderStatus.SHIPPED:
        updateData.shipTime = new Date();
        break;
      case OrderStatus.COMPLETED:
        updateData.completeTime = new Date();
        break;
      case OrderStatus.CANCELLED:
        updateData.cancelTime = new Date();
        if (reason) updateData.cancelReason = reason;
        break;
    }

    await distributionOrderDao.updateStatus(orderId, updateData);

    let commissionAffected = false;
    let commissionChangeAmount = 0;
    let promoterSynced = false;
    let channelSynced = false;

    if (toStatus === OrderStatus.PAID && order.promoterId) {
      try {
        await commissionEngineService.calculateFromOrder(orderId);
        commissionAffected = true;
      } catch (err) {
        console.error('Commission calculation error on PAID:', err);
      }
    }

    if (toStatus === OrderStatus.COMPLETED && order.promoterId) {
      try {
        const commissions = await commissionDao.findByOrderId(orderId);
        for (const commission of commissions) {
          if (commission.status === CommissionStatus.PENDING) {
            await commissionDao.update(
              { status: CommissionStatus.SETTLING as any } as any,
              { where: { id: commission.id } }
            );
          }
        }
      } catch (err) {
        console.error('Commission settling error on COMPLETED:', err);
      }
    }

    if (toStatus === OrderStatus.CANCELLED && order.promoterId) {
      try {
        await commissionEngineService.deductFromOrder(orderId, `订单取消，佣金扣减: ${reason || ''}`);
        commissionAffected = true;
        const commissions = await commissionDao.findByOrderId(orderId);
        commissionChangeAmount = commissions.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      } catch (err) {
        console.error('Commission deduction error on CANCELLED:', err);
      }
    }

    if (toStatus === OrderStatus.REFUNDING && order.promoterId) {
      try {
        const commissions = await commissionDao.findByOrderId(orderId);
        for (const commission of commissions) {
          if (commission.status === CommissionStatus.PENDING || commission.status === CommissionStatus.SETTLING) {
            await commissionDao.update(
              { status: CommissionStatus.DEDUCTED as any, remark: `订单退款中，佣金锁定: ${reason || ''}` } as any,
              { where: { id: commission.id } }
            );
            commissionAffected = true;
            commissionChangeAmount += Number(commission.amount || 0);
          }
        }
      } catch (err) {
        console.error('Commission lock error on REFUNDING:', err);
      }
    }

    if (toStatus === OrderStatus.REFUNDED && order.promoterId) {
      try {
        const commissions = await commissionDao.findByOrderId(orderId);
        for (const commission of commissions) {
          if (commission.status === CommissionStatus.SETTLED) {
            const deductAmount = Number(commission.amount);
            await commissionDao.update(
              { status: CommissionStatus.DEDUCTED as any, remark: `订单已退款，佣金追回: ${reason || ''}` } as any,
              { where: { id: commission.id } }
            );
            commissionAffected = true;
            commissionChangeAmount += deductAmount;

            const promoter = await promoterDao.findById(commission.promoterId);
            if (promoter) {
              const available = Number(promoter.availableCommission || 0);
              const deductFromAvailable = Math.min(available, deductAmount);
              await promoterDao.updateCommission(commission.promoterId, -deductAmount, -deductFromAvailable);
              promoterSynced = true;
            }
          } else if (commission.status === CommissionStatus.PENDING || commission.status === CommissionStatus.SETTLING) {
            await commissionDao.update(
              { status: CommissionStatus.DEDUCTED as any, remark: `订单已退款，佣金扣减: ${reason || ''}` } as any,
              { where: { id: commission.id } }
            );
            commissionAffected = true;
            commissionChangeAmount += Number(commission.amount || 0);
          }
        }
      } catch (err) {
        console.error('Commission recovery error on REFUNDED:', err);
      }
    }

    if (order.promoterId && (toStatus === OrderStatus.PAID || toStatus === OrderStatus.COMPLETED || commissionAffected)) {
      try {
        await this.syncPromoterPerformance(order.promoterId);
        promoterSynced = true;
      } catch (err) {
        console.error('Promoter performance sync error:', err);
      }
    }

    if (order.channelId && (toStatus === OrderStatus.PAID || toStatus === OrderStatus.COMPLETED || commissionAffected)) {
      try {
        await this.syncChannelPerformance(order.channelId);
        channelSynced = true;
      } catch (err) {
        console.error('Channel performance sync error:', err);
      }
    }

    const relatedDataChanges: any = {};
    if (commissionAffected) {
      relatedDataChanges.commission = { affected: true, changeAmount: commissionChangeAmount };
    }
    if (promoterSynced) {
      relatedDataChanges.promoter = { synced: true, promoterId: order.promoterId };
    }
    if (channelSynced) {
      relatedDataChanges.channel = { synced: true, channelId: order.channelId };
    }

    await orderStatusChangeLogDao.create({
      orderId,
      orderNo: order.orderNo,
      fromStatus,
      toStatus,
      reason,
      operatorId,
      operatorName,
      commissionAffected,
      commissionChangeAmount: commissionChangeAmount > 0 ? commissionChangeAmount : undefined,
      promoterId: order.promoterId,
      channelId: order.channelId,
      relatedDataChanges: Object.keys(relatedDataChanges).length > 0 ? relatedDataChanges : undefined,
      ip,
      userAgent,
    });

    await CacheUtils.del(`${CacheKey.ORDER_DETAIL}${orderId}`);
    await CacheUtils.delPattern(`${CacheKey.ORDER_LIST}*`);
    if (order.promoterId) {
      await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${order.promoterId}`);
      await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
    }
    if (order.channelId) {
      await CacheUtils.delPattern(`${CacheKey.CHANNEL_LIST}*`);
    }
    await CacheUtils.delPattern(`${CacheKey.COMMISSION_LIST}*`);
    await CacheUtils.del(`${CacheKey.COMMISSION_SUMMARY}`);

    const updatedOrder = await distributionOrderDao.findById(orderId);

    return {
      success: true,
      orderId,
      fromStatus,
      toStatus,
      commissionAffected,
      commissionChangeAmount,
      promoterSynced,
      channelSynced,
      message: `订单状态已从【${STATUS_LABELS[fromStatus]}】变更为【${STATUS_LABELS[toStatus]}】`,
    };
  }

  public async batchVerifyStatus(ids: string[]): Promise<BatchStatusCheckResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要核对的订单', BusinessCode.PARAM_ERROR);
    }

    const orders = await distributionOrderDao.findByIds(ids);
    const abnormalStatuses = [OrderStatus.REFUNDING, OrderStatus.REFUNDED, OrderStatus.CANCELLED];
    const pendingReviewStatuses = [OrderStatus.PAID, OrderStatus.SHIPPED];
    const normalFulfillmentStatuses = [OrderStatus.PENDING_PAY, OrderStatus.COMPLETED];

    const abnormalOrders = orders.filter((o: any) => abnormalStatuses.includes(o.status));
    const pendingReviewOrders = orders.filter((o: any) => pendingReviewStatuses.includes(o.status));
    const normalOrders = orders.filter((o: any) => normalFulfillmentStatuses.includes(o.status));

    const filteredIds = orders
      .filter((o: any) => abnormalStatuses.includes(o.status) || pendingReviewStatuses.includes(o.status))
      .map((o: any) => o.id);

    let filterReason = '';
    if (normalOrders.length > 0) {
      filterReason = `已过滤${normalOrders.length}条正常履约订单，仅对异常和待复核订单生效`;
    }

    return {
      totalCount: orders.length,
      abnormalCount: abnormalOrders.length,
      pendingReviewCount: pendingReviewOrders.length,
      normalFulfillmentCount: normalOrders.length,
      filteredIds,
      filterReason,
    };
  }

  public async batchConfirmAbnormal(ids: string[], operatorId: string, operatorName: string, reason?: string, ip?: string): Promise<StatusTransitionResult[]> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要确认的异常订单', BusinessCode.PARAM_ERROR);
    }
    if (ids.length > 200) {
      throw new AppError('单次批量操作不能超过200条记录', BusinessCode.PARAM_ERROR);
    }

    const verifyResult = await this.batchVerifyStatus(ids);
    if (verifyResult.filteredIds.length === 0) {
      throw new AppError('所选订单均为正常履约订单，无需确认', BusinessCode.PARAM_ERROR);
    }

    const results: StatusTransitionResult[] = [];
    const targetStatuses: Record<number, OrderStatus> = {
      [OrderStatus.REFUNDING]: OrderStatus.REFUNDED,
    };

    for (const id of verifyResult.filteredIds) {
      const order = await distributionOrderDao.findById(id);
      if (!order) continue;

      const currentStatus = order.status as OrderStatus;
      const targetStatus = targetStatuses[currentStatus];

      if (targetStatus) {
        try {
          const result = await this.executeStatusChange(
            id,
            targetStatus,
            operatorId,
            operatorName,
            reason || '批量确认异常订单',
            ip
          );
          results.push(result);
        } catch (err: any) {
          results.push({
            success: false,
            orderId: id,
            fromStatus: currentStatus,
            toStatus: targetStatus,
            commissionAffected: false,
            commissionChangeAmount: 0,
            promoterSynced: false,
            channelSynced: false,
            message: err.message || '状态变更失败',
          });
        }
      }
    }

    return results;
  }

  public async getStatusChangeLog(
    orderId: string,
    page: number,
    pageSize: number
  ): Promise<{ list: any[]; total: number; page: number; pageSize: number }> {
    const where: any = {};
    if (orderId) {
      where.orderId = orderId;
    }

    const offset = (page - 1) * pageSize;
    const { rows, count } = await orderStatusChangeLogDao.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize,
    };
  }

  public async validateChangeCompliance(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    operatorId: string,
    ip?: string
  ): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];

    const transition = this.validateTransition(fromStatus, toStatus);
    if (!transition.valid) {
      issues.push(transition.message!);
    }

    const consistency = await orderStatusChangeLogDao.validateChangeConsistency(orderId, fromStatus);
    if (!consistency.valid) {
      issues.push(consistency.message!);
    }

    const recentChanges = await orderStatusChangeLogDao.getRecentChangesByOrder(orderId, 5);
    if (recentChanges.length >= 3) {
      const timeSpan = recentChanges[0].createdAt.getTime() - recentChanges[recentChanges.length - 1].createdAt.getTime();
      if (timeSpan < 10 * 60 * 1000) {
        issues.push('该订单近期状态变更频繁（10分钟内3次以上），存在异常操作嫌疑');
      }
    }

    if (TERMINAL_STATUSES.includes(fromStatus)) {
      const recentTerminalChanges = recentChanges.filter(
        (c) => TERMINAL_STATUSES.includes(c.toStatus)
      );
      if (recentTerminalChanges.length > 0) {
        issues.push('订单已处于终态，检测到尝试篡改终态状态的行为');
      }
    }

    if (ip) {
      try {
        const maliciousCheck = await this.checkMaliciousBehaviorSilent(operatorId, ip);
        if (maliciousCheck.isMalicious) {
          issues.push(maliciousCheck.reason!);
        }
      } catch (err) {
        console.error('Malicious behavior check error:', err);
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  private async checkMaliciousBehavior(operatorId: string, ip: string): Promise<void> {
    const now = new Date();
    const operatorWindowStart = new Date(
      now.getTime() - MALICIOUS_CHANGE_THRESHOLD.OPERATOR_WINDOW_MINUTES * 60 * 1000
    );
    const ipWindowStart = new Date(
      now.getTime() - MALICIOUS_CHANGE_THRESHOLD.IP_WINDOW_MINUTES * 60 * 1000
    );

    const operatorCount = await orderStatusChangeLogDao.countByOperatorInTimeWindow(
      operatorId,
      operatorWindowStart,
      now
    );
    if (operatorCount >= MALICIOUS_CHANGE_THRESHOLD.OPERATOR_MAX_CHANGES) {
      throw new AppError(
        `操作人${MALICIOUS_CHANGE_THRESHOLD.OPERATOR_WINDOW_MINUTES}分钟内已执行${operatorCount}次状态变更，涉嫌恶意操作已被拦截`,
        BusinessCode.FREQUENCY_LIMIT
      );
    }

    if (ip) {
      const ipCount = await orderStatusChangeLogDao.countByIpInTimeWindow(ip, ipWindowStart, now);
      if (ipCount >= MALICIOUS_CHANGE_THRESHOLD.IP_MAX_CHANGES) {
        throw new AppError(
          `当前IP${MALICIOUS_CHANGE_THRESHOLD.IP_WINDOW_MINUTES}分钟内已执行${ipCount}次状态变更，涉嫌恶意操作已被拦截`,
          BusinessCode.FREQUENCY_LIMIT
        );
      }
    }
  }

  private async checkMaliciousBehaviorSilent(
    operatorId: string,
    ip: string
  ): Promise<{ isMalicious: boolean; reason?: string }> {
    try {
      const now = new Date();
      const operatorWindowStart = new Date(
        now.getTime() - MALICIOUS_CHANGE_THRESHOLD.OPERATOR_WINDOW_MINUTES * 60 * 1000
      );

      const operatorCount = await orderStatusChangeLogDao.countByOperatorInTimeWindow(
        operatorId,
        operatorWindowStart,
        now
      );
      if (operatorCount >= MALICIOUS_CHANGE_THRESHOLD.OPERATOR_MAX_CHANGES * 0.8) {
        return {
          isMalicious: true,
          reason: `操作人近期状态变更次数已达阈值80%（${operatorCount}/${MALICIOUS_CHANGE_THRESHOLD.OPERATOR_MAX_CHANGES}）`,
        };
      }

      return { isMalicious: false };
    } catch (err) {
      return { isMalicious: false };
    }
  }

  private async syncPromoterPerformance(promoterId: string): Promise<void> {
    try {
      const promoter = await promoterDao.findById(promoterId);
      if (!promoter) return;

      const orderStats = await distributionOrderDao.getStatistics({
        page: 1,
        pageSize: 1,
        promoterId,
      });

      const updateData: any = {
        totalOrders: orderStats.total,
        totalAmount: orderStats.totalAmount,
        totalCommission: orderStats.totalCommission,
      };

      await promoterDao.update(updateData, { where: { id: promoterId } });
    } catch (err) {
      console.error('Sync promoter performance error:', err);
    }
  }

  private async syncChannelPerformance(channelId: string): Promise<void> {
    try {
      const channel = await channelDao.findById(channelId);
      if (!channel) return;

      const orderStats = await distributionOrderDao.getStatistics({
        page: 1,
        pageSize: 1,
        channelId,
      });

      const updateData: any = {
        monthlyAmount: orderStats.totalAmount,
        monthlyOrders: orderStats.total,
      };

      await channelDao.update(updateData as any, { where: { id: channelId } });
    } catch (err) {
      console.error('Sync channel performance error:', err);
    }
  }
}

export default new OrderStatusFlowService();
