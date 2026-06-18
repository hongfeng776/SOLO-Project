import { Op, Transaction } from 'sequelize';
import { daos } from '../dao';
import database from '../config/database';

export enum PayStatus {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
  REFUNDED = 3,
}

export enum PayScenario {
  FULL = 1,
  PARTIAL = 2,
  AFTER_REFUND = 3,
}

export enum ReconcileStatus {
  PENDING = 0,
  PROCESSING = 1,
  PASSED = 2,
  ABNORMAL = 3,
}

export enum SettleStatus {
  PENDING = 0,
  SETTLED = 1,
  ABNORMAL = 2,
}

export enum RiskFlag {
  NORMAL = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  BLOCKED = 4,
}

export enum ChannelStatus {
  NORMAL = 0,
  CLOSED = 1,
}

export interface PaymentValidateResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
  riskFlag?: RiskFlag;
  riskReason?: string;
}

export interface PaymentVerifyData {
  flowNo: string;
  orderId: number;
  orderNo: string;
  userId: number;
  payAmount: number;
  payType: number;
  transactionId?: string;
  payScenario?: PayScenario;
}

export interface PaymentSyncResult {
  success: boolean;
  orderStatus?: number;
  errorMessage?: string;
}

const VALID_PAY_TYPES = [1, 2, 3];
const PAY_TIMEOUT_MINUTES = 30;
const POINTS_RATE = 1;
const PLATFORM_FEE_RATE = 0.02;

class PaymentValidateService {
  private readonly paymentFlowDao = daos.paymentFlowDao;
  private readonly orderDao = daos.orderDao;
  private readonly userDao = daos.userDao;
  private readonly merchantDao = daos.merchantDao;
  private readonly goodsDao = daos.goodsDao;
  private readonly orderItemDao = daos.orderItemDao;
  private readonly riskAlertDao = daos.riskAlertDao;
  private readonly orderLogDao = daos.orderLogDao;
  private readonly fundSettlementDao = daos.fundSettlementDao;

  async validatePaymentAmount(orderId: number, payAmount: number): Promise<PaymentValidateResult> {
    const order = await this.orderDao.findById(orderId);
    if (!order) {
      return {
        valid: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: '订单不存在',
      };
    }

    const orderAmount = Number(order.pay_amount || 0);
    if (Math.abs(Number(payAmount) - orderAmount) > 0.01) {
      return {
        valid: false,
        errorCode: 'AMOUNT_MISMATCH',
        errorMessage: `支付金额与订单金额不一致，订单金额：${orderAmount}元，支付金额：${payAmount}元`,
      };
    }

    return { valid: true };
  }

  async validatePayChannel(payType: number): Promise<PaymentValidateResult> {
    if (!VALID_PAY_TYPES.includes(payType)) {
      return {
        valid: false,
        errorCode: 'INVALID_PAY_TYPE',
        errorMessage: '支付渠道不合法，仅支持微信支付、支付宝、银行卡',
      };
    }
    return { valid: true };
  }

  async validatePaymentTimeliness(orderId: number): Promise<PaymentValidateResult> {
    const order = await this.orderDao.findById(orderId);
    if (!order) {
      return {
        valid: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: '订单不存在',
      };
    }

    const paymentFlow = await this.paymentFlowDao.findOne({
      where: { order_id: orderId, pay_status: PayStatus.PENDING },
    });

    if (paymentFlow?.expire_time) {
      const now = new Date();
      const expireTime = new Date(paymentFlow.expire_time);
      if (now > expireTime) {
        return {
          valid: false,
          errorCode: 'PAYMENT_EXPIRED',
          errorMessage: '支付已超时，请重新下单',
        };
      }
    }

    return { valid: true };
  }

  async validateUserAccount(_userId: number): Promise<PaymentValidateResult> {
    const user = await this.userDao.findById(_userId);
    if (!user) {
      return {
        valid: false,
        errorCode: 'USER_NOT_FOUND',
        errorMessage: '用户不存在',
      };
    }

    if (user.status !== 1) {
      return {
        valid: false,
        errorCode: 'USER_DISABLED',
        errorMessage: '用户账户已被禁用，无法支付',
      };
    }

    return { valid: true };
  }

  async checkDuplicatePayment(transactionId: string, orderId: number): Promise<PaymentValidateResult> {
    if (!transactionId) return { valid: true };

    const existingFlow = await this.paymentFlowDao.findOne({
      where: {
        transaction_id: transactionId,
        pay_status: PayStatus.SUCCESS,
        order_id: { [Op.ne]: orderId },
      },
    });

    if (existingFlow) {
      return {
        valid: false,
        errorCode: 'DUPLICATE_TRANSACTION',
        errorMessage: '该交易号已用于其他订单支付，疑似重复支付',
        riskFlag: RiskFlag.HIGH,
        riskReason: '重复支付流水拦截',
      };
    }

    return { valid: true };
  }

  async checkFakePayment(payAmount: number, orderId: number): Promise<PaymentValidateResult> {
    if (payAmount <= 0) {
      return {
        valid: false,
        errorCode: 'INVALID_AMOUNT',
        errorMessage: '支付金额异常，疑似虚假支付',
        riskFlag: RiskFlag.BLOCKED,
        riskReason: '支付金额小于等于0，疑似虚假支付',
      };
    }

    const order = await this.orderDao.findById(orderId);
    if (!order) {
      return {
        valid: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: '订单不存在',
      };
    }

    const orderAmount = Number(order.pay_amount || 0);
    if (payAmount > orderAmount * 2) {
      return {
        valid: false,
        errorCode: 'AMOUNT_TOO_LARGE',
        errorMessage: '支付金额异常偏大，疑似虚假支付',
        riskFlag: RiskFlag.HIGH,
        riskReason: `支付金额(${payAmount}元)超过订单金额(${orderAmount}元)的2倍`,
      };
    }

    return { valid: true };
  }

  async closeExpiredPaymentChannel(): Promise<number> {
    const now = new Date();
    const expiredFlows = await this.paymentFlowDao.findAll({
      where: {
        pay_status: PayStatus.PENDING,
        channel_status: ChannelStatus.NORMAL,
        expire_time: { [Op.lt]: now },
      },
    });

    let count = 0;
    for (const flow of expiredFlows) {
      await this.paymentFlowDao.update(flow.id, {
        channel_status: ChannelStatus.CLOSED,
      });

      await this.orderLogDao.create({
        order_id: flow.order_id,
        operator_id: 0,
        operator_type: 2,
        action: '支付通道自动关闭',
        remark: '支付超时，系统自动关闭支付通道',
      });

      count++;
    }

    return count;
  }

  async triggerRiskAlert(
    flowId: number,
    _userId: number,
    orderId: number,
    riskFlag: RiskFlag,
    riskReason: string
  ): Promise<void> {
    const level = riskFlag === RiskFlag.HIGH || riskFlag === RiskFlag.BLOCKED ? 3 :
                  riskFlag === RiskFlag.MEDIUM ? 2 : 1;

    await this.riskAlertDao.create({
      rule_id: 100,
      type: 2,
      target_id: orderId,
      level,
      content: `支付流水ID:${flowId}，${riskReason}`,
      status: 0,
    });

    await this.paymentFlowDao.update(flowId, {
      risk_flag: riskFlag,
      risk_reason: riskReason,
    });
  }

  async verifyPayment(data: PaymentVerifyData): Promise<PaymentValidateResult> {
    const { orderId, payAmount, payType, transactionId, userId: _userId } = data;

    const amountResult = await this.validatePaymentAmount(orderId, payAmount);
    if (!amountResult.valid) return amountResult;

    const channelResult = await this.validatePayChannel(payType);
    if (!channelResult.valid) return channelResult;

    const timelinessResult = await this.validatePaymentTimeliness(orderId);
    if (!timelinessResult.valid) return timelinessResult;

    const userResult = await this.validateUserAccount(_userId);
    if (!userResult.valid) return userResult;

    if (transactionId) {
      const duplicateResult = await this.checkDuplicatePayment(transactionId, orderId);
      if (!duplicateResult.valid) return duplicateResult;
    }

    const fakeResult = await this.checkFakePayment(payAmount, orderId);
    if (!fakeResult.valid) return fakeResult;

    return { valid: true };
  }

  async syncPaymentStatus(
    flowId: number,
    payStatus: PayStatus,
    payScenario: PayScenario = PayScenario.FULL
  ): Promise<PaymentSyncResult> {
    const transaction = await database.transaction();

    try {
      const flow = await this.paymentFlowDao.findById(flowId);
      if (!flow) {
        await transaction.rollback();
        return { success: false, errorMessage: '支付流水不存在' };
      }

      if (flow.pay_status === payStatus) {
        await transaction.rollback();
        return { success: true, orderStatus: undefined };
      }

      await this.paymentFlowDao.update(flowId, {
        pay_status: payStatus,
        pay_scenario: payScenario,
        pay_time: payStatus === PayStatus.SUCCESS ? new Date() : undefined,
      }, { transaction });

      if (payStatus === PayStatus.SUCCESS) {
        const result = await this.handlePaymentSuccess(flow, payScenario, transaction);
        await transaction.commit();
        return result;
      }

      if (payStatus === PayStatus.FAILED) {
        await this.handlePaymentFailed(flow, transaction);
        await transaction.commit();
        return { success: true };
      }

      if (payStatus === PayStatus.REFUNDED) {
        await this.handlePaymentRefunded(flow, transaction);
        await transaction.commit();
        return { success: true };
      }

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async handlePaymentSuccess(
    flow: any,
    payScenario: PayScenario,
    transaction: Transaction
  ): Promise<PaymentSyncResult> {
    const order = await this.orderDao.findById(flow.order_id);
    if (!order) {
      return { success: false, errorMessage: '订单不存在' };
    }

    let newOrderStatus = order.status;
    const orderAmount = Number(order.pay_amount || 0);
    const payAmount = Number(flow.amount || 0);

    if (payScenario === PayScenario.FULL && Math.abs(payAmount - orderAmount) <= 0.01) {
      newOrderStatus = 1;
      await this.orderDao.update(order.id, { status: newOrderStatus }, { transaction });
    } else if (payScenario === PayScenario.PARTIAL) {
      await this.orderLogDao.create({
        order_id: order.id,
        operator_id: 0,
        operator_type: 2,
        action: '部分支付成功',
        remark: `已支付${payAmount}元，剩余${orderAmount - payAmount}元待支付`,
      }, { transaction });
    } else if (payScenario === PayScenario.AFTER_REFUND) {
      newOrderStatus = 1;
      await this.orderDao.update(order.id, { status: newOrderStatus }, { transaction });
      await this.orderLogDao.create({
        order_id: order.id,
        operator_id: 0,
        operator_type: 2,
        action: '退款后重新支付成功',
        remark: `退款后重新支付${payAmount}元`,
      }, { transaction });
    }

    if (payScenario === PayScenario.FULL) {
      await this.updateMerchantSettleAmount(order.merchant_id, payAmount, transaction);
      await this.updateUserPoints(flow.user_id, payAmount, transaction);
      await this.updateGoodsSales(order.id, transaction);
      await this.createSettlementRecord(flow, order, transaction);
    }

    await this.orderLogDao.create({
      order_id: order.id,
      operator_id: 0,
      operator_type: 2,
      action: '支付成功',
      remark: `支付方式：${this.getPayTypeName(flow.pay_type)}，支付金额：${payAmount}元`,
    }, { transaction });

    return { success: true, orderStatus: newOrderStatus };
  }

  private async handlePaymentFailed(flow: any, transaction: Transaction): Promise<void> {
    await this.orderLogDao.create({
      order_id: flow.order_id,
      operator_id: 0,
      operator_type: 2,
      action: '支付失败',
      remark: flow.risk_reason || '支付失败，请重试',
    }, { transaction });
  }

  private async handlePaymentRefunded(flow: any, transaction: Transaction): Promise<void> {
    const order = await this.orderDao.findById(flow.order_id);
    if (order) {
      const refundAmount = Number(flow.amount || 0);
      
      if (order.merchant_id) {
        const merchant = await this.merchantDao.findById(order.merchant_id);
        if (merchant) {
          const newPending = Math.max(0, Number(merchant.pending_settle_amount || 0) - refundAmount);
          await this.merchantDao.update(order.merchant_id, {
            pending_settle_amount: newPending,
          }, { transaction });
        }
      }

      await this.orderLogDao.create({
        order_id: order.id,
        operator_id: 0,
        operator_type: 2,
        action: '支付退款',
        remark: `退款金额：${refundAmount}元`,
      }, { transaction });
    }
  }

  private async updateMerchantSettleAmount(
    merchantId: number,
    payAmount: number,
    transaction: Transaction
  ): Promise<void> {
    if (!merchantId) return;

    const merchant = await this.merchantDao.findById(merchantId);
    if (!merchant) return;

    const platformFee = payAmount * PLATFORM_FEE_RATE;
    const settleAmount = payAmount - platformFee;

    await this.merchantDao.update(merchantId, {
      pending_settle_amount: Number(merchant.pending_settle_amount || 0) + settleAmount,
    }, { transaction });
  }

  private async updateUserPoints(
    _userId: number,
    payAmount: number,
    transaction: Transaction
  ): Promise<void> {
    const user = await this.userDao.findById(_userId);
    if (!user) return;

    const points = Math.floor(payAmount * POINTS_RATE);
    await this.userDao.update(_userId, {
      points: Number(user.points || 0) + points,
      total_pay_points: Number(user.total_pay_points || 0) + points,
    }, { transaction });
  }

  private async updateGoodsSales(orderId: number, transaction: Transaction): Promise<void> {
    const orderItems = await this.orderItemDao.findAll({
      where: { order_id: orderId },
    });

    for (const item of orderItems) {
      const goods = await this.goodsDao.findById(item.goods_id);
      if (goods) {
        await this.goodsDao.update(item.goods_id, {
          sales_count: Number(goods.sales_count || 0) + Number(item.quantity || 0),
        }, { transaction });

        const merchant = goods.merchant_id ? await this.merchantDao.findById(goods.merchant_id) : null;
        if (merchant && goods.merchant_id) {
          await this.merchantDao.update(goods.merchant_id, {
            total_sales_count: Number(merchant.total_sales_count || 0) + Number(item.quantity || 0),
          }, { transaction });
        }
      }
    }
  }

  private async createSettlementRecord(
    flow: any,
    order: any,
    transaction: Transaction
  ): Promise<void> {
    const payAmount = Number(flow.amount || 0);
    const platformFee = payAmount * PLATFORM_FEE_RATE;
    const settleAmount = payAmount - platformFee;

    const settleNo = 'JS' + Date.now() + Math.floor(Math.random() * 1000);

    await this.fundSettlementDao.create({
      settle_no: settleNo,
      flow_id: flow.id,
      flow_no: flow.flow_no,
      merchant_id: order.merchant_id || 0,
      merchant_name: order.merchant_name || '平台自营',
      order_id: order.id,
      order_no: order.order_no,
      order_amount: Number(order.pay_amount || 0),
      pay_amount: payAmount,
      platform_fee: platformFee,
      settle_amount: settleAmount,
      status: SettleStatus.PENDING,
    }, { transaction });
  }

  private getPayTypeName(payType: number): string {
    const names: Record<number, string> = {
      1: '微信支付',
      2: '支付宝',
      3: '银行卡',
    };
    return names[payType] || '未知';
  }

  generateFlowNo(): string {
    return 'FL' + Date.now() + Math.floor(Math.random() * 10000);
  }

  generateExpireTime(): Date {
    const expire = new Date();
    expire.setMinutes(expire.getMinutes() + PAY_TIMEOUT_MINUTES);
    return expire;
  }
}

export const paymentValidateService = new PaymentValidateService();
export default paymentValidateService;
