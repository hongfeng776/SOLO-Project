const OrderLog = require('../models/OrderLog');
const Order = require('../models/Order');
const Merchant = require('../models/Merchant');
const Coupon = require('../models/Coupon');
const Flight = require('../models/Flight');
const Hotel = require('../models/Hotel');
const Car = require('../models/Car');
const Ticket = require('../models/Ticket');
const { ValidationError } = require('../utils/error');

const STATUS_TRANSITIONS = {
  flight: {
    0: [1, 2],
    1: [3, 5, 2],
    5: [6, 2]
  },
  hotel: {
    0: [1, 2],
    1: [4, 5],
    4: [3, 5]
  },
  car: {
    0: [1, 2],
    1: [4, 5],
    4: [3, 5]
  },
  ticket: {
    0: [1, 2],
    1: [4, 5]
  },
  business_travel: {
    0: [1, 4],
    1: [2, 4],
    2: [3, 4],
    3: [5, 4]
  }
};

class BusinessLinkageService {
  async createOrderLog(orderId, action, fromStatus, toStatus, operator, changes = null, remark = null) {
    const order = await Order.findByPk(orderId);
    const logData = {
      orderId,
      orderNo: order ? order.orderNo : '',
      action,
      fromStatus,
      toStatus,
      operatorId: operator?.id || null,
      operatorName: operator?.name || '',
      operatorRole: operator?.role || '',
      remark: remark || `状态从 ${fromStatus} 变更为 ${toStatus}`
    };
    if (changes) {
      logData.changes = typeof changes === 'string' ? changes : JSON.stringify(changes);
    }
    return await OrderLog.create(logData);
  }

  async checkInventory(category, productId, quantity) {
    switch (category) {
      case 'flight': {
        const flight = await Flight.findByPk(productId);
        if (!flight) throw new ValidationError('机票不存在');
        if (flight.seats < quantity) throw new ValidationError('机票余座不足');
        break;
      }
      case 'hotel': {
        const hotel = await Hotel.findByPk(productId);
        if (!hotel) throw new ValidationError('酒店不存在');
        if (hotel.rooms < quantity) throw new ValidationError('酒店房间不足');
        break;
      }
      case 'car': {
        const car = await Car.findByPk(productId);
        if (!car) throw new ValidationError('车辆不存在');
        if (car.status !== 1) throw new ValidationError('车辆不可用');
        break;
      }
      case 'ticket': {
        const ticket = await Ticket.findByPk(productId);
        if (!ticket) throw new ValidationError('票务不存在');
        if (ticket.stock < quantity) throw new ValidationError('票务库存不足');
        break;
      }
      default:
        throw new ValidationError('不支持的品类');
    }
    return true;
  }

  async deductInventory(category, productId, quantity) {
    switch (category) {
      case 'flight': {
        const flight = await Flight.findByPk(productId);
        await flight.update({ seats: flight.seats - quantity });
        break;
      }
      case 'hotel': {
        const hotel = await Hotel.findByPk(productId);
        await hotel.update({ rooms: hotel.rooms - quantity });
        break;
      }
      case 'car': {
        const car = await Car.findByPk(productId);
        await car.update({ status: 0 });
        break;
      }
      case 'ticket': {
        const ticket = await Ticket.findByPk(productId);
        await ticket.update({ stock: ticket.stock - quantity });
        break;
      }
    }
  }

  async restoreInventory(category, productId, quantity) {
    switch (category) {
      case 'flight': {
        const flight = await Flight.findByPk(productId);
        if (flight) await flight.update({ seats: flight.seats + quantity });
        break;
      }
      case 'hotel': {
        const hotel = await Hotel.findByPk(productId);
        if (hotel) await hotel.update({ rooms: hotel.rooms + quantity });
        break;
      }
      case 'car': {
        const car = await Car.findByPk(productId);
        if (car) await car.update({ status: 1 });
        break;
      }
      case 'ticket': {
        const ticket = await Ticket.findByPk(productId);
        if (ticket) await ticket.update({ stock: ticket.stock + quantity });
        break;
      }
    }
  }

  async verifyCoupon(couponId, category, amount) {
    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) throw new ValidationError('优惠券不存在');
    if (coupon.status !== 1) throw new ValidationError('优惠券不可用');
    if (coupon.remainStock <= 0) throw new ValidationError('优惠券库存不足');
    const now = new Date();
    if (new Date(coupon.startTime) > now || new Date(coupon.endTime) < now) {
      throw new ValidationError('优惠券不在有效期内');
    }
    if (coupon.category !== 'all' && coupon.category !== category) {
      throw new ValidationError('优惠券不适用品类');
    }
    if (amount < coupon.minAmount) {
      throw new ValidationError('未达到优惠券最低消费');
    }
    return coupon;
  }

  async consumeCoupon(couponId, orderId) {
    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) throw new ValidationError('优惠券不存在');
    await coupon.update({
      usedStock: coupon.usedStock + 1,
      remainStock: coupon.remainStock - 1
    });
    return coupon;
  }

  async linkOrderToMerchant(orderId, merchantId) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new ValidationError('订单不存在');
    await order.update({ merchantId });
    return order;
  }

  async updateMerchantStats(merchantId) {
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) return;
    const orderCount = await Order.count({
      where: { merchantId, status: { [require('sequelize').Op.in]: [1, 3, 4] } }
    });
    const result = await Order.findAll({
      where: { merchantId, status: { [require('sequelize').Op.in]: [1, 3, 4] } },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalAmount']
      ],
      raw: true
    });
    const totalAmount = result[0]?.totalAmount || 0;
    return { orderCount, totalAmount };
  }

  checkStatusTransition(category, fromStatus, toStatus) {
    const transitions = STATUS_TRANSITIONS[category];
    if (!transitions) {
      throw new ValidationError(`不支持的品类: ${category}`);
    }
    const allowed = transitions[fromStatus];
    if (!allowed || !allowed.includes(toStatus)) {
      throw new ValidationError(`品类"${category}"不允许从状态${fromStatus}变更为${toStatus}`);
    }
    return true;
  }

  async autoStatusLinkage(orderId, triggerType) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new ValidationError('订单不存在');
    }

    const fromStatus = order.status;
    let toStatus = null;
    let action = '';

    switch (triggerType) {
      case 'pay_success':
        toStatus = 1;
        action = 'pay';
        await order.update({ status: 1, payTime: new Date() });
        await this.deductInventory(order.category, order.productId, order.quantity || 1);
        break;
      case 'refund_success':
        toStatus = 6;
        action = 'refund';
        await order.update({ status: 6, refundTime: new Date() });
        await this.restoreInventory(order.category, order.productId, order.quantity || 1);
        break;
      case 'fulfill_complete':
        toStatus = order.category === 'flight' ? 3 : 4;
        action = 'complete';
        await order.update({ status: toStatus });
        break;
      case 'cancel':
        toStatus = 2;
        action = 'cancel';
        await order.update({ status: 2 });
        await this.restoreInventory(order.category, order.productId, order.quantity || 1);
        break;
      default:
        throw new ValidationError(`不支持的触发类型: ${triggerType}`);
    }

    await this.createOrderLog(orderId, action, fromStatus, toStatus, {
      id: null,
      name: '系统自动',
      role: 'system'
    });

    await this.updateMerchantStats(order.merchantId);

    return order;
  }

  async validateOrderDataConsistency(orderId) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new ValidationError('订单不存在');
    }

    const logs = await OrderLog.findAll({
      where: { orderId },
      order: [['createdAt', 'ASC']]
    });

    const gaps = [];
    const nodes = {
      create: null,
      pay: null,
      fulfill: null,
      refund: null
    };

    for (const log of logs) {
      if (log.action === 'create') nodes.create = log;
      else if (log.action === 'pay') nodes.pay = log;
      else if (log.action === 'complete' || log.toStatus === 3 || log.toStatus === 4) nodes.fulfill = log;
      else if (log.action === 'refund' || log.toStatus === 5 || log.toStatus === 6) nodes.refund = log;
    }

    if (!nodes.create) {
      gaps.push({ node: 'create', reason: '缺少订单创建日志' });
    } else if (!order.createdAt) {
      gaps.push({ node: 'create', reason: '订单创建时间缺失' });
    }

    if (order.status >= 1 && !nodes.pay) {
      gaps.push({ node: 'pay', reason: '已支付订单缺少支付日志' });
    }
    if (order.status >= 1 && !order.payTime) {
      gaps.push({ node: 'pay', reason: '订单支付时间缺失' });
    }

    if ((order.status === 3 || order.status === 4) && !nodes.fulfill) {
      gaps.push({ node: 'fulfill', reason: '已履约订单缺少履约日志' });
    }

    if ((order.status === 5 || order.status === 6) && !nodes.refund) {
      gaps.push({ node: 'refund', reason: '退款订单缺少退款日志' });
    }

    return {
      isConsistent: gaps.length === 0,
      gaps
    };
  }
}

module.exports = new BusinessLinkageService();
