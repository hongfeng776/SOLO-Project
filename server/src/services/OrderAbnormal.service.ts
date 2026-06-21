import {
  orderAbnormalRecordDao,
  orderAbnormalEvidenceDao,
  distributionOrderDao,
  commissionDao,
  orderDao,
  promoterDao,
  channelDao,
  orderStatusChangeLogDao,
} from '../dao';
import { Op } from 'sequelize';
import {
  OrderAbnormalType,
  OrderAbnormalSeverity,
  OrderAbnormalStatus,
  OrderAbnormalSource,
  OrderAbnormalReviewAction,
  ORDER_ABNORMAL_DETECTION_RULES,
  ORDER_ABNORMAL_TYPE_LABELS,
  OrderStatus,
  CommissionStatus,
  AbnormalRootCause,
  AbnormalEvidenceItem,
} from '../constants/enum';
import { AppError } from '../middleware/error.middleware';
import { BusinessCode } from '../constants/statusCode';
import CacheUtils, { CacheKey } from '../utils/cache';
import MoneyUtils from '../utils/money';

export interface AbnormalDetectionResult {
  detected: boolean;
  types: OrderAbnormalType[];
  severity: OrderAbnormalSeverity;
  evidence: any;
  rootCauses: AbnormalRootCause[];
}

export interface AbnormalReviewParams {
  abnormalRecordId: string;
  action: OrderAbnormalReviewAction;
  conclusion: string;
  evidences?: AbnormalEvidenceItem[];
  operatorId: string;
  operatorName: string;
}

export interface AbnormalReviewResult {
  success: boolean;
  orderId: string;
  abnormalRecordId: string;
  action: OrderAbnormalReviewAction;
  orderStatusUpdated: boolean;
  commissionStatus: CommissionStatus | null;
  commissionChangeAmount: number;
  promoterSynced: boolean;
  channelSynced: boolean;
  message: string;
}

export interface BatchAbnormalProcessParams {
  abnormalRecordIds: string[];
  action: OrderAbnormalReviewAction;
  conclusion: string;
  evidences?: AbnormalEvidenceItem[];
  operatorId: string;
  operatorName: string;
}

export interface BatchAbnormalProcessResult {
  total: number;
  successCount: number;
  failCount: number;
  results: Array<{ abnormalRecordId: string; orderId: string; success: boolean; reason?: string }>;
  reportUrl?: string;
  generatedAt: Date;
}

export interface AbnormalRootCauseAnalysis {
  orderId: string;
  abnormalTypes: OrderAbnormalType[];
  rootCauses: Array<AbnormalRootCause & { evidence?: string }>;
  promoterRelatedAbnormals: number;
  channelRelatedAbnormals: number;
  suggestions: string[];
  riskOptimizations: string[];
}

const HIGH_RISK_TYPES: OrderAbnormalType[] = [
  OrderAbnormalType.FAKE_ORDER,
  OrderAbnormalType.BRUSH_ORDER,
  OrderAbnormalType.REFUND_ABNORMAL,
];

const MEDIUM_RISK_TYPES: OrderAbnormalType[] = [
  OrderAbnormalType.TIMEOUT_UNPAID,
  OrderAbnormalType.DATA_MISMATCH,
  OrderAbnormalType.ABNORMAL_DEVICE,
  OrderAbnormalType.ABNORMAL_IP,
];

function getSeverity(types: OrderAbnormalType[]): OrderAbnormalSeverity {
  const highRiskCount = types.filter(t => HIGH_RISK_TYPES.includes(t)).length;
  const mediumRiskCount = types.filter(t => MEDIUM_RISK_TYPES.includes(t)).length;

  if (highRiskCount >= 2) {
    return OrderAbnormalSeverity.CRITICAL;
  }
  if (highRiskCount >= 1 || mediumRiskCount >= 2) {
    return OrderAbnormalSeverity.HIGH;
  }
  if (mediumRiskCount >= 1) {
    return OrderAbnormalSeverity.MEDIUM;
  }
  return OrderAbnormalSeverity.LOW;
}

function getTypeLabels(types: OrderAbnormalType[]): string[] {
  return types.map(t => ORDER_ABNORMAL_TYPE_LABELS[t]?.label || t);
}

async function clearRelatedCaches(orderId: string, promoterId?: string, channelId?: string) {
  await CacheUtils.del(`${CacheKey.ORDER_DETAIL}${orderId}`);
  await CacheUtils.delPattern(`${CacheKey.ORDER_LIST}*`);
  await CacheUtils.delPattern(`${CacheKey.COMMISSION_LIST}*`);
  await CacheUtils.del(`${CacheKey.COMMISSION_SUMMARY}`);
  if (promoterId) {
    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${promoterId}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }
  if (channelId) {
    await CacheUtils.del(`${CacheKey.CHANNEL_DETAIL}${channelId}`);
    await CacheUtils.delPattern(`${CacheKey.CHANNEL_LIST}*`);
  }
}

class OrderAbnormalService {
  public async detectAbnormal(orderId: string): Promise<AbnormalDetectionResult> {
    const order = await orderDao.findById(orderId);
    if (!order) {
      throw new AppError('订单不存在', BusinessCode.NOT_FOUND);
    }

    const types: OrderAbnormalType[] = [];
    const evidence: any = {};
    const rootCauses: AbnormalRootCause[] = [];

    const now = new Date();
    const orderPlain = order.get({ plain: true });

    if (orderPlain.status === OrderStatus.PENDING_PAY) {
      const createdAt = new Date(orderPlain.createdAt);
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      if (diffMinutes > ORDER_ABNORMAL_DETECTION_RULES.timeoutUnpaidMinutes) {
        types.push(OrderAbnormalType.TIMEOUT_UNPAID);
        evidence.timeoutUnpaid = {
          createdAt: createdAt.toISOString(),
          pendingMinutes: Math.floor(diffMinutes),
          thresholdMinutes: ORDER_ABNORMAL_DETECTION_RULES.timeoutUnpaidMinutes,
        };
        rootCauses.push({
          category: 'user',
          description: `订单待付款超时${Math.floor(diffMinutes)}分钟，超过阈值${ORDER_ABNORMAL_DETECTION_RULES.timeoutUnpaidMinutes}分钟`,
          confidence: 0.9,
        });
      }
    }

    if (orderPlain.promoterId) {
      const windowStart = new Date(now.getTime() - ORDER_ABNORMAL_DETECTION_RULES.brushOrderSameUserWindowMinutes * 60 * 1000);
      const recentOrders = await orderDao.findAll({
        where: {
          promoterId: orderPlain.promoterId,
          createdAt: { [Op.gte]: windowStart },
        },
      });
      if (recentOrders.length >= ORDER_ABNORMAL_DETECTION_RULES.brushOrderSameUserCount) {
        types.push(OrderAbnormalType.BRUSH_ORDER);
        evidence.brushOrderHighFrequency = {
          promoterId: orderPlain.promoterId,
          windowMinutes: ORDER_ABNORMAL_DETECTION_RULES.brushOrderSameUserWindowMinutes,
          orderCount: recentOrders.length,
          threshold: ORDER_ABNORMAL_DETECTION_RULES.brushOrderSameUserCount,
        };
        rootCauses.push({
          category: 'promoter',
          description: `推客${orderPlain.promoterId}在${ORDER_ABNORMAL_DETECTION_RULES.brushOrderSameUserWindowMinutes}分钟内下单${recentOrders.length}次，涉嫌刷单`,
          relatedIds: [orderPlain.promoterId],
          confidence: 0.8,
        });
      }

      if (orderPlain.remark) {
        const ipMatch = orderPlain.remark.match(/ip[=:]([^\s,;]+)/i);
        const deviceMatch = orderPlain.remark.match(/device[=:]([^\s,;]+)/i);
        const userIdMatch = orderPlain.userId || orderPlain.remark.match(/userId[=:]([^\s,;]+)/i);

        if (ipMatch) {
          const ipOrders = await orderDao.findAll({
            where: {
              remark: { [Op.like]: `%ip${ipMatch[0].charAt(2)}${ipMatch[1]}%` },
              createdAt: { [Op.gte]: windowStart },
            },
          });
          if (ipOrders.length >= ORDER_ABNORMAL_DETECTION_RULES.brushOrderSameIpCount) {
            if (!types.includes(OrderAbnormalType.BRUSH_ORDER)) {
              types.push(OrderAbnormalType.BRUSH_ORDER);
            }
            types.push(OrderAbnormalType.ABNORMAL_IP);
            evidence.brushOrderSameIp = {
              ip: ipMatch[1],
              orderCount: ipOrders.length,
              threshold: ORDER_ABNORMAL_DETECTION_RULES.brushOrderSameIpCount,
            };
          }
        }

        if (deviceMatch) {
          const deviceOrders = await orderDao.findAll({
            where: {
              remark: { [Op.like]: `%device${deviceMatch[0].charAt(6)}${deviceMatch[1]}%` },
              createdAt: { [Op.gte]: windowStart },
            },
          });
          if (deviceOrders.length >= ORDER_ABNORMAL_DETECTION_RULES.brushOrderSameDeviceCount) {
            if (!types.includes(OrderAbnormalType.BRUSH_ORDER)) {
              types.push(OrderAbnormalType.BRUSH_ORDER);
            }
            types.push(OrderAbnormalType.ABNORMAL_DEVICE);
            evidence.brushOrderSameDevice = {
              device: deviceMatch[1],
              orderCount: deviceOrders.length,
              threshold: ORDER_ABNORMAL_DETECTION_RULES.brushOrderSameDeviceCount,
            };
          }
        }
      }

      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const promoterOrders7Days = await orderDao.findAll({
        where: {
          promoterId: orderPlain.promoterId,
          createdAt: { [Op.gte]: sevenDaysAgo },
        },
      });
      if (promoterOrders7Days.length >= ORDER_ABNORMAL_DETECTION_RULES.refundAbnormalMinOrders) {
        const refundCount = promoterOrders7Days.filter(
          o => (o as any).status === OrderStatus.REFUNDED || (o as any).status === OrderStatus.REFUNDING
        ).length;
        const refundRate = refundCount / promoterOrders7Days.length;
        if (refundRate > ORDER_ABNORMAL_DETECTION_RULES.refundAbnormalRateThreshold) {
          types.push(OrderAbnormalType.REFUND_ABNORMAL);
          evidence.refundAbnormal = {
            promoterId: orderPlain.promoterId,
            totalOrders: promoterOrders7Days.length,
            refundCount,
            refundRate: refundRate.toFixed(4),
            thresholdRate: ORDER_ABNORMAL_DETECTION_RULES.refundAbnormalRateThreshold,
          };
          rootCauses.push({
            category: 'promoter',
            description: `推客${orderPlain.promoterId}7天内退款率${(refundRate * 100).toFixed(2)}%，超过阈值${(ORDER_ABNORMAL_DETECTION_RULES.refundAbnormalRateThreshold * 100).toFixed(0)}%`,
            relatedIds: [orderPlain.promoterId],
            confidence: 0.75,
          });
        }
      }
    }

    const unitPrice = Number(orderPlain.unitPrice || 0);
    const quantity = Number(orderPlain.quantity || 0);
    const payAmount = Number(orderPlain.payAmount || 0);
    const discountAmount = Number(orderPlain.discountAmount || 0);

    const costThreshold = MoneyUtils.multiply(MoneyUtils.multiply(unitPrice, quantity), 0.3);
    const isPriceAbnormal = MoneyUtils.isGreater(costThreshold, payAmount) && payAmount > 0;
    const isDataMissing = !orderPlain.productName || !orderPlain.receiverPhone || !orderPlain.receiverAddress;

    if (isPriceAbnormal || isDataMissing) {
      types.push(OrderAbnormalType.FAKE_ORDER);
      evidence.fakeOrder = {
        isPriceAbnormal,
        isDataMissing,
        payAmount,
        costThreshold,
        missingFields: {
          productName: !orderPlain.productName,
          receiverPhone: !orderPlain.receiverPhone,
          receiverAddress: !orderPlain.receiverAddress,
        },
      };
      if (isPriceAbnormal) {
        rootCauses.push({
          category: 'product',
          description: `订单实付金额${payAmount}远低于成本阈值${costThreshold}，疑似虚假订单`,
          confidence: 0.85,
        });
      }
      if (isDataMissing) {
        rootCauses.push({
          category: 'system',
          description: '订单关键信息缺失（商品名称/收件人电话/地址），疑似虚假订单',
          confidence: 0.8,
        });
      }
    }

    const expectedAmount = MoneyUtils.subtract(MoneyUtils.multiply(unitPrice, quantity), discountAmount);
    const diff = MoneyUtils.subtract(payAmount, expectedAmount);
    const tolerance = MoneyUtils.multiply(expectedAmount, ORDER_ABNORMAL_DETECTION_RULES.dataMismatchToleranceRate);
    const absDiff = diff < 0 ? MoneyUtils.multiply(diff, -1) : diff;

    if (!MoneyUtils.isEqual(payAmount, expectedAmount) && MoneyUtils.isGreater(absDiff, tolerance)) {
      types.push(OrderAbnormalType.DATA_MISMATCH);
      evidence.dataMismatch = {
        payAmount,
        expectedAmount,
        diff,
        tolerance,
        toleranceRate: ORDER_ABNORMAL_DETECTION_RULES.dataMismatchToleranceRate,
      };
      rootCauses.push({
        category: 'system',
        description: `订单支付金额${payAmount}与计算金额${expectedAmount}差异${diff}，超出容差范围`,
        confidence: 0.95,
      });
    }

    const uniqueTypes = [...new Set(types)];
    const severity = getSeverity(uniqueTypes);
    const detected = uniqueTypes.length > 0;

    if (detected) {
      const title = `订单异常：${getTypeLabels(uniqueTypes).join('、')}`;
      const description = `系统检测到订单存在${uniqueTypes.length}项异常：${getTypeLabels(uniqueTypes).join('、')}`;

      const abnormalRecord = await orderAbnormalRecordDao.create({
        orderId: orderPlain.id,
        orderNo: orderPlain.orderNo,
        abnormalTypes: uniqueTypes,
        severity,
        status: OrderAbnormalStatus.PENDING_REVIEW,
        source: OrderAbnormalSource.SYSTEM_AUTO,
        title,
        description,
        evidence,
        isLocked: true,
        autoSettleBlocked: true,
        commissionBlocked: true,
        promoterId: orderPlain.promoterId,
        channelId: orderPlain.channelId,
        commissionAmount: Number(orderPlain.commissionAmount || 0),
        detectedAt: now,
        rootCauses,
      } as any);

      if (orderPlain.promoterId) {
        const commissions = await commissionDao.findByOrderId(orderPlain.id);
        for (const commission of commissions) {
          if (
            (commission as any).status === CommissionStatus.PENDING ||
            (commission as any).status === CommissionStatus.SETTLING
          ) {
            await commissionDao.update(
              { status: CommissionStatus.DEDUCTED as any },
              { where: { id: (commission as any).id } }
            );
          }
        }
      }

      await clearRelatedCaches(orderPlain.id, orderPlain.promoterId, orderPlain.channelId);
    }

    return {
      detected,
      types: uniqueTypes,
      severity,
      evidence,
      rootCauses,
    };
  }

  public async createManualAbnormal(
    orderId: string,
    abnormalTypes: OrderAbnormalType[],
    severity?: OrderAbnormalSeverity,
    title?: string,
    description?: string,
    operatorId?: string,
    operatorName?: string
  ): Promise<any> {
    const order = await orderDao.findById(orderId);
    if (!order) {
      throw new AppError('订单不存在', BusinessCode.NOT_FOUND);
    }
    if (!abnormalTypes || abnormalTypes.length === 0) {
      throw new AppError('请至少选择一种异常类型', BusinessCode.PARAM_ERROR);
    }

    const orderPlain = order.get({ plain: true });
    const finalSeverity = severity || getSeverity(abnormalTypes);
    const now = new Date();
    const finalTitle = title || `订单异常：${getTypeLabels(abnormalTypes).join('、')}`;

    const record = await orderAbnormalRecordDao.create({
      orderId: orderPlain.id,
      orderNo: orderPlain.orderNo,
      abnormalTypes,
      severity: finalSeverity,
      status: OrderAbnormalStatus.PENDING_REVIEW,
      source: OrderAbnormalSource.MANUAL_MARK,
      title: finalTitle,
      description,
      evidence: { markedBy: operatorName || '系统', markedAt: now.toISOString() },
      isLocked: true,
      autoSettleBlocked: true,
      commissionBlocked: true,
      promoterId: orderPlain.promoterId,
      channelId: orderPlain.channelId,
      commissionAmount: Number(orderPlain.commissionAmount || 0),
      detectedAt: now,
      detectedBy: operatorId,
    } as any);

    if (orderPlain.promoterId) {
      const commissions = await commissionDao.findByOrderId(orderPlain.id);
      for (const commission of commissions) {
        if (
          (commission as any).status === CommissionStatus.PENDING ||
          (commission as any).status === CommissionStatus.SETTLING
        ) {
          await commissionDao.update(
            { status: CommissionStatus.DEDUCTED as any },
            { where: { id: (commission as any).id } }
          );
        }
      }
    }

    await clearRelatedCaches(orderPlain.id, orderPlain.promoterId, orderPlain.channelId);

    return record;
  }

  public async reviewAbnormal(
    paramsOrRecordId: AbnormalReviewParams | any,
    operatorIdArg?: string,
    operatorNameArg?: string
  ): Promise<AbnormalReviewResult> {
    let abnormalRecordId: string;
    let action: OrderAbnormalReviewAction;
    let conclusion: string;
    let evidences: AbnormalEvidenceItem[] | undefined;
    let operatorId: string;
    let operatorName: string;

    if (typeof paramsOrRecordId === 'object' && paramsOrRecordId !== null && 'abnormalRecordId' in paramsOrRecordId) {
      abnormalRecordId = paramsOrRecordId.abnormalRecordId;
      action = paramsOrRecordId.action;
      conclusion = paramsOrRecordId.conclusion;
      evidences = paramsOrRecordId.evidences;
      operatorId = paramsOrRecordId.operatorId || operatorIdArg || 'system';
      operatorName = paramsOrRecordId.operatorName || operatorNameArg || '系统';
    } else {
      abnormalRecordId = paramsOrRecordId.abnormalRecordId || paramsOrRecordId;
      action = paramsOrRecordId.action;
      conclusion = paramsOrRecordId.conclusion;
      evidences = paramsOrRecordId.evidences;
      operatorId = operatorIdArg || paramsOrRecordId.operatorId || 'system';
      operatorName = operatorNameArg || paramsOrRecordId.operatorName || '系统';
    }

    const record = await orderAbnormalRecordDao.findById(abnormalRecordId);
    if (!record) {
      throw new AppError('异常记录不存在', BusinessCode.NOT_FOUND);
    }

    const recordPlain = record.get({ plain: true });
    if (
      recordPlain.status !== OrderAbnormalStatus.PENDING_REVIEW &&
      recordPlain.status !== OrderAbnormalStatus.REVIEWING
    ) {
      throw new AppError('该异常记录状态不允许复核', BusinessCode.ERROR);
    }

    const order = await orderDao.findById(recordPlain.orderId);
    if (!order) {
      throw new AppError('关联订单不存在', BusinessCode.NOT_FOUND);
    }

    const orderPlain = order.get({ plain: true });
    const now = new Date();

    if (evidences && evidences.length > 0) {
      for (const ev of evidences) {
        await orderAbnormalEvidenceDao.create({
          abnormalRecordId,
          orderId: recordPlain.orderId,
          fileName: ev.fileName,
          fileUrl: ev.fileUrl,
          fileSize: ev.fileSize,
          fileType: ev.fileType,
          uploadedAt: ev.uploadedAt || now,
          uploadedBy: operatorId,
        } as any);
      }
    }

    let orderStatusUpdated = false;
    let finalCommissionStatus: CommissionStatus | null = null;
    let commissionChangeAmount = 0;
    let promoterSynced = false;
    let channelSynced = false;
    let message = '';

    if (action === OrderAbnormalReviewAction.RELEASE) {
      await orderAbnormalRecordDao.update(abnormalRecordId, {
        status: OrderAbnormalStatus.RESOLVED as any,
        reviewAction: action,
        reviewConclusion: conclusion,
        reviewerId: operatorId,
        reviewerName: operatorName,
        reviewedAt: now,
        isLocked: false,
        autoSettleBlocked: false,
        commissionBlocked: false,
      } as any);

      const commissions = await commissionDao.findByOrderId(recordPlain.orderId);
      for (const commission of commissions) {
        if ((commission as any).status === CommissionStatus.DEDUCTED) {
          const targetStatus =
            orderPlain.status === OrderStatus.COMPLETED ? CommissionStatus.SETTLING : CommissionStatus.PENDING;
          await commissionDao.update(
            { status: targetStatus as any },
            { where: { id: (commission as any).id } }
          );
          finalCommissionStatus = targetStatus;
          commissionChangeAmount = MoneyUtils.add(commissionChangeAmount, Number((commission as any).amount || 0));
        }
      }

      if (recordPlain.promoterId && commissionChangeAmount > 0) {
        const promoter = await promoterDao.findById(recordPlain.promoterId);
        if (promoter) {
          const newAvailable = MoneyUtils.add(Number((promoter as any).availableCommission || 0), commissionChangeAmount);
          const newTotal = MoneyUtils.add(Number((promoter as any).totalCommission || 0), commissionChangeAmount);
          await promoterDao.update(
            { availableCommission: newAvailable, totalCommission: newTotal } as any,
            { where: { id: recordPlain.promoterId } }
          );
          promoterSynced = true;
        }
      }

      if (recordPlain.channelId && commissionChangeAmount > 0) {
        const channel = await channelDao.findById(recordPlain.channelId);
        if (channel) {
          const newMonthlyAmount = MoneyUtils.add(Number((channel as any).monthlyAmount || 0), commissionChangeAmount);
          const newMonthlyOrders = Number((channel as any).monthlyOrders || 0) + 1;
          await channelDao.update(
            { monthlyAmount: newMonthlyAmount, monthlyOrders: newMonthlyOrders } as any,
            { where: { id: recordPlain.channelId } }
          );
          channelSynced = true;
        }
      }

      message = '异常已放行，结算锁定已解除';
    } else if (action === OrderAbnormalReviewAction.REJECT) {
      const oldStatus = orderPlain.status;

      if (orderPlain.status !== OrderStatus.CANCELLED) {
        await orderDao.update(
          { status: OrderStatus.CANCELLED as any, cancelTime: now, cancelReason: conclusion } as any,
          { where: { id: recordPlain.orderId } }
        );
        orderStatusUpdated = true;

        await orderStatusChangeLogDao.create({
          orderId: recordPlain.orderId,
          orderNo: recordPlain.orderNo,
          fromStatus: oldStatus,
          toStatus: OrderStatus.CANCELLED,
          operatorId,
          operatorName,
          changeReason: `异常复核驳回：${conclusion}`,
          changedAt: now,
        } as any);
      }

      const commissions = await commissionDao.findByOrderId(recordPlain.orderId);
      for (const commission of commissions) {
        if (
          (commission as any).status === CommissionStatus.PENDING ||
          (commission as any).status === CommissionStatus.SETTLING
        ) {
          await commissionDao.update(
            { status: CommissionStatus.DEDUCTED as any },
            { where: { id: (commission as any).id } }
          );
          finalCommissionStatus = CommissionStatus.DEDUCTED;
          const amt = Number((commission as any).amount || 0);
          commissionChangeAmount = MoneyUtils.subtract(commissionChangeAmount, amt);
        }
      }

      if (recordPlain.promoterId) {
        const promoter = await promoterDao.findById(recordPlain.promoterId);
        if (promoter) {
          const currentAvailable = Number((promoter as any).availableCommission || 0);
          const currentFrozen = Number((promoter as any).frozenCommission || 0);
          const deduction = Math.abs(commissionChangeAmount);

          let newAvailable = currentAvailable;
          let newFrozen = currentFrozen;

          if (MoneyUtils.isGreaterOrEqual(currentAvailable, deduction)) {
            newAvailable = MoneyUtils.subtract(currentAvailable, deduction);
          } else {
            const remaining = MoneyUtils.subtract(deduction, currentAvailable);
            newAvailable = 0;
            newFrozen = MoneyUtils.isGreaterOrEqual(currentFrozen, remaining)
              ? MoneyUtils.subtract(currentFrozen, remaining)
              : 0;
          }

          await promoterDao.update(
            { availableCommission: newAvailable, frozenCommission: newFrozen } as any,
            { where: { id: recordPlain.promoterId } }
          );
          promoterSynced = true;
        }
      }

      if (recordPlain.channelId) {
        const channel = await channelDao.findById(recordPlain.channelId);
        if (channel) {
          const currentMonthlyAmount = Number((channel as any).monthlyAmount || 0);
          const currentMonthlyOrders = Number((channel as any).monthlyOrders || 0);
          const deduction = Math.abs(commissionChangeAmount);

          const newMonthlyAmount = MoneyUtils.isGreaterOrEqual(currentMonthlyAmount, deduction)
            ? MoneyUtils.subtract(currentMonthlyAmount, deduction)
            : 0;
          const newMonthlyOrders = currentMonthlyOrders > 0 ? currentMonthlyOrders - 1 : 0;

          await channelDao.update(
            { monthlyAmount: newMonthlyAmount, monthlyOrders: newMonthlyOrders } as any,
            { where: { id: recordPlain.channelId } }
          );
          channelSynced = true;
        }
      }

      await orderAbnormalRecordDao.update(abnormalRecordId, {
        status: OrderAbnormalStatus.REJECTED as any,
        reviewAction: action,
        reviewConclusion: conclusion,
        reviewerId: operatorId,
        reviewerName: operatorName,
        reviewedAt: now,
      } as any);

      message = '异常已驳回，订单已作废';
    } else if (action === OrderAbnormalReviewAction.OBSERVE) {
      await orderAbnormalRecordDao.update(abnormalRecordId, {
        status: OrderAbnormalStatus.REVIEWING as any,
        reviewAction: action,
        reviewConclusion: conclusion,
        reviewerId: operatorId,
        reviewerName: operatorName,
        reviewedAt: now,
      } as any);

      message = '已进入暂停观测状态';
    }

    await clearRelatedCaches(recordPlain.orderId, recordPlain.promoterId, recordPlain.channelId);

    return {
      success: true,
      orderId: recordPlain.orderId,
      abnormalRecordId,
      action,
      orderStatusUpdated,
      commissionStatus: finalCommissionStatus,
      commissionChangeAmount,
      promoterSynced,
      channelSynced,
      message,
    };
  }

  public async batchProcessAbnormal(params: BatchAbnormalProcessParams): Promise<BatchAbnormalProcessResult> {
    const { abnormalRecordIds, action, conclusion, evidences, operatorId, operatorName } = params;

    if (!abnormalRecordIds || abnormalRecordIds.length === 0) {
      throw new AppError('请选择要处理的异常记录', BusinessCode.PARAM_ERROR);
    }

    const results: Array<{ abnormalRecordId: string; orderId: string; success: boolean; reason?: string }> = [];
    let successCount = 0;
    let failCount = 0;

    for (const recordId of abnormalRecordIds) {
      try {
        const record = await orderAbnormalRecordDao.findById(recordId);
        if (!record) {
          failCount++;
          results.push({ abnormalRecordId: recordId, orderId: '', success: false, reason: '异常记录不存在' });
          continue;
        }

        const recordPlain = record.get({ plain: true });
        const abnormalTypes = recordPlain.abnormalTypes || [];

        const hasTimeoutOrMismatch = abnormalTypes.some(
          t => t === OrderAbnormalType.TIMEOUT_UNPAID || t === OrderAbnormalType.DATA_MISMATCH
        );
        const hasFakeOrBrushOrRefund = abnormalTypes.some(
          t =>
            t === OrderAbnormalType.FAKE_ORDER ||
            t === OrderAbnormalType.BRUSH_ORDER ||
            t === OrderAbnormalType.REFUND_ABNORMAL
        );

        let allowed = true;
        let denyReason = '';

        if (hasTimeoutOrMismatch && !hasFakeOrBrushOrRefund) {
          if (action === OrderAbnormalReviewAction.OBSERVE) {
            allowed = false;
            denyReason = '超时未付款/数据不匹配类型不允许暂停观测，仅允许放行或驳回';
          }
        } else if (hasFakeOrBrushOrRefund && !hasTimeoutOrMismatch) {
          if (action === OrderAbnormalReviewAction.RELEASE) {
            allowed = false;
            denyReason = '虚假订单/刷单/退款异常类型不允许放行结算，仅允许驳回或观测';
          }
        }

        if (!allowed) {
          failCount++;
          results.push({
            abnormalRecordId: recordId,
            orderId: recordPlain.orderId,
            success: false,
            reason: denyReason,
          });
          continue;
        }

        const reviewResult = await this.reviewAbnormal({
          abnormalRecordId: recordId,
          action,
          conclusion,
          evidences,
          operatorId,
          operatorName,
        });

        successCount++;
        results.push({
          abnormalRecordId: recordId,
          orderId: recordPlain.orderId,
          success: reviewResult.success,
        });
      } catch (err: any) {
        failCount++;
        const record = await orderAbnormalRecordDao.findById(recordId);
        results.push({
          abnormalRecordId: recordId,
          orderId: record ? (record as any).orderId : '',
          success: false,
          reason: err.message || '处理失败',
        });
      }
    }

    const reportData = {
      summary: {
        total: abnormalRecordIds.length,
        successCount,
        failCount,
        action,
        conclusion,
        operatorId,
        operatorName,
      },
      details: results,
      generatedAt: new Date().toISOString(),
    };

    return {
      total: abnormalRecordIds.length,
      successCount,
      failCount,
      results,
      reportUrl: '',
      generatedAt: new Date(),
    };
  }

  public async getAbnormalRootCauseAnalysis(orderId: string): Promise<AbnormalRootCauseAnalysis> {
    const order = await orderDao.findById(orderId);
    if (!order) {
      throw new AppError('订单不存在', BusinessCode.NOT_FOUND);
    }

    const orderPlain = order.get({ plain: true });
    const abnormalRecords = await orderAbnormalRecordDao.findByOrderId(orderId);

    const allTypes: OrderAbnormalType[] = [];
    const allRootCauses: Array<AbnormalRootCause & { evidence?: string }> = [];

    for (const record of abnormalRecords) {
      const types = (record as any).abnormalTypes || [];
      types.forEach((t: OrderAbnormalType) => {
        if (!allTypes.includes(t)) allTypes.push(t);
      });

      const causes = (record as any).rootCauses || [];
      causes.forEach((c: AbnormalRootCause) => {
        allRootCauses.push({ ...c, evidence: `来自记录${(record as any).id}` });
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let promoterRelatedAbnormals = 0;
    if (orderPlain.promoterId) {
      promoterRelatedAbnormals = await orderAbnormalRecordDao.countByPromoterInTimeWindow(
        orderPlain.promoterId,
        thirtyDaysAgo,
        now
      );
    }

    let channelRelatedAbnormals = 0;
    if (orderPlain.channelId) {
      channelRelatedAbnormals = await orderAbnormalRecordDao.countByChannelInTimeWindow(
        orderPlain.channelId,
        thirtyDaysAgo,
        now
      );
    }

    const suggestions: string[] = [];
    const riskOptimizations: string[] = [];

    const hasPromoterRelated = allTypes.some(
      t => t === OrderAbnormalType.BRUSH_ORDER || t === OrderAbnormalType.FAKE_ORDER
    );
    const hasSystemRelated = allTypes.some(t => t === OrderAbnormalType.DATA_MISMATCH);
    const hasRefundRelated = allTypes.some(t => t === OrderAbnormalType.REFUND_ABNORMAL);

    if (hasPromoterRelated && orderPlain.promoterId) {
      suggestions.push(`对推客${orderPlain.promoterId}加强风控监控，限制其高频下单行为`);
      if (promoterRelatedAbnormals >= 3) {
        suggestions.push(`推客30天内异常记录达${promoterRelatedAbnormals}条，建议人工审核其推广资质`);
      }
    }

    if (orderPlain.channelId) {
      const totalChannelOrders = await orderDao.count({
        where: {
          channelId: orderPlain.channelId,
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
      } as any);
      if (totalChannelOrders > 0 && channelRelatedAbnormals / totalChannelOrders > 0.1) {
        suggestions.push(`渠道${orderPlain.channelId}30天异常率${((channelRelatedAbnormals / totalChannelOrders) * 100).toFixed(1)}%偏高，建议核查其流量质量`);
      }
    }

    if (hasSystemRelated) {
      suggestions.push('校验订单数据同步链路，检查支付回调与订单系统的数据一致性');
    }

    if (hasRefundRelated) {
      suggestions.push('分析退款原因，核查商品质量或物流配送问题');
    }

    if (allTypes.includes(OrderAbnormalType.TIMEOUT_UNPAID)) {
      riskOptimizations.push('考虑缩短超时未付款检测阈值，加快库存周转');
    }

    if (allTypes.includes(OrderAbnormalType.BRUSH_ORDER)) {
      riskOptimizations.push('提高同IP/同设备下单检测敏感度，引入设备指纹风控');
    }

    if (allTypes.includes(OrderAbnormalType.FAKE_ORDER)) {
      riskOptimizations.push('加强订单关键信息校验，异常地址/电话自动预警');
    }

    if (allTypes.includes(OrderAbnormalType.DATA_MISMATCH)) {
      riskOptimizations.push('优化订单金额计算逻辑，增加数据一致性校验');
    }

    if (allTypes.includes(OrderAbnormalType.REFUND_ABNORMAL)) {
      riskOptimizations.push('建立退款率预警机制，推客/渠道退款率超标自动限流');
    }

    return {
      orderId,
      abnormalTypes: allTypes,
      rootCauses: allRootCauses,
      promoterRelatedAbnormals,
      channelRelatedAbnormals,
      suggestions,
      riskOptimizations,
    };
  }

  public async blockDuplicateAbnormals(
    promoterId?: string,
    channelId?: string,
    abnormalType?: OrderAbnormalType
  ): Promise<number> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let count = 0;

    if (promoterId) {
      count += await orderAbnormalRecordDao.countByPromoterInTimeWindow(
        promoterId,
        thirtyDaysAgo,
        now,
        abnormalType
      );
    }

    if (channelId) {
      count += await orderAbnormalRecordDao.countByChannelInTimeWindow(
        channelId,
        thirtyDaysAgo,
        now,
        abnormalType
      );
    }

    return count;
  }

  public async queryAbnormalRecords(params: any): Promise<{ list: any[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const { rows, count } = await orderAbnormalRecordDao.query(params);
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getAbnormalStatistics(startTime?: string, endTime?: string): Promise<any> {
    return orderAbnormalRecordDao.getStatistics(startTime, endTime);
  }

  public async getEvidencesByAbnormalId(abnormalRecordId: string): Promise<any[]> {
    return orderAbnormalEvidenceDao.findByAbnormalRecordId(abnormalRecordId);
  }
}

export default new OrderAbnormalService();
