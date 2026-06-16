import { daos } from '../dao';
import { AfterSale } from '../models/AfterSale';
import { AfterSaleAudit } from '../models/AfterSaleAudit';
import { Order } from '../models/Order';
import { AppError } from '../middlewares/errorHandler';

const { afterSaleDao, afterSaleAuditDao, orderDao } = daos;

export const AuditLevel = {
  FIRST: 1,
  FINAL: 2,
} as const;

export const AuditStatus = {
  PASS: 1,
  REJECT: 2,
} as const;

export const AfterSaleStatus = {
  PENDING: 0,
  PROCESSING: 1,
  COMPLETED: 2,
  REJECTED: 3,
} as const;

export const AfterSaleType = {
  REFUND: 1,
  RETURN_REFUND: 2,
  EXCHANGE: 3,
} as const;

export const OrderStatus = {
  PENDING_PAY: 0,
  PENDING_SHIP: 1,
  PENDING_RECEIVE: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;

export interface AuditPayload {
  aftersale_id: number;
  auditor_id: number;
  level: number;
  status: number;
  remark?: string;
  refund_amount?: number;
}

export interface AuditResult {
  aftersale: AfterSale;
  audits: AfterSaleAudit[];
  order?: Order;
  refund_success?: boolean;
  refund_amount?: number;
}

export interface RefundResult {
  success: boolean;
  refund_no: string;
  amount: number;
  order_id: number;
  aftersale_id: number;
  processed_at: Date;
}

class AfterSaleAuditService {
  private readonly REFUND_RATIO_LIMIT = 1;
  private readonly FIRST_AUDIT_AMOUNT_LIMIT = 500;

  async audit(payload: AuditPayload): Promise<AuditResult> {
    const { aftersale_id, auditor_id, level, status, remark, refund_amount } = payload;

    this.validateAuditLevel(level);
    this.validateAuditStatus(status);

    const afterSale = await afterSaleDao.findById(aftersale_id);
    if (!afterSale) {
      throw new AppError('售后申请不存在', 404);
    }

    if (afterSale.status === AfterSaleStatus.COMPLETED) {
      throw new AppError('该售后已完成，无需重复审核', 400);
    }

    if (afterSale.status === AfterSaleStatus.REJECTED) {
      throw new AppError('该售后已被拒绝，不可审核', 400);
    }

    const order = await orderDao.findById(afterSale.order_id);
    if (!order) {
      throw new AppError('关联订单不存在', 404);
    }

    this.validateOrderStatus(order);

    const existingAudits = await afterSaleAuditDao.findByAfterSaleId(aftersale_id);
    this.validateAuditSequence(level, existingAudits);
    await this.validateDuplicateAudit(aftersale_id, level);

    const finalRefundAmount = this.validateRefundAmount(
      afterSale,
      order,
      level,
      refund_amount
    );

    const audit = await afterSaleAuditDao.create({
      aftersale_id,
      auditor_id,
      level,
      status,
      remark,
    });

    let updatedAfterSale = afterSale;
    let refundSuccess = false;
    let actualRefundAmount = 0;

    if (status === AuditStatus.REJECT) {
      updatedAfterSale = await this.rejectAfterSale(aftersale_id);
    } else if (status === AuditStatus.PASS) {
      if (level === AuditLevel.FIRST) {
        updatedAfterSale = await this.passFirstAudit(aftersale_id, finalRefundAmount);
      } else if (level === AuditLevel.FINAL) {
        const needFinalAudit = this.needFinalAudit(finalRefundAmount, afterSale.type);

        if (!needFinalAudit && existingAudits.length === 0) {
          updatedAfterSale = await this.completeAfterSale(aftersale_id, finalRefundAmount);
          const refundResult = await this.executeAutoRefund(afterSale, order, finalRefundAmount);
          refundSuccess = refundResult.success;
          actualRefundAmount = finalRefundAmount;
        } else {
          const firstAudit = existingAudits.find(a => a.level === AuditLevel.FIRST);
          if (!firstAudit) {
            await afterSaleAuditDao.delete(audit.id);
            throw new AppError('请先完成初审再进行终审', 400);
          }

          if (firstAudit.status !== AuditStatus.PASS) {
            await afterSaleAuditDao.delete(audit.id);
            throw new AppError('初审未通过，不可终审通过', 400);
          }

          updatedAfterSale = await this.completeAfterSale(aftersale_id, finalRefundAmount);
          const refundResult = await this.executeAutoRefund(afterSale, order, finalRefundAmount);
          refundSuccess = refundResult.success;
          actualRefundAmount = finalRefundAmount;
        }
      }
    }

    const allAudits = await afterSaleAuditDao.findByAfterSaleId(aftersale_id);
    const result: AuditResult = {
      aftersale: updatedAfterSale,
      audits: allAudits,
      order,
      refund_success: refundSuccess,
      refund_amount: actualRefundAmount,
    };

    return result;
  }

  async getAuditTrail(aftersale_id: number): Promise<AfterSaleAudit[]> {
    const afterSale = await afterSaleDao.findById(aftersale_id);
    if (!afterSale) {
      throw new AppError('售后申请不存在', 404);
    }

    return afterSaleAuditDao.findByAfterSaleId(aftersale_id);
  }

  async executeAutoRefund(
    afterSale: AfterSale,
    order: Order,
    amount: number
  ): Promise<RefundResult> {
    if (!order || order.status === OrderStatus.CANCELLED) {
      throw new AppError('订单状态异常，无法退款', 400);
    }

    if (order.pay_status !== 1) {
      throw new AppError('订单未支付，无需退款', 400);
    }

    const refundNo = this.generateRefundNo();
    const processedAt = new Date();

    try {
      await this.callPaymentRefundApi(order.order_no, refundNo, amount);
    } catch (error: any) {
      throw new AppError(`调用退款接口失败: ${error.message}`, 500);
    }

    try {
      if (afterSale.type === AfterSaleType.REFUND || afterSale.type === AfterSaleType.RETURN_REFUND) {
        await orderDao.update(order.id, {
          status: OrderStatus.CANCELLED,
        });
      }
    } catch (error) {
      console.error('更新订单状态失败:', error);
    }

    return {
      success: true,
      refund_no: refundNo,
      amount,
      order_id: order.id,
      aftersale_id: afterSale.id,
      processed_at: processedAt,
    };
  }

  async batchAudit(
    aftersale_ids: number[],
    auditor_id: number,
    level: number,
    status: number,
    remark?: string
  ): Promise<{ success: number; failed: number; results: AuditResult[]; errors: string[] }> {
    if (!aftersale_ids || aftersale_ids.length === 0) {
      throw new AppError('请选择要审核的售后申请', 400);
    }

    const results: AuditResult[] = [];
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (const id of aftersale_ids) {
      try {
        const result = await this.audit({
          aftersale_id: id,
          auditor_id,
          level,
          status,
          remark,
        });
        results.push(result);
        success++;
      } catch (error: any) {
        errors.push(`售后ID ${id}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, results, errors };
  }

  private validateAuditLevel(level: number): void {
    if (level !== AuditLevel.FIRST && level !== AuditLevel.FINAL) {
      throw new AppError('无效的审核级别', 400);
    }
  }

  private validateAuditStatus(status: number): void {
    if (status !== AuditStatus.PASS && status !== AuditStatus.REJECT) {
      throw new AppError('无效的审核结果', 400);
    }
  }

  private validateAuditSequence(level: number, existingAudits: AfterSaleAudit[]): void {
    const firstAuditPassed = existingAudits.some(
      a => a.level === AuditLevel.FIRST && a.status === AuditStatus.PASS
    );
    const firstAuditRejected = existingAudits.some(
      a => a.level === AuditLevel.FIRST && a.status === AuditStatus.REJECT
    );

    if (level === AuditLevel.FINAL && firstAuditRejected) {
      throw new AppError('初审已拒绝，无需终审', 400);
    }

    if (level === AuditLevel.FINAL && !firstAuditPassed) {
      throw new AppError('请先完成初审再进行终审', 400);
    }
  }

  private async validateDuplicateAudit(aftersale_id: number, level: number): Promise<void> {
    const existing = await afterSaleAuditDao.findByAfterSaleAndLevel(aftersale_id, level);
    if (existing) {
      const levelText = level === AuditLevel.FIRST ? '初审' : '终审';
      throw new AppError(`该售后已进行过${levelText}，不可重复审核`, 400);
    }
  }

  private validateOrderStatus(order: Order): void {
    const validStatuses: number[] = [
      OrderStatus.PENDING_SHIP,
      OrderStatus.PENDING_RECEIVE,
      OrderStatus.COMPLETED,
    ];

    if (!validStatuses.includes(order.status!)) {
      const statusText = this.getOrderStatusText(order.status!);
      throw new AppError(`当前订单状态[${statusText}]不支持售后`, 400);
    }
  }

  private validateRefundAmount(
    afterSale: AfterSale,
    order: Order,
    level: number,
    requestedAmount?: number
  ): number {
    const maxRefund = Number(order.pay_amount) * this.REFUND_RATIO_LIMIT;
    const amount = requestedAmount !== undefined ? Number(requestedAmount) : Number(afterSale.amount);

    if (isNaN(amount) || amount <= 0) {
      throw new AppError('退款金额无效', 400);
    }

    if (amount > maxRefund) {
      throw new AppError(`退款金额不得超过实付金额 ¥${maxRefund.toFixed(2)}`, 400);
    }

    if (level === AuditLevel.FIRST && amount > this.FIRST_AUDIT_AMOUNT_LIMIT) {
      throw new AppError(
        `退款金额超过 ¥${this.FIRST_AUDIT_AMOUNT_LIMIT}，初审仅可提交，需终审确认`,
        400
      );
    }

    return amount;
  }

  private needFinalAudit(amount: number, afterSaleType?: number): boolean {
    if (afterSaleType === AfterSaleType.EXCHANGE) {
      return true;
    }
    return amount > this.FIRST_AUDIT_AMOUNT_LIMIT;
  }

  private async passFirstAudit(aftersale_id: number, refundAmount: number): Promise<AfterSale> {
    await afterSaleDao.update(aftersale_id, {
      status: AfterSaleStatus.PROCESSING,
      amount: refundAmount,
    });

    const updated = await afterSaleDao.findById(aftersale_id);
    if (!updated) {
      throw new AppError('售后申请不存在', 404);
    }
    return updated;
  }

  private async rejectAfterSale(
    aftersale_id: number
  ): Promise<AfterSale> {
    await afterSaleDao.update(aftersale_id, {
      status: AfterSaleStatus.REJECTED,
    });

    const updated = await afterSaleDao.findById(aftersale_id);
    if (!updated) {
      throw new AppError('售后申请不存在', 404);
    }
    return updated;
  }

  private async completeAfterSale(aftersale_id: number, refundAmount: number): Promise<AfterSale> {
    await afterSaleDao.update(aftersale_id, {
      status: AfterSaleStatus.COMPLETED,
      amount: refundAmount,
    });

    const updated = await afterSaleDao.findById(aftersale_id);
    if (!updated) {
      throw new AppError('售后申请不存在', 404);
    }
    return updated;
  }

  private generateRefundNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RF${timestamp}${random}`;
  }

  private async callPaymentRefundApi(
    orderNo: string,
    refundNo: string,
    amount: number
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`[MOCK] 退款接口调用成功: 订单=${orderNo}, 退款单=${refundNo}, 金额=${amount}`);
    return;
  }

  private getOrderStatusText(status: number): string {
    const map: Record<number, string> = {
      [OrderStatus.PENDING_PAY]: '待付款',
      [OrderStatus.PENDING_SHIP]: '待发货',
      [OrderStatus.PENDING_RECEIVE]: '待收货',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.CANCELLED]: '已取消',
    };
    return map[status] || '未知';
  }
}

export const afterSaleAuditService = new AfterSaleAuditService();
export default AfterSaleAuditService;
