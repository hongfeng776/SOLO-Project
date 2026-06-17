const BaseService = require('./BaseService');
const Order = require('../models/Order');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const OrderLog = require('../models/OrderLog');
const Flight = require('../models/Flight');
const Hotel = require('../models/Hotel');
const Car = require('../models/Car');
const Ticket = require('../models/Ticket');
const businessLinkageService = require('./BusinessLinkageService');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { ValidationError, ForbiddenError, NotFoundError } = require('../utils/error');

const EDITABLE_STATUSES = [0, 1];
const CORE_FIELDS = ['amount', 'productId', 'category', 'merchantId'];
const TRACE_CACHE = new Map();
const TRACE_CACHE_DURATION = 5000;

class OrderService extends BaseService {
  constructor() {
    super(Order);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['orderNo', 'productName'],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname'] },
        { model: Merchant, as: 'merchant', attributes: ['id', 'name'] }
      ]
    });
  }

  async getById(id) {
    return super.getById(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname'] },
        { model: Merchant, as: 'merchant', attributes: ['id', 'name'] }
      ]
    });
  }

  async getEditDetail(id) {
    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'phone', 'status'] },
        { model: Merchant, as: 'merchant', attributes: ['id', 'name', 'auditStatus', 'status'] }
      ]
    });

    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (!EDITABLE_STATUSES.includes(order.status)) {
      throw new ForbiddenError('当前订单状态不可编辑');
    }

    if (order.archiveStatus === 1) {
      throw new ForbiddenError('已归档订单不可编辑');
    }

    return order;
  }

  async validateEditFields(orderId, editData) {
    const errors = [];
    const order = await Order.findByPk(orderId);

    if (!order) {
      errors.push('订单不存在');
      return { valid: false, errors };
    }

    if (editData.amount !== undefined) {
      const amount = parseFloat(editData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('订单金额必须大于0');
      }
      if (editData.quantity !== undefined && editData.unitPrice !== undefined) {
        const calculatedAmount = parseFloat(editData.quantity) * parseFloat(editData.unitPrice);
        if (Math.abs(calculatedAmount - amount) > 0.01) {
          errors.push('订单金额与数量×单价不匹配');
        }
      }
    }

    if (editData.category) {
      const validCategories = ['flight', 'hotel', 'car', 'ticket', 'business_travel'];
      if (!validCategories.includes(editData.category)) {
        errors.push('无效的订单品类');
      }
    }

    const category = editData.category || order.category;
    if (category === 'flight' && editData.departureTime) {
      const departureTime = new Date(editData.departureTime);
      if (isNaN(departureTime.getTime())) {
        errors.push('无效的出发时间');
      }
    }
    if (category === 'hotel' && editData.checkInTime) {
      const checkInTime = new Date(editData.checkInTime);
      if (isNaN(checkInTime.getTime())) {
        errors.push('无效的入住时间');
      }
    }

    if (editData.userId !== undefined) {
      const user = await User.findByPk(editData.userId);
      if (!user) {
        errors.push('用户不存在');
      } else if (user.status !== 1) {
        errors.push('用户状态异常');
      }
    }

    if (editData.merchantId !== undefined) {
      const merchant = await Merchant.findByPk(editData.merchantId);
      if (!merchant) {
        errors.push('商家不存在');
      } else if (merchant.auditStatus !== 1) {
        errors.push('商家未通过审核');
      } else if (merchant.status !== 1) {
        errors.push('商家状态异常');
      }
    }

    if (editData.productId !== undefined) {
      const productId = editData.productId;
      let product = null;
      switch (category) {
        case 'flight':
          product = await Flight.findByPk(productId);
          break;
        case 'hotel':
          product = await Hotel.findByPk(productId);
          break;
        case 'car':
          product = await Car.findByPk(productId);
          break;
        case 'ticket':
          product = await Ticket.findByPk(productId);
          break;
      }
      if (!product) {
        errors.push('商品不存在');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async updateOrderInfo(id, editData, operator) {
    const order = await Order.findByPk(id);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    const roleCode = operator?.roleCode;
    if (roleCode !== 'admin' && order.source === 'third_party') {
      throw new ForbiddenError('第三方来源订单仅管理员可编辑');
    }

    if (!EDITABLE_STATUSES.includes(order.status) || order.archiveStatus === 1) {
      throw new ForbiddenError('当前订单状态不可编辑');
    }

    const validation = await this.validateEditFields(id, editData);
    if (!validation.valid) {
      throw new ValidationError('字段校验失败', validation.errors);
    }

    const changedFields = {};
    const hasCoreFieldChange = CORE_FIELDS.some(field => {
      if (editData[field] !== undefined && editData[field] !== order[field]) {
        changedFields[field] = {
          old: order[field],
          new: editData[field]
        };
        return true;
      }
      return false;
    });

    for (const field of Object.keys(editData)) {
      if (!CORE_FIELDS.includes(field) && editData[field] !== order[field]) {
        changedFields[field] = {
          old: order[field],
          new: editData[field]
        };
      }
    }

    const updateData = { ...editData };

    if (hasCoreFieldChange) {
      updateData.isLocked = 1;
      updateData.lockReason = `核心字段变更自动锁定：${Object.keys(changedFields).filter(f => CORE_FIELDS.includes(f)).join('、')}`;
      updateData.lockTime = new Date();
    }

    const updatedOrder = await order.update(updateData);

    await businessLinkageService.createOrderLog(
      id,
      'edit',
      order.status,
      order.status,
      {
        id: operator?.id,
        name: operator?.nickname || operator?.username || '',
        role: roleCode
      },
      changedFields,
      '订单信息编辑'
    );

    if (editData.userId !== undefined || editData.amount !== undefined) {
      await this._updateUserOrderStats(editData.userId || order.userId);
    }

    if (editData.merchantId !== undefined || editData.amount !== undefined) {
      await businessLinkageService.updateMerchantStats(editData.merchantId || order.merchantId);
      if (editData.merchantId !== undefined && editData.merchantId !== order.merchantId) {
        await businessLinkageService.updateMerchantStats(order.merchantId);
      }
    }

    return updatedOrder;
  }

  async updateOrderStatus(id, targetStatus, operator, remark = '') {
    const order = await Order.findByPk(id);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    businessLinkageService.checkStatusTransition(order.category, order.status, targetStatus);

    if (order.isLocked === 1 && targetStatus !== order.status) {
      throw new ForbiddenError('订单已锁定，无法变更状态');
    }

    const fromStatus = order.status;

    const updatedOrder = await order.update({ status: targetStatus });

    await businessLinkageService.createOrderLog(
      id,
      'status_change',
      fromStatus,
      targetStatus,
      {
        id: operator?.id,
        name: operator?.nickname || operator?.username || '',
        role: operator?.roleCode
      },
      null,
      remark || `状态从 ${fromStatus} 变更为 ${targetStatus}`
    );

    await this._updateUserOrderStats(order.userId);
    await businessLinkageService.updateMerchantStats(order.merchantId);

    if (targetStatus === 1 && fromStatus === 0) {
      await businessLinkageService.deductInventory(order.category, order.productId, order.quantity || 1);
    } else if ((targetStatus === 2 || targetStatus === 5 || targetStatus === 6) && fromStatus === 1) {
      await businessLinkageService.restoreInventory(order.category, order.productId, order.quantity || 1);
    }

    return updatedOrder;
  }

  async resetOrderStatus(id, operator) {
    const order = await Order.findByPk(id);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (![0, 1].includes(order.status)) {
      throw new ForbiddenError('仅未履约订单可执行状态重置');
    }

    if (order.isLocked === 1) {
      throw new ForbiddenError('订单已锁定，无法重置状态');
    }

    const fromStatus = order.status;
    const updatedOrder = await order.update({ status: 0 });

    await businessLinkageService.createOrderLog(
      id,
      'reset',
      fromStatus,
      0,
      {
        id: operator?.id,
        name: operator?.nickname || operator?.username || '',
        role: operator?.roleCode
      },
      null,
      '状态重置'
    );

    if (fromStatus === 1) {
      await businessLinkageService.restoreInventory(order.category, order.productId, order.quantity || 1);
    }

    return updatedOrder;
  }

  async batchConfirmFulfill(ids, operator) {
    const result = {
      success: [],
      failed: [],
      total: ids.length
    };

    const transaction = await sequelize.transaction();

    try {
      for (const id of ids) {
        try {
          const order = await Order.findByPk(id, { transaction });
          if (!order) {
            result.failed.push({ id, reason: '订单不存在' });
            continue;
          }

          if (order.status !== 1) {
            result.failed.push({ id, reason: '仅已支付订单可确认履约' });
            continue;
          }

          const targetStatus = order.category === 'flight' ? 3 : 4;
          const fromStatus = order.status;

          await order.update({ status: targetStatus }, { transaction });

          await OrderLog.create({
            orderId: id,
            orderNo: order.orderNo,
            action: 'batch_confirm',
            fromStatus,
            toStatus: targetStatus,
            operatorId: operator?.id,
            operatorName: operator?.nickname || operator?.username || '',
            operatorRole: operator?.roleCode,
            remark: '批量确认履约'
          }, { transaction });

          result.success.push(id);
        } catch (error) {
          result.failed.push({ id, reason: error.message });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    for (const id of result.success) {
      const order = await Order.findByPk(id);
      if (order) {
        await this._updateUserOrderStats(order.userId);
        await businessLinkageService.updateMerchantStats(order.merchantId);
      }
    }

    return result;
  }

  async batchMarkAbnormal(ids, abnormalReason, operator) {
    const result = {
      success: [],
      failed: [],
      total: ids.length
    };

    const transaction = await sequelize.transaction();

    try {
      for (const id of ids) {
        try {
          const order = await Order.findByPk(id, { transaction });
          if (!order) {
            result.failed.push({ id, reason: '订单不存在' });
            continue;
          }

          if ([3, 4, 6].includes(order.status)) {
            result.failed.push({ id, reason: '已完成/已退款订单不可标记异常' });
            continue;
          }

          const fromStatus = order.status;

          await order.update({
            isAbnormal: 1,
            abnormalReason
          }, { transaction });

          await OrderLog.create({
            orderId: id,
            orderNo: order.orderNo,
            action: 'mark_abnormal',
            fromStatus,
            toStatus: fromStatus,
            operatorId: operator?.id,
            operatorName: operator?.nickname || operator?.username || '',
            operatorRole: operator?.roleCode,
            changes: JSON.stringify({ isAbnormal: { old: 0, new: 1 }, abnormalReason: { old: order.abnormalReason, new: abnormalReason } }),
            remark: '批量标记异常'
          }, { transaction });

          result.success.push(id);
        } catch (error) {
          result.failed.push({ id, reason: error.message });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return result;
  }

  async batchArchive(ids, operator) {
    const result = {
      success: [],
      failed: [],
      total: ids.length
    };

    const transaction = await sequelize.transaction();

    try {
      for (const id of ids) {
        try {
          const order = await Order.findByPk(id, { transaction });
          if (!order) {
            result.failed.push({ id, reason: '订单不存在' });
            continue;
          }

          if (![3, 4, 2, 6].includes(order.status)) {
            result.failed.push({ id, reason: '仅已完成/已取消/已退款订单可归档' });
            continue;
          }

          if (order.archiveStatus === 1) {
            result.failed.push({ id, reason: '订单已归档' });
            continue;
          }

          const fromStatus = order.status;

          await order.update({
            archiveStatus: 1,
            archiveTime: new Date()
          }, { transaction });

          await OrderLog.create({
            orderId: id,
            orderNo: order.orderNo,
            action: 'archive',
            fromStatus,
            toStatus: fromStatus,
            operatorId: operator?.id,
            operatorName: operator?.nickname || operator?.username || '',
            operatorRole: operator?.roleCode,
            changes: JSON.stringify({ archiveStatus: { old: 0, new: 1 } }),
            remark: '批量归档'
          }, { transaction });

          result.success.push(id);
        } catch (error) {
          result.failed.push({ id, reason: error.message });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return result;
  }

  async traceOrder(keyword, operator) {
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length < 2) {
      throw new ValidationError('请输入有效的搜索关键词（至少2个字符）');
    }

    const userId = operator?.id;
    const cacheKey = `${userId}_${keyword}_trace`;
    const now = Date.now();

    if (TRACE_CACHE.has(cacheKey)) {
      const timestamp = TRACE_CACHE.get(cacheKey);
      if (now - timestamp < TRACE_CACHE_DURATION) {
        throw new ValidationError('请求过于频繁，请5秒后再试');
      }
    }
    TRACE_CACHE.set(cacheKey, now);

    const cleanedKeyword = keyword.trim();

    const where = {
      [Op.or]: [
        { orderNo: cleanedKeyword },
        { '$user.phone$': { [Op.like]: `%${cleanedKeyword}%` } }
      ]
    };

    if (!isNaN(parseInt(cleanedKeyword))) {
      where[Op.or].push({ merchantId: parseInt(cleanedKeyword) });
    }

    const categories = ['flight', 'hotel', 'car', 'ticket', 'business_travel'];
    if (categories.includes(cleanedKeyword)) {
      where[Op.or].push({ category: cleanedKeyword });
    }

    const orders = await Order.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'phone'] },
        { model: Merchant, as: 'merchant', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    const results = [];

    for (const order of orders) {
      const consistency = await businessLinkageService.validateOrderDataConsistency(order.id);
      const logs = await OrderLog.findAll({
        where: { orderId: order.id },
        order: [['createdAt', 'ASC']]
      });

      const processNodes = this._buildProcessNodes(order, logs, consistency.gaps);

      results.push({
        order: {
          id: order.id,
          orderNo: order.orderNo,
          category: order.category,
          productName: order.productName,
          amount: order.amount,
          status: order.status,
          isAbnormal: order.isAbnormal,
          archiveStatus: order.archiveStatus,
          source: order.source,
          createdAt: order.createdAt,
          user: order.user,
          merchant: order.merchant
        },
        processNodes,
        isDataGap: !consistency.isConsistent,
        gapReasons: consistency.gaps.map(g => g.reason)
      });
    }

    return results;
  }

  _buildProcessNodes(order, logs, gaps) {
    const nodes = [];
    const logMap = {};

    for (const log of logs) {
      if (!logMap[log.action]) {
        logMap[log.action] = log;
      }
    }

    const createLog = logs.find(l => l.action === 'create' || l.toStatus === 0);
    nodes.push({
      name: '订单创建',
      status: createLog ? 'completed' : 'gap',
      time: createLog?.createdAt || order.createdAt,
      operator: createLog?.operatorName || '',
      isDataGap: !createLog || gaps.some(g => g.node === 'create')
    });

    const payLog = logs.find(l => l.action === 'pay' || l.toStatus === 1);
    nodes.push({
      name: '订单支付',
      status: payLog ? 'completed' : (order.status >= 1 ? 'gap' : 'pending'),
      time: payLog?.createdAt || order.payTime,
      operator: payLog?.operatorName || '',
      isDataGap: order.status >= 1 && (!payLog || gaps.some(g => g.node === 'pay'))
    });

    const fulfillLog = logs.find(l => l.action === 'complete' || l.toStatus === 3 || l.toStatus === 4);
    nodes.push({
      name: '订单履约',
      status: fulfillLog ? 'completed' : ([3, 4].includes(order.status) ? 'gap' : 'pending'),
      time: fulfillLog?.createdAt,
      operator: fulfillLog?.operatorName || '',
      isDataGap: [3, 4].includes(order.status) && (!fulfillLog || gaps.some(g => g.node === 'fulfill'))
    });

    const refundLog = logs.find(l => l.action === 'refund' || l.toStatus === 5 || l.toStatus === 6);
    nodes.push({
      name: '订单售后',
      status: refundLog ? 'completed' : ([5, 6].includes(order.status) ? 'gap' : 'pending'),
      time: refundLog?.createdAt || order.refundTime,
      operator: refundLog?.operatorName || '',
      isDataGap: [5, 6].includes(order.status) && (!refundLog || gaps.some(g => g.node === 'refund'))
    });

    return nodes;
  }

  async _updateUserOrderStats(userId) {
    const user = await User.findByPk(userId);
    if (!user) return;

    const stats = await Order.findAll({
      where: { userId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      group: ['status'],
      raw: true
    });

    return stats;
  }
}

module.exports = new OrderService();
