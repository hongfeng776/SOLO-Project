const BaseController = require('./BaseController');
const orderService = require('../services/OrderService');
const orderLogService = require('../services/OrderLogService');
const businessLinkageService = require('../services/BusinessLinkageService');
const Order = require('../models/Order');
const User = require('../models/User');
const { Op } = require('sequelize');
const { success } = require('../utils/result');
const { NotFoundError } = require('../utils/error');

class OrderController extends BaseController {
  constructor() {
    super(orderService);
  }

  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const order = await Order.findByPk(id);
      if (!order) throw new NotFoundError('订单不存在');
      businessLinkageService.checkStatusTransition(order.category, order.status, 2);
      const fromStatus = order.status;
      await order.update({ status: 2 });
      await businessLinkageService.restoreInventory(order.category, order.productId, order.quantity || 1);
      await businessLinkageService.createOrderLog(order.id, 'cancel', fromStatus, 2, {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || ''
      });
      res.json(success(order, '取消成功'));
    } catch (error) {
      next(error);
    }
  }

  async refundOrder(req, res, next) {
    try {
      const { id } = req.params;
      const order = await Order.findByPk(id);
      if (!order) throw new NotFoundError('订单不存在');
      businessLinkageService.checkStatusTransition(order.category, order.status, 5);
      const fromStatus = order.status;
      await order.update({
        status: 5,
        refundAmount: req.body.refundAmount || order.amount,
        refundReason: req.body.refundReason || '',
        refundTime: new Date()
      });
      await businessLinkageService.restoreInventory(order.category, order.productId, order.quantity || 1);
      await businessLinkageService.createOrderLog(order.id, 'refund', fromStatus, 5, {
        id: req.user?.id,
        name: req.user?.nickname || req.user?.username || ''
      });
      res.json(success(order, '退款申请已提交'));
    } catch (error) {
      next(error);
    }
  }

  async getOrderLogs(req, res, next) {
    try {
      const { id } = req.params;
      const result = await orderLogService.getByOrderId(id);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async batchExport(req, res, next) {
    try {
      const { ids, category, status, startDate, endDate } = req.body;
      const where = {};
      if (ids && ids.length > 0) {
        where.id = ids;
      }
      if (category) where.category = category;
      if (status !== undefined) where.status = status;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }
      const orders = await Order.findAll({
        where,
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname'] }],
        order: [['id', 'DESC']]
      });
      res.json(success(orders, '导出成功'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
