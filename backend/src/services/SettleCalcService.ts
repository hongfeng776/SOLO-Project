import { Op } from 'sequelize';
import { daos } from '../dao';
import sequelize from '../config/database';
import { SettleApplyOrder, ApplyStatus as SettleApplyStatus } from '../models/SettleApplyOrder';
import { DeductType as SettleDeductType } from '../models/SettleDeductDetail';
import { AuditAction as SettleAuditAction } from '../models/SettleAuditLog';

export const PLATFORM_FEE_RATE = 0.02;
export const DEDUCT_BRANCH_CONFIG: Record<number, { label: string; feeRate: number; deductRate?: number; extraPenalty?: number }> = {
  1: { label: '正常结算', feeRate: 0.02 },
  2: { label: '售后扣减', feeRate: 0.02, deductRate: 1.0 },
  3: { label: '违规罚款', feeRate: 0.02, extraPenalty: 0 },
};

export interface SettleDeductItem {
  deductType: number;
  deductAmount: number;
  deductRate?: number;
  relatedId?: number;
  relatedNo?: string;
  relatedName?: string;
  description?: string;
}

export interface SettleCalcResult {
  merchantId: number;
  merchantName: string;
  periodType: number;
  periodStart: Date;
  periodEnd: Date;
  orderTotalAmount: number;
  orderCount: number;
  aftersaleDeductAmount: number;
  penaltyAmount: number;
  platformFee: number;
  totalDeductAmount: number;
  actualSettleAmount: number;
  deductDetails: SettleDeductItem[];
  orderDetails: any[];
}

export interface ChangeStatusOptions {
  rejectReason?: string;
  remark?: string;
}

export interface BatchCalcResult {
  merchantId: number;
  merchantName: string;
  success: boolean;
  data?: SettleCalcResult;
  error?: string;
}

class SettleCalcService {
  readonly orderDao = daos.orderDao;
  readonly afterSaleDao = daos.afterSaleDao;
  readonly penaltyDao = daos.penaltyDao;
  readonly merchantDao = daos.merchantDao;
  readonly fundSettlementDao = daos.fundSettlementDao;
  readonly settleApplyOrderDao = daos.settleApplyOrderDao;
  readonly settleDeductDetailDao = daos.settleDeductDetailDao;
  readonly settleAuditLogDao = daos.settleAuditLogDao;

  generateApplyNo(): string {
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `STL${timestamp}${random}`;
  }

  async calcSettleAmount(
    merchantId: number,
    periodType: number,
    startDate: string,
    endDate: string
  ): Promise<SettleCalcResult> {
    const merchant = await this.merchantDao.findById(merchantId);
    if (!merchant) {
      throw new Error('商家不存在');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const nextDay = new Date(end);
    nextDay.setDate(nextDay.getDate() + 1);

    const orders = await this.orderDao.findAll({
      where: {
        merchant_id: merchantId,
        status: 3,
        pay_status: 1,
        created_at: {
          [Op.gte]: start,
          [Op.lt]: nextDay,
        },
      },
    });

    let orderTotalAmount = 0;
    for (const order of orders) {
      orderTotalAmount += Number(order.pay_amount || 0);
    }
    const orderCount = orders.length;

    const afterSales = await this.afterSaleDao.findAll({
      where: {
        merchant_id: merchantId,
        status: 3,
        created_at: {
          [Op.gte]: start,
          [Op.lt]: nextDay,
        },
      },
    });

    let aftersaleDeductAmount = 0;
    for (const afterSale of afterSales) {
      aftersaleDeductAmount += Number((afterSale as any).refund_amount || (afterSale as any).amount || 0);
    }

    const penalties = await this.penaltyDao.findAll({
      where: {
        merchant_id: merchantId,
        status: 1,
        created_at: {
          [Op.gte]: start,
          [Op.lt]: nextDay,
        },
      },
    });

    let penaltyAmount = 0;
    for (const penalty of penalties) {
      penaltyAmount += Number((penalty as any).amount || 0);
    }

    const platformFee = Number((orderTotalAmount * PLATFORM_FEE_RATE).toFixed(2));
    const totalDeductAmount = Number((aftersaleDeductAmount + penaltyAmount + platformFee).toFixed(2));
    const actualSettleAmount = Number(Math.max(0, orderTotalAmount - totalDeductAmount).toFixed(2));

    const deductDetails: SettleDeductItem[] = [];

    if (platformFee > 0) {
      deductDetails.push({
        deductType: SettleDeductType.PLATFORM_FEE,
        deductAmount: platformFee,
        deductRate: PLATFORM_FEE_RATE,
        description: `平台手续费 (订单总额${orderTotalAmount} × ${(PLATFORM_FEE_RATE * 100).toFixed(0)}%)`,
      });
    }

    for (const afterSale of afterSales) {
      const refundAmount = Number((afterSale as any).refund_amount || (afterSale as any).amount || 0);
      if (refundAmount > 0) {
        deductDetails.push({
          deductType: SettleDeductType.AFTERSALE_REFUND,
          deductAmount: refundAmount,
          deductRate: 1.0,
          relatedId: afterSale.id,
          relatedNo: (afterSale as any).after_sale_no,
          relatedName: `售后退款-${(afterSale as any).after_sale_no}`,
          description: `售后单${(afterSale as any).after_sale_no}退款`,
        });
      }
    }

    for (const penalty of penalties) {
      const penaltyAmt = Number((penalty as any).amount || 0);
      if (penaltyAmt > 0) {
        deductDetails.push({
          deductType: SettleDeductType.PENALTY_FINE,
          deductAmount: penaltyAmt,
          relatedId: penalty.id,
          relatedName: `违规罚款-${penalty.id}`,
          description: (penalty as any).reason || '违规罚款',
        });
      }
    }

    return {
      merchantId,
      merchantName: (merchant as any).name || '',
      periodType,
      periodStart: start,
      periodEnd: end,
      orderTotalAmount: Number(orderTotalAmount.toFixed(2)),
      orderCount,
      aftersaleDeductAmount: Number(aftersaleDeductAmount.toFixed(2)),
      penaltyAmount: Number(penaltyAmount.toFixed(2)),
      platformFee,
      totalDeductAmount,
      actualSettleAmount,
      deductDetails,
      orderDetails: orders.map(o => ({
        id: o.id,
        order_no: o.order_no,
        pay_amount: o.pay_amount,
        status: o.status,
        created_at: o.created_at,
      })),
    };
  }

  async changeApplyStatus(
    applyId: number,
    targetStatus: number,
    operatorId?: number,
    operatorName?: string,
    options?: ChangeStatusOptions
  ): Promise<{ success: boolean; applyOrder?: SettleApplyOrder; message?: string }> {
    const t = await sequelize.transaction();

    try {
      const applyOrder = await this.settleApplyOrderDao.findById(applyId);
      if (!applyOrder) {
        await t.rollback();
        return { success: false, message: '结算申请单不存在' };
      }

      const oldStatus = Number(applyOrder.apply_status || 0);
      const oldAmount = Number(applyOrder.actual_settle_amount || 0);

      let action = SettleAuditAction.SUBMIT_APPLY;
      let actionDesc = '';

      switch (targetStatus) {
        case SettleApplyStatus.PENDING_AUDIT:
          action = SettleAuditAction.SUBMIT_APPLY;
          actionDesc = '提交结算申请';
          break;
        case SettleApplyStatus.AUDIT_APPROVED:
          action = SettleAuditAction.AUDIT_APPROVE;
          actionDesc = '审核通过';
          break;
        case SettleApplyStatus.AUDIT_REJECTED:
          action = SettleAuditAction.AUDIT_REJECT;
          actionDesc = '审核驳回';
          break;
        case SettleApplyStatus.TRANSFERRING:
          action = SettleAuditAction.INITIATE_TRANSFER;
          actionDesc = '发起转账';
          break;
        case SettleApplyStatus.TRANSFERRED:
          action = SettleAuditAction.CONFIRM_ARRIVE;
          actionDesc = '转账成功';
          break;
        case SettleApplyStatus.TRANSFER_FAILED:
          action = SettleAuditAction.TRANSFER_RETRY;
          actionDesc = '转账失败';
          break;
        default:
          action = SettleAuditAction.CANCEL_APPLY;
          actionDesc = '修改结算状态';
      }

      const updateData: any = {
        apply_status: targetStatus,
      };

      if (targetStatus === SettleApplyStatus.AUDIT_APPROVED || targetStatus === SettleApplyStatus.AUDIT_REJECTED) {
        updateData.audit_time = new Date();
        updateData.auditor_id = operatorId;
        updateData.auditor_name = operatorName;
      }

      if (targetStatus === SettleApplyStatus.AUDIT_REJECTED && options?.rejectReason) {
        updateData.reject_reason = options.rejectReason;
      }

      if (targetStatus === SettleApplyStatus.TRANSFERRING || targetStatus === SettleApplyStatus.TRANSFERRED) {
        updateData.transfer_time = new Date();
      }

      if (targetStatus === SettleApplyStatus.TRANSFERRED) {
        updateData.arrive_time = new Date();
      }

      await this.settleApplyOrderDao.update(applyId, updateData, { transaction: t });

      const auditDetailParts = [];
      auditDetailParts.push(`状态: ${oldStatus} → ${targetStatus}`);
      auditDetailParts.push(`金额: ¥${oldAmount.toFixed(2)}`);
      if (options?.remark) {
        auditDetailParts.push(`备注: ${options.remark}`);
      }
      if (targetStatus === SettleApplyStatus.AUDIT_REJECTED && options?.rejectReason) {
        auditDetailParts.push(`驳回原因: ${options.rejectReason}`);
      }

      await this.settleAuditLogDao.create({
        settle_apply_id: applyId,
        merchant_id: applyOrder.merchant_id,
        audit_action: action,
        audit_action_label: actionDesc,
        before_status: oldStatus,
        after_status: targetStatus,
        audit_detail: auditDetailParts.join(' | '),
        operator_id: operatorId,
        operator_name: operatorName || '系统',
        operator_role: '2',
      } as any, { transaction: t });

      const merchantId = applyOrder.merchant_id;
      const settleAmount = Number(applyOrder.actual_settle_amount || 0);
      const merchant = await this.merchantDao.findById(merchantId);

      if (merchant) {
        const currentPending = Number((merchant as any).pending_settle_amount || 0);
        const currentTotal = Number((merchant as any).total_settle_amount || 0);
        const currentAvailable = Number((merchant as any).available_settle_balance || 0);

        const merchantUpdate: any = {};

        if (targetStatus === SettleApplyStatus.PENDING_AUDIT) {
          merchantUpdate.pending_settle_amount = Number((currentPending + settleAmount).toFixed(2));
          if (currentAvailable >= settleAmount) {
            merchantUpdate.available_settle_balance = Number((currentAvailable - settleAmount).toFixed(2));
          }
        }

        if (oldStatus === SettleApplyStatus.PENDING_AUDIT) {
          if (targetStatus === SettleApplyStatus.AUDIT_REJECTED) {
            merchantUpdate.pending_settle_amount = Number(Math.max(0, currentPending - settleAmount).toFixed(2));
            merchantUpdate.available_settle_balance = Number((currentAvailable + settleAmount).toFixed(2));
          }
        }

        if (targetStatus === SettleApplyStatus.TRANSFERRED) {
          if (currentPending >= settleAmount) {
            merchantUpdate.pending_settle_amount = Number(Math.max(0, currentPending - settleAmount).toFixed(2));
          }
          merchantUpdate.total_settle_amount = Number((currentTotal + settleAmount).toFixed(2));
          merchantUpdate.last_settle_time = new Date();
        }

        if (Object.keys(merchantUpdate).length > 0) {
          await this.merchantDao.update(merchantId, merchantUpdate, { transaction: t });
        }
      }

      if (targetStatus === SettleApplyStatus.AUDIT_APPROVED || targetStatus === SettleApplyStatus.PENDING_AUDIT) {
        const existingDeducts = await this.settleDeductDetailDao.findAll({
          where: { settle_apply_id: applyId },
        } as any);

        if (existingDeducts.length === 0) {
          const calcResult = await this.calcSettleAmount(
            applyOrder.merchant_id,
            applyOrder.settle_period_type,
            new Date(applyOrder.period_start_date).toISOString().split('T')[0],
            new Date(applyOrder.period_end_date).toISOString().split('T')[0]
          );

          for (const item of calcResult.deductDetails) {
            await this.settleDeductDetailDao.create({
              settle_apply_id: applyId,
              merchant_id: applyOrder.merchant_id,
              deduct_type: item.deductType,
              deduct_type_label: DEDUCT_BRANCH_CONFIG[item.deductType]?.label || '',
              relate_order_no: item.relatedNo,
              relate_id: item.relatedId,
              deduct_amount: item.deductAmount,
              deduct_reason: item.description || '',
              operator_id: operatorId,
              operator_name: operatorName || '系统',
            } as any, { transaction: t });
          }
        }
      }

      await t.commit();

      const updatedApplyOrder = await this.settleApplyOrderDao.findById(applyId);
      return { success: true, applyOrder: updatedApplyOrder || undefined, message: actionDesc + '成功' };
    } catch (error) {
      await t.rollback();
      return {
        success: false,
        message: `状态变更失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async createApplyOrder(
    merchantId: number,
    periodType: number,
    startDate: string,
    endDate: string,
    operatorId?: number,
    operatorName?: string
  ): Promise<{ success: boolean; applyOrder?: SettleApplyOrder; calcResult?: SettleCalcResult; message?: string }> {
    const t = await sequelize.transaction();

    try {
      const calcResult = await this.calcSettleAmount(merchantId, periodType, startDate, endDate);
      const merchant = await this.merchantDao.findById(merchantId);
      if (!merchant) {
        await t.rollback();
        return { success: false, message: '商家不存在' };
      }

      const applyNo = this.generateApplyNo();

      const bankSnapshot = {
        bank_account_name: (merchant as any).bank_account_name,
        bank_account_no: (merchant as any).bank_account_no,
        bank_name: (merchant as any).bank_name,
        bank_branch_name: (merchant as any).bank_branch_name,
        bank_verify_status: (merchant as any).bank_verify_status,
      };

      const applyOrder = await this.settleApplyOrderDao.create({
        apply_no: applyNo,
        merchant_id: merchantId,
        settle_period_type: periodType,
        period_start_date: new Date(startDate),
        period_end_date: new Date(endDate),
        total_order_count: calcResult.orderCount,
        total_settle_base: calcResult.orderTotalAmount,
        platform_fee_amount: calcResult.platformFee,
        aftersale_deduct_amount: calcResult.aftersaleDeductAmount,
        penalty_deduct_amount: calcResult.penaltyAmount,
        other_deduct_amount: 0,
        actual_settle_amount: calcResult.actualSettleAmount,
        apply_status: SettleApplyStatus.PENDING_AUDIT,
        apply_source: 1,
        bank_snapshot: bankSnapshot,
        operator_id: operatorId,
        operator_name: operatorName || '系统',
      } as any, { transaction: t });

      await this.settleAuditLogDao.create({
        settle_apply_id: applyOrder.id,
        merchant_id: merchantId,
        audit_action: SettleAuditAction.SUBMIT_APPLY,
        audit_action_label: '提交结算申请',
        before_status: null,
        after_status: SettleApplyStatus.PENDING_AUDIT,
        audit_detail: `提交结算申请，金额: ¥${calcResult.actualSettleAmount.toFixed(2)}`,
        operator_id: operatorId,
        operator_name: operatorName || '系统',
        operator_role: '1',
      } as any, { transaction: t });

      for (const item of calcResult.deductDetails) {
        await this.settleDeductDetailDao.create({
          settle_apply_id: applyOrder.id,
          merchant_id: merchantId,
          deduct_type: item.deductType,
          deduct_type_label: (item.deductType === SettleDeductType.PLATFORM_FEE ? '平台手续费' :
                              item.deductType === SettleDeductType.AFTERSALE_REFUND ? '售后退款' :
                              item.deductType === SettleDeductType.PENALTY_FINE ? '违规罚款' :
                              item.deductType === SettleDeductType.DEPOSIT_DEDUCT ? '保证金扣除' : '其他'),
          relate_order_no: item.relatedNo,
          relate_id: item.relatedId,
          deduct_amount: item.deductAmount,
          deduct_reason: item.description || '',
          operator_id: operatorId,
          operator_name: operatorName || '系统',
        } as any, { transaction: t });
      }

      const currentPending = Number((merchant as any).pending_settle_amount || 0);
      const currentAvailable = Number((merchant as any).available_settle_balance || 0);
      const settleAmount = calcResult.actualSettleAmount;

      const merchantUpdate: any = {
        pending_settle_amount: Number((currentPending + settleAmount).toFixed(2)),
      };
      if (currentAvailable >= settleAmount) {
        merchantUpdate.available_settle_balance = Number((currentAvailable - settleAmount).toFixed(2));
      }
      await this.merchantDao.update(merchantId, merchantUpdate, { transaction: t });

      await t.commit();

      const newApplyOrder = await this.settleApplyOrderDao.findById(applyOrder.id);
      return { success: true, applyOrder: newApplyOrder || undefined, calcResult, message: '结算申请提交成功' };
    } catch (error) {
      await t.rollback();
      return {
        success: false,
        message: `创建申请单失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async batchCalcSettle(
    merchantIds: number[],
    periodType: number,
    startDate: string,
    endDate: string
  ): Promise<BatchCalcResult[]> {
    const results: BatchCalcResult[] = [];

    for (const merchantId of merchantIds) {
      try {
        const calcResult = await this.calcSettleAmount(merchantId, periodType, startDate, endDate);
        results.push({
          merchantId,
          merchantName: calcResult.merchantName,
          success: true,
          data: calcResult,
        });
      } catch (error) {
        results.push({
          merchantId,
          merchantName: '',
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return results;
  }
}

export const settleCalcService = new SettleCalcService();
export default settleCalcService;
