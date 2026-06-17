import { daos } from '../dao';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { PaymentFlow } from '../models/PaymentFlow';
import { GoodsSnapshot } from '../models/GoodsSnapshot';
import { MerchantOrderRecord } from '../models/MerchantOrderRecord';
import { OrderException } from '../models/OrderException';
import { OrderLog } from '../models/OrderLog';
import { AppError } from '../middlewares/errorHandler';

export interface OrderTraceData {
  order: Order;
  items: OrderItem[];
  user: { id: number; username: string; phone?: string };
  merchant: { id: number; name: string; contact?: string; phone?: string };
  paymentFlows: PaymentFlow[];
  goodsSnapshots: GoodsSnapshot[];
  merchantRecords: MerchantOrderRecord[];
  exceptions: OrderException[];
  orderLogs: OrderLog[];
}

export interface OrderValidationReport {
  duplicateCheck: { passed: boolean; message: string };
  amountCheck: { passed: boolean; message: string };
  fieldCheck: { passed: boolean; message: string; invalidFields: string[] };
  overall: { passed: boolean; totalChecks: number; passedChecks: number };
}

class OrderTraceService {
  private readonly orderDao = daos.orderDao;
  private readonly orderItemDao = daos.orderItemDao;
  private readonly userDao = daos.userDao;
  private readonly merchantDao = daos.merchantDao;
  private readonly paymentFlowDao = daos.paymentFlowDao;
  private readonly goodsSnapshotDao = daos.goodsSnapshotDao;
  private readonly merchantOrderRecordDao = daos.merchantOrderRecordDao;
  private readonly orderExceptionDao = daos.orderExceptionDao;
  private readonly orderLogDao = daos.orderLogDao;

  async getOrderTrace(orderId: number): Promise<OrderTraceData> {
    const order = await this.orderDao.findById(orderId);
    if (!order) {
      throw new AppError('订单不存在', 404);
    }

    const [
      items,
      user,
      merchant,
      paymentFlows,
      goodsSnapshots,
      merchantRecords,
      exceptions,
      orderLogs,
    ] = await Promise.all([
      this.orderItemDao.findAll({ where: { order_id: orderId }, order: [['id', 'ASC']] }),
      this.userDao.findById(order.user_id, { attributes: ['id', 'username', 'phone'] }),
      this.merchantDao.findById(order.merchant_id || 0, { attributes: ['id', 'name', 'contact', 'phone'] }),
      this.paymentFlowDao.findAll({ where: { order_id: orderId }, order: [['created_at', 'DESC']] }),
      this.goodsSnapshotDao.findAll({ where: { order_id: orderId }, order: [['id', 'ASC']] }),
      this.merchantOrderRecordDao.findAll({ where: { order_id: orderId }, order: [['created_at', 'DESC']] }),
      this.orderExceptionDao.findAll({ where: { order_id: orderId }, order: [['created_at', 'DESC']] }),
      this.orderLogDao.findAll({ where: { order_id: orderId }, order: [['created_at', 'DESC']] }),
    ]);

    return {
      order,
      items,
      user: user ? { id: user.id, username: user.username, phone: user.phone } : { id: 0, username: '未知用户' },
      merchant: merchant ? { id: merchant.id, name: merchant.name, contact: merchant.contact, phone: merchant.phone } : { id: 0, name: '未知商家' },
      paymentFlows,
      goodsSnapshots,
      merchantRecords,
      exceptions,
      orderLogs,
    };
  }

  async getUserOrderHistory(userId: number, limit: number = 20) {
    return this.orderDao.findPage({
      page: 1,
      pageSize: limit,
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  }

  async validateOrderData(orderId: number): Promise<OrderValidationReport> {
    const order = await this.orderDao.findById(orderId);
    if (!order) {
      throw new AppError('订单不存在', 404);
    }

    const duplicateCheck = await this.checkDuplicateOrder(order.order_no!, order.id);
    const amountCheck = await this.checkAmountConsistency(order.id, order.total_amount!, order.pay_amount!);
    const fieldCheck = this.checkFieldValidity(order);

    const totalChecks = 3;
    const passedChecks = [duplicateCheck.passed, amountCheck.passed, fieldCheck.passed].filter(Boolean).length;

    return {
      duplicateCheck,
      amountCheck,
      fieldCheck,
      overall: {
        passed: passedChecks === totalChecks,
        totalChecks,
        passedChecks,
      },
    };
  }

  private async checkDuplicateOrder(orderNo: string, excludeId: number): Promise<{ passed: boolean; message: string }> {
    const existingOrders = await this.orderDao.findAll({
      where: { order_no: orderNo, id: { [Symbol.for('ne') as any]: excludeId } },
    });

    if (existingOrders.length > 0) {
      return {
        passed: false,
        message: `存在重复订单号：${orderNo}，重复订单ID：${existingOrders.map(o => o.id).join(', ')}`,
      };
    }

    return { passed: true, message: '订单号唯一性校验通过' };
  }

  private async checkAmountConsistency(orderId: number, totalAmount: number, payAmount: number): Promise<{ passed: boolean; message: string }> {
    const items = await this.orderItemDao.findAll({ where: { order_id: orderId } });
    const itemsTotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

    if (Math.abs(itemsTotal - Number(totalAmount)) > 0.01) {
      return {
        passed: false,
        message: `金额不一致：商品小计总和 ${itemsTotal.toFixed(2)} ≠ 订单总金额 ${Number(totalAmount).toFixed(2)}`,
      };
    }

    if (Number(payAmount) < 0) {
      return {
        passed: false,
        message: `实付金额异常：${Number(payAmount).toFixed(2)} 为负数`,
      };
    }

    if (Number(totalAmount) < 0) {
      return {
        passed: false,
        message: `订单总金额异常：${Number(totalAmount).toFixed(2)} 为负数`,
      };
    }

    return { passed: true, message: '金额一致性校验通过' };
  }

  private checkFieldValidity(order: Order): { passed: boolean; message: string; invalidFields: string[] } {
    const invalidFields: string[] = [];

    if (!order.order_no || order.order_no.length < 8) {
      invalidFields.push('orderNo');
    }

    if (!order.user_id || order.user_id <= 0) {
      invalidFields.push('userId');
    }

    if (!order.total_amount || order.total_amount < 0) {
      invalidFields.push('totalAmount');
    }

    if (!order.pay_amount || order.pay_amount < 0) {
      invalidFields.push('payAmount');
    }

    if (order.status === undefined || order.status < 0 || order.status > 4) {
      invalidFields.push('status');
    }

    if (order.pay_status === undefined || order.pay_status < 0 || order.pay_status > 1) {
      invalidFields.push('payStatus');
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (order.receiver_phone && !phoneRegex.test(order.receiver_phone)) {
      invalidFields.push('receiverPhone');
    }

    if (invalidFields.length > 0) {
      return {
        passed: false,
        message: `字段校验不通过，无效字段：${invalidFields.join('、')}`,
        invalidFields,
      };
    }

    return { passed: true, message: '字段合规性校验通过', invalidFields: [] };
  }

  async getOrderStatistics(orderId: number) {
    const traceData = await this.getOrderTrace(orderId);
    return {
      orderId,
      orderNo: traceData.order.order_no,
      itemCount: traceData.items.length,
      totalAmount: traceData.order.total_amount,
      payAmount: traceData.order.pay_amount,
      paymentCount: traceData.paymentFlows.length,
      successfulPayments: traceData.paymentFlows.filter(p => p.pay_status === 1).length,
      snapshotCount: traceData.goodsSnapshots.length,
      exceptionCount: traceData.exceptions.length,
      logCount: traceData.orderLogs.length,
      isException: traceData.order.is_exception === 1,
      isArchived: traceData.order.is_archived === 1,
    };
  }
}

export const orderTraceService = new OrderTraceService();
export default OrderTraceService;
