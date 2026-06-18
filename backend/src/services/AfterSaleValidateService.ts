import { Op } from 'sequelize';
import { daos } from '../dao';
import { OrderStatus } from './ShippingValidateService';

export enum AfterSaleValidateCode {
  SUCCESS = 'SUCCESS',
  EXPIRED = 'EXPIRED',
  EXCEED_MAX_APPLY = 'EXCEED_MAX_APPLY',
  ORDER_STATUS_ERROR = 'ORDER_STATUS_ERROR',
  LOW_CREDIT = 'LOW_CREDIT',
  DUPLICATE_APPLY = 'DUPLICATE_APPLY',
  INVALID_AFTER_SALE_TYPE = 'INVALID_AFTER_SALE_TYPE',
  ORDER_NOT_PAID = 'ORDER_NOT_PAID',
  ALREADY_TERMINATED = 'ALREADY_TERMINATED',
  INVALID_TERMINATE = 'INVALID_TERMINATE',
}

export interface AfterSaleValidateResult {
  valid: boolean;
  errorCode?: AfterSaleValidateCode;
  errorMessage?: string;
  restrictionRules?: string[];
}

export interface AfterSaleApplyData {
  orderId: number;
  userId: number;
  type: number;
  reason?: string;
  amount?: number;
  items?: any;
}

export interface OrderTerminateData {
  orderId: number;
  terminateType: number;
  terminateReason?: string;
  operatorId: number;
  operatorName: string;
}

const AFTER_SALE_DEADLINE_DAYS = 7;
const MAX_APPLY_COUNT = 3;
const MIN_CREDIT_LEVEL = 2;

const AFTER_SALE_TYPE_NAMES: Record<number, string> = {
  1: '退款',
  2: '退货退款',
  3: '换货',
  4: '维修',
};

const ORDER_STATUS_NAMES: Record<number, string> = {
  [OrderStatus.PENDING_PAYMENT]: '待支付',
  [OrderStatus.PENDING_SHIPMENT]: '待发货',
  [OrderStatus.SHIPPED]: '已发货',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
};

class AfterSaleValidateService {
  readonly orderDao = daos.orderDao;
  readonly afterSaleDao = daos.afterSaleDao;
  readonly userDao = daos.userDao;

  validateAfterSaleDeadline(order: any): AfterSaleValidateResult {
    if (!order) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.EXPIRED,
        errorMessage: '订单不存在',
        restrictionRules: ['订单不存在，无法申请售后'],
      };
    }

    const completedAt = order.signed_at || order.completed_at;
    if (!completedAt) {
      return { valid: true };
    }

    const deadline = new Date(completedAt);
    deadline.setDate(deadline.getDate() + AFTER_SALE_DEADLINE_DAYS);

    if (new Date() > deadline) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.EXPIRED,
        errorMessage: `已超出售后时效，订单完成后${AFTER_SALE_DEADLINE_DAYS}天内可申请售后`,
        restrictionRules: [`售后申请时效：订单完成后${AFTER_SALE_DEADLINE_DAYS}天内`],
      };
    }

    return { valid: true };
  }

  async validateApplyCount(orderId: number): Promise<AfterSaleValidateResult> {
    const afterSales = await this.afterSaleDao.findAll({
      where: { order_id: orderId },
    });

    const count = afterSales ? afterSales.length : 0;
    if (count >= MAX_APPLY_COUNT) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.EXCEED_MAX_APPLY,
        errorMessage: `售后申请次数已达上限，同一订单最多申请${MAX_APPLY_COUNT}次`,
        restrictionRules: [`同一订单售后申请上限：${MAX_APPLY_COUNT}次`],
      };
    }

    return { valid: true };
  }

  validateOrderStatus(order: any, afterSaleType: number): AfterSaleValidateResult {
    if (!order) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.ORDER_STATUS_ERROR,
        errorMessage: '订单不存在',
      };
    }

    const typeName = AFTER_SALE_TYPE_NAMES[afterSaleType] || '未知类型';
    const currentStatusName = ORDER_STATUS_NAMES[order.status] || '未知';

    if (afterSaleType === 1) {
      if (order.status < OrderStatus.PENDING_SHIPMENT || order.pay_status !== 1) {
        return {
          valid: false,
          errorCode: AfterSaleValidateCode.ORDER_STATUS_ERROR,
          errorMessage: `${typeName}要求订单已支付，当前订单状态：${currentStatusName}`,
        };
      }
    } else if (afterSaleType === 2) {
      if (order.status < OrderStatus.SHIPPED) {
        return {
          valid: false,
          errorCode: AfterSaleValidateCode.ORDER_STATUS_ERROR,
          errorMessage: `${typeName}要求订单已发货，当前订单状态：${currentStatusName}`,
        };
      }
    } else if (afterSaleType === 3 || afterSaleType === 4) {
      if (order.status < OrderStatus.COMPLETED) {
        return {
          valid: false,
          errorCode: AfterSaleValidateCode.ORDER_STATUS_ERROR,
          errorMessage: `${typeName}要求订单已完成，当前订单状态：${currentStatusName}`,
        };
      }
    }

    return { valid: true };
  }

  async validateUserCredit(userId: number): Promise<AfterSaleValidateResult> {
    const user = await this.userDao.findById(userId);
    if (!user) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.LOW_CREDIT,
        errorMessage: '用户不存在',
      };
    }

    const creditLevel = Number(user.credit_level || 0);
    const violationCount = Number(user.violation_count || 0);

    if (creditLevel < MIN_CREDIT_LEVEL || violationCount >= 5) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.LOW_CREDIT,
        errorMessage: `用户信用等级不足（当前等级：${creditLevel}，违规次数：${violationCount}）`,
        restrictionRules: [`信用等级需>=${MIN_CREDIT_LEVEL}，违规次数需<5`],
      };
    }

    return { valid: true };
  }

  async checkDuplicateApply(orderId: number, userId: number): Promise<AfterSaleValidateResult> {
    const existingAfterSale = await this.afterSaleDao.findOne({
      where: {
        order_id: orderId,
        user_id: userId,
        status: { [Op.in]: [0, 1, 2] },
      },
    });

    if (existingAfterSale) {
      const statusNames: Record<number, string> = {
        0: '待审核',
        1: '处理中',
        2: '处理中',
      };
      const statusName = statusNames[existingAfterSale.status ?? 0] || '处理中';
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.DUPLICATE_APPLY,
        errorMessage: `该订单已有${statusName}的售后申请，请勿重复提交`,
      };
    }

    return { valid: true };
  }

  validateAfterSaleType(order: any, type: number): AfterSaleValidateResult {
    if (!order) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.INVALID_AFTER_SALE_TYPE,
        errorMessage: '订单不存在',
      };
    }

    if (!AFTER_SALE_TYPE_NAMES[type]) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.INVALID_AFTER_SALE_TYPE,
        errorMessage: `无效的售后类型：${type}`,
      };
    }

    if (order.status === OrderStatus.CANCELLED) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.INVALID_AFTER_SALE_TYPE,
        errorMessage: '已取消的订单不能申请售后',
      };
    }

    if (order.status === OrderStatus.PENDING_PAYMENT && type !== 1) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.INVALID_AFTER_SALE_TYPE,
        errorMessage: '未支付订单仅支持退款类型',
      };
    }

    return { valid: true };
  }

  validateTerminate(order: any, terminateType: number): AfterSaleValidateResult {
    if (!order) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.INVALID_TERMINATE,
        errorMessage: '订单不存在',
      };
    }

    if (order.status === OrderStatus.CANCELLED) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.ALREADY_TERMINATED,
        errorMessage: '订单已终止，不能重复操作',
      };
    }

    if (order.status === OrderStatus.COMPLETED && terminateType === 1) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.ALREADY_TERMINATED,
        errorMessage: '已完成的订单不能主动取消',
      };
    }

    if (terminateType === 2 && order.pay_status === 1) {
      return {
        valid: false,
        errorCode: AfterSaleValidateCode.INVALID_TERMINATE,
        errorMessage: '超时取消仅适用于未支付订单',
      };
    }

    return { valid: true };
  }

  async verifyAfterSaleApply(data: AfterSaleApplyData): Promise<AfterSaleValidateResult[]> {
    const results: AfterSaleValidateResult[] = [];

    const order = await this.orderDao.findById(data.orderId);

    const deadlineResult = this.validateAfterSaleDeadline(order);
    results.push(deadlineResult);

    const applyCountResult = await this.validateApplyCount(data.orderId);
    results.push(applyCountResult);

    const orderStatusResult = this.validateOrderStatus(order, data.type);
    results.push(orderStatusResult);

    const creditResult = await this.validateUserCredit(data.userId);
    results.push(creditResult);

    const duplicateResult = await this.checkDuplicateApply(data.orderId, data.userId);
    results.push(duplicateResult);

    const typeResult = this.validateAfterSaleType(order, data.type);
    results.push(typeResult);

    return results;
  }

  async verifyOrderTerminate(data: OrderTerminateData): Promise<AfterSaleValidateResult[]> {
    const results: AfterSaleValidateResult[] = [];

    const order = await this.orderDao.findById(data.orderId);

    const terminateResult = this.validateTerminate(order, data.terminateType);
    results.push(terminateResult);

    return results;
  }
}

export const afterSaleValidateService = new AfterSaleValidateService();
export default afterSaleValidateService;
