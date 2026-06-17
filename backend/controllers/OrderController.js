const BaseController = require('./BaseController');
const orderService = require('../services/OrderService');
const orderLogService = require('../services/OrderLogService');
const businessLinkageService = require('../services/BusinessLinkageService');
const Order = require('../models/Order');
const User = require('../models/User');
const { Op } = require('sequelize');
const { success } = require('../utils/result');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/error');

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
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
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
        name: req.user?.nickname || req.user?.username || '',
        role: req.user?.roleCode
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

  async getEditDetail(req, res, next) {
    try {
      const { id } = req.params;
      const roleCode = req.user?.roleCode;
      const order = req.order;

      if (roleCode !== 'admin' && order.source === 'third_party') {
        throw new ForbiddenError('第三方来源订单仅管理员可编辑');
      }

      if (order.archiveStatus === 1) {
        throw new ForbiddenError('已归档订单不可编辑');
      }

      const result = await orderService.getEditDetail(id);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async validateEdit(req, res, next) {
    try {
      const { id } = req.params;
      const editData = req.body;
      const roleCode = req.user?.roleCode;
      const order = req.order;

      if (roleCode !== 'admin' && order.source === 'third_party') {
        throw new ForbiddenError('第三方来源订单仅管理员可编辑');
      }

      const result = await orderService.validateEditFields(id, editData);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async updateOrderInfo(req, res, next) {
    try {
      const { id } = req.params;
      const editData = req.body;
      const operator = req.user;
      const roleCode = operator?.roleCode;
      const order = req.order;

      if (roleCode !== 'admin' && order.source === 'third_party') {
        throw new ForbiddenError('第三方来源订单仅管理员可编辑');
      }

      if (roleCode === 'operator' && order.isAbnormal === 1) {
        throw new ForbiddenError('异常订单仅风控人员或管理员可操作');
      }

      if (roleCode === 'risk_operator' && order.isAbnormal !== 1) {
        throw new ForbiddenError('风控人员仅可操作异常订单');
      }

      const result = await orderService.updateOrderInfo(id, editData, operator);
      res.json(success(result, '订单信息更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { targetStatus, remark } = req.body;
      const operator = req.user;

      if (targetStatus === undefined || targetStatus === null) {
        throw new ValidationError('请指定目标状态');
      }

      const order = req.order;

      if (order.isLocked === 1 && targetStatus !== order.status) {
        throw new ForbiddenError('订单已锁定，无法变更状态');
      }

      const result = await orderService.updateOrderStatus(id, targetStatus, operator, remark);
      res.json(success(result, '订单状态更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async resetOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const operator = req.user;
      const order = req.order;

      if (![0, 1].includes(order.status)) {
        throw new ForbiddenError('仅未履约订单可执行状态重置');
      }

      if (order.isLocked === 1) {
        throw new ForbiddenError('订单已锁定，无法重置状态');
      }

      const result = await orderService.resetOrderStatus(id, operator);
      res.json(success(result, '订单状态重置成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchConfirmFulfill(req, res, next) {
    try {
      const { ids } = req.body;
      const operator = req.user;
      const roleCode = operator?.roleCode;

      if (!['admin', 'operator'].includes(roleCode)) {
        throw new ForbiddenError('仅管理员和运营人员可批量确认履约');
      }

      const result = await orderService.batchConfirmFulfill(ids, operator);
      res.json(success(result, `批量确认履约完成：成功${result.success.length}条，失败${result.failed.length}条`));
    } catch (error) {
      next(error);
    }
  }

  async batchMarkAbnormal(req, res, next) {
    try {
      const { ids, abnormalReason } = req.body;
      const operator = req.user;
      const roleCode = operator?.roleCode;

      if (!['admin', 'risk_operator'].includes(roleCode)) {
        throw new ForbiddenError('仅管理员和风控人员可批量标记异常');
      }

      if (!abnormalReason || abnormalReason.trim().length === 0) {
        throw new ValidationError('请填写异常原因');
      }

      const result = await orderService.batchMarkAbnormal(ids, abnormalReason, operator);
      res.json(success(result, `批量标记异常完成：成功${result.success.length}条，失败${result.failed.length}条`));
    } catch (error) {
      next(error);
    }
  }

  async batchArchive(req, res, next) {
    try {
      const { ids } = req.body;
      const operator = req.user;
      const roleCode = operator?.roleCode;

      if (roleCode !== 'admin') {
        throw new ForbiddenError('仅管理员可批量归档');
      }

      const result = await orderService.batchArchive(ids, operator);
      res.json(success(result, `批量归档完成：成功${result.success.length}条，失败${result.failed.length}条`));
    } catch (error) {
      next(error);
    }
  }

  async traceOrder(req, res, next) {
    try {
      const { keyword } = req.query;
      const operator = req.user;

      const result = await orderService.traceOrder(keyword, operator);
      res.json(success(result, '订单溯源查询成功'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
