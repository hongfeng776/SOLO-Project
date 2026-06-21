const { MemberOrder, MemberOrderLog, MemberOrderRefund, EndUser, sequelize, generateOrderNo } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError, ForbiddenError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

const LOG_TYPE_MAP = {
  CREATE: '创建订单',
  CANCEL: '取消订单',
  PAY_SUCCESS: '支付成功',
  PAY_FAIL: '支付失败',
  EXPIRE: '订单过期',
  VERIFY: '订单核验',
  REFUND: '发起退款',
  APPEAL: '异常申诉',
  BATCH_CLOSE: '批量关闭',
  BATCH_VERIFY: '批量核验',
};

const generateBatchNo = () => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `MOB${dateStr}${random}`;
};

const generateRefundNo = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `RF${ts}${rand}`;
};

const formatOrder = (o) => ({
  id: o.id,
  orderNo: o.orderNo,
  userId: o.userId,
  uid: o.uid,
  packageType: o.packageType,
  packageName: o.packageName,
  memberLevelTier: o.memberLevelTier,
  originalAmount: o.originalAmount,
  payAmount: o.payAmount,
  discountAmount: o.discountAmount,
  orderStatus: o.orderStatus,
  payChannel: o.payChannel,
  payTime: o.payTime,
  payTradeNo: o.payTradeNo,
  payBatch: o.payBatch,
  expireTime: o.expireTime,
  privilegeSnapshot: o.privilegeSnapshot,
  durationDays: o.durationDays,
  isVerified: o.isVerified,
  verifyTime: o.verifyTime,
  verifyBatch: o.verifyBatch,
  isAbnormal: o.isAbnormal,
  abnormalReason: o.abnormalReason,
  abnormalResolved: o.abnormalResolved,
  operationBatch: o.operationBatch,
  remark: o.remark,
  createdBy: o.createdBy,
  updatedBy: o.updatedBy,
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
});

class MemberOrderService {
  async getOrderList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query) || [['createdAt', 'DESC']];
    const search = parseSearch(query, ['orderNo', 'uid']);

    const where = { ...search };

    if (query.orderStatus !== undefined && query.orderStatus !== null && query.orderStatus !== '') {
      where.orderStatus = Number(query.orderStatus);
    }
    if (query.packageType) where.packageType = query.packageType;
    if (query.payChannel) where.payChannel = query.payChannel;
    if (query.isAbnormal !== undefined && query.isAbnormal !== null && query.isAbnormal !== '') {
      where.isAbnormal = Number(query.isAbnormal);
    }
    if (query.isVerified !== undefined && query.isVerified !== null && query.isVerified !== '') {
      where.isVerified = Number(query.isVerified);
    }
    if (query.uid) where.uid = query.uid;
    if (query.startTime) {
      where.createdAt = { [Op.gte]: new Date(query.startTime) };
    }
    if (query.endTime) {
      where.createdAt = where.createdAt || {};
      where.createdAt[Op.lte] = new Date(query.endTime + ' 23:59:59');
    }

    const { count, rows } = await MemberOrder.findAndCountAll({
      where, offset, limit: pageSize, order,
    });

    return { list: rows.map(formatOrder), total: count, page, pageSize };
  }

  async getOrderDetail(id) {
    const order = await MemberOrder.findByPk(id, {
      include: [
        { model: MemberOrderLog, as: 'orderLogs', order: [['createdAt', 'DESC']], limit: 20 },
        { model: MemberOrderRefund, as: 'refunds', order: [['createdAt', 'DESC']], limit: 10 },
      ],
    });
    if (!order) throw new NotFoundError('订单不存在');
    const result = formatOrder(order);
    result.logs = (order.orderLogs || []).map(l => l.toJSON ? l.toJSON() : l);
    result.refunds = (order.refunds || []).map(r => r.toJSON ? r.toJSON() : r);
    return result;
  }

  async getOrderStats() {
    const totalCount = await MemberOrder.count();
    const byStatus = await MemberOrder.findAll({
      attributes: ['orderStatus', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['orderStatus'],
      raw: true,
    });
    const totalAmount = await MemberOrder.sum('payAmount', { where: { orderStatus: 1 } });
    const abnormalCount = await MemberOrder.count({ where: { isAbnormal: 1 } });
    const unverifiedCount = await MemberOrder.count({ where: { orderStatus: 1, isVerified: 0 } });
    const todayCount = await MemberOrder.count({
      where: { createdAt: { [Op.gte]: new Date(new Date().toDateString()) } },
    });
    const todayAmount = await MemberOrder.sum('payAmount', {
      where: { orderStatus: 1, payTime: { [Op.gte]: new Date(new Date().toDateString()) } },
    });
    const refundCount = await MemberOrderRefund.count({ where: { refundStatus: 1 } });
    const refundAmount = await MemberOrderRefund.sum('refundAmount', { where: { refundStatus: 1 } });

    return {
      totalCount,
      totalAmount: totalAmount || 0,
      abnormalCount,
      unverifiedCount,
      todayCount,
      todayAmount: todayAmount || 0,
      refundCount,
      refundAmount: refundAmount || 0,
      byStatus: byStatus.map(b => ({ status: Number(b.orderStatus), count: Number(b.count) })),
    };
  }

  async verifyOrder(id, operator) {
    const order = await MemberOrder.findByPk(id);
    if (!order) throw new NotFoundError('订单不存在');
    if (order.orderStatus !== 1) throw new BadRequestError('仅支付成功的订单可核验');
    if (order.isVerified === 1) throw new ConflictError('订单已核验，请勿重复核验');

    const verifyBatch = generateBatchNo();
    const beforeSnapshot = formatOrder(order);

    const transaction = await sequelize.transaction({ isolationLevel: 'READ COMMITTED' });
    try {
      await order.update({
        isVerified: 1,
        verifyTime: new Date(),
        verifyBatch,
        updatedBy: operator.userId,
        operationBatch: verifyBatch,
      }, { transaction });

      await MemberOrderLog.create({
        orderId: order.id,
        orderNo: order.orderNo,
        logType: 'VERIFY',
        logTypeLabel: LOG_TYPE_MAP.VERIFY,
        operationBatch: verifyBatch,
        beforeSnapshot,
        afterSnapshot: formatOrder(order),
        changedFields: ['isVerified', 'verifyTime', 'verifyBatch'],
        operatorId: operator.userId,
        operatorName: operator.userName,
      }, { transaction });

      await transaction.commit();
      return formatOrder(order);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async cancelOrder(id, operator) {
    const order = await MemberOrder.findByPk(id);
    if (!order) throw new NotFoundError('订单不存在');
    if (order.orderStatus !== 0) throw new BadRequestError('仅待支付订单可取消');

    const operationBatch = generateBatchNo();
    const beforeSnapshot = formatOrder(order);

    const transaction = await sequelize.transaction({ isolationLevel: 'READ COMMITTED' });
    try {
      await order.update({
        orderStatus: 3,
        operationBatch,
        updatedBy: operator.userId,
      }, { transaction });

      await MemberOrderLog.create({
        orderId: order.id,
        orderNo: order.orderNo,
        logType: 'CANCEL',
        logTypeLabel: LOG_TYPE_MAP.CANCEL,
        operationBatch,
        beforeSnapshot,
        afterSnapshot: formatOrder(order),
        changedFields: ['orderStatus'],
        operatorId: operator.userId,
        operatorName: operator.userName,
        operatorRemark: '手动取消待支付订单',
      }, { transaction });

      await transaction.commit();
      return formatOrder(order);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async refundOrder(id, data, operator) {
    const order = await MemberOrder.findByPk(id);
    if (!order) throw new NotFoundError('订单不存在');
    if (order.orderStatus !== 1) throw new BadRequestError('仅支付成功的订单可退款');

    const existingRefund = await MemberOrderRefund.findOne({
      where: { orderId: order.id, refundStatus: { [Op.in]: [0, 1] } },
    });
    if (existingRefund) throw new ConflictError('该订单已存在进行中或已完成的退款，请勿重复退款');

    const refundNo = generateRefundNo();
    const operationBatch = generateBatchNo();
    const beforeSnapshot = formatOrder(order);

    const transaction = await sequelize.transaction({ isolationLevel: 'READ COMMITTED' });
    try {
      await MemberOrderRefund.create({
        orderId: order.id,
        orderNo: order.orderNo,
        refundNo,
        refundAmount: data.refundAmount || order.payAmount,
        refundReason: data.refundReason,
        refundChannel: order.payChannel,
        refundStatus: 1,
        privilegeRevoked: 1,
        operatorId: operator.userId,
        operatorName: operator.userName,
      }, { transaction });

      await order.update({
        orderStatus: 4,
        operationBatch,
        updatedBy: operator.userId,
      }, { transaction });

      await MemberOrderLog.create({
        orderId: order.id,
        orderNo: order.orderNo,
        logType: 'REFUND',
        logTypeLabel: LOG_TYPE_MAP.REFUND,
        operationBatch,
        beforeSnapshot,
        afterSnapshot: formatOrder(order),
        changedFields: ['orderStatus'],
        operatorId: operator.userId,
        operatorName: operator.userName,
        operatorRemark: `退款原因: ${data.refundReason}`,
      }, { transaction });

      await transaction.commit();
      return formatOrder(order);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async appealOrder(id, data, operator) {
    const order = await MemberOrder.findByPk(id);
    if (!order) throw new NotFoundError('订单不存在');
    if (order.isAbnormal === 1 && order.abnormalResolved === 0) throw new ConflictError('订单已有未处理的异常申诉');

    const operationBatch = generateBatchNo();
    const beforeSnapshot = formatOrder(order);

    const transaction = await sequelize.transaction({ isolationLevel: 'READ COMMITTED' });
    try {
      await order.update({
        isAbnormal: 1,
        abnormalReason: data.appealReason,
        abnormalResolved: 0,
        operationBatch,
        updatedBy: operator.userId,
      }, { transaction });

      await MemberOrderLog.create({
        orderId: order.id,
        orderNo: order.orderNo,
        logType: 'APPEAL',
        logTypeLabel: LOG_TYPE_MAP.APPEAL,
        operationBatch,
        beforeSnapshot,
        afterSnapshot: formatOrder(order),
        changedFields: ['isAbnormal', 'abnormalReason'],
        operatorId: operator.userId,
        operatorName: operator.userName,
        operatorRemark: data.appealReason,
      }, { transaction });

      await transaction.commit();
      return formatOrder(order);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async resolveAbnormal(id, data, operator) {
    const order = await MemberOrder.findByPk(id);
    if (!order) throw new NotFoundError('订单不存在');
    if (order.isAbnormal !== 1) throw new BadRequestError('订单非异常状态');
    if (order.abnormalResolved === 1) throw new ConflictError('异常已处理');

    const operationBatch = generateBatchNo();
    await order.update({
      abnormalResolved: 1,
      operationBatch,
      updatedBy: operator.userId,
    });

    await MemberOrderLog.create({
      orderId: order.id,
      orderNo: order.orderNo,
      logType: 'APPEAL',
      logTypeLabel: '异常处理完成',
      operationBatch,
      changedFields: ['abnormalResolved'],
      operatorId: operator.userId,
      operatorName: operator.userName,
      operatorRemark: data.resolveRemark || '异常已人工复核处理',
    });

    return formatOrder(order);
  }

  async batchAction(action, ids, operator, options = {}) {
    if (!ids || ids.length === 0) throw new BadRequestError('请选择订单');

    const orders = await MemberOrder.findAll({ where: { id: { [Op.in]: ids } } });
    if (orders.length === 0) throw new NotFoundError('未找到指定订单');

    const operationBatch = generateBatchNo();
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    const successIds = [];
    const failItems = [];
    const skippedItems = [];

    const transaction = await sequelize.transaction({ isolationLevel: 'READ COMMITTED' });
    try {
      for (const o of orders) {
        try {
          if (action === 'batch_close') {
            if (o.orderStatus !== 0) { skippedCount++; skippedItems.push({ id: o.id, reason: '仅待支付可关闭' }); continue; }
            await o.update({ orderStatus: 3, operationBatch, updatedBy: operator.userId }, { transaction });
            await MemberOrderLog.create({
              orderId: o.id, orderNo: o.orderNo, logType: 'BATCH_CLOSE', logTypeLabel: LOG_TYPE_MAP.BATCH_CLOSE,
              operationBatch, changedFields: ['orderStatus'], operatorId: operator.userId, operatorName: operator.userName,
            }, { transaction });
          } else if (action === 'batch_verify') {
            if (o.orderStatus !== 1) { skippedCount++; skippedItems.push({ id: o.id, reason: '仅支付成功可核验' }); continue; }
            if (o.isVerified === 1) { skippedCount++; skippedItems.push({ id: o.id, reason: '已核验' }); continue; }
            if (o.isAbnormal === 1 && o.abnormalResolved === 0) { skippedCount++; skippedItems.push({ id: o.id, reason: '异常订单需人工复核' }); continue; }
            await o.update({ isVerified: 1, verifyTime: new Date(), verifyBatch: operationBatch, operationBatch, updatedBy: operator.userId }, { transaction });
            await MemberOrderLog.create({
              orderId: o.id, orderNo: o.orderNo, logType: 'BATCH_VERIFY', logTypeLabel: LOG_TYPE_MAP.BATCH_VERIFY,
              operationBatch, changedFields: ['isVerified', 'verifyTime'], operatorId: operator.userId, operatorName: operator.userName,
            }, { transaction });
          }
          successCount++;
          successIds.push(o.id);
        } catch (e) {
          failCount++;
          failItems.push({ id: o.id, reason: e.message });
        }
      }

      await transaction.commit();
      return { successCount, failCount, skippedCount, successIds, failItems, skippedItems, operationBatch };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getOrderLogs(orderId, query) {
    const order = await MemberOrder.findByPk(orderId);
    if (!order) throw new NotFoundError('订单不存在');

    const { page, pageSize, offset } = parsePagination(query);
    const where = { orderId };
    if (query.logType) where.logType = query.logType;

    const { count, rows } = await MemberOrderLog.findAndCountAll({
      where, offset, limit: pageSize, order: [['createdAt', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async getTraceInfo(traceType, traceValue) {
    if (traceType === 'orderNo') {
      const order = await MemberOrder.findOne({
        where: { orderNo: traceValue },
        include: [
          { model: MemberOrderLog, as: 'orderLogs', order: [['createdAt', 'DESC']], limit: 50 },
          { model: MemberOrderRefund, as: 'refunds', order: [['createdAt', 'DESC']], limit: 20 },
        ],
      });
      if (!order) return { found: false, traceType, traceValue };

      return {
        found: true,
        traceType,
        traceValue,
        order: formatOrder(order),
        logs: order.orderLogs || [],
        refunds: order.refunds || [],
        summary: {
          totalLogs: (order.orderLogs || []).length,
          totalRefunds: (order.refunds || []).length,
          hasAbnormal: order.isAbnormal === 1,
        },
      };
    }

    if (traceType === 'uid') {
      const orders = await MemberOrder.findAll({
        where: { uid: traceValue },
        order: [['createdAt', 'DESC']],
        limit: 50,
      });
      const orderIds = orders.map(o => o.id);
      const refunds = orderIds.length > 0
        ? await MemberOrderRefund.findAll({ where: { orderId: { [Op.in]: orderIds } }, order: [['createdAt', 'DESC']], limit: 50 })
        : [];

      return {
        found: orders.length > 0,
        traceType,
        traceValue,
        orders: orders.map(formatOrder),
        refunds,
        summary: {
          totalOrders: orders.length,
          totalAmount: orders.filter(o => o.orderStatus === 1).reduce((sum, o) => sum + Number(o.payAmount), 0),
          totalRefunds: refunds.length,
        },
      };
    }

    if (traceType === 'payBatch') {
      const orders = await MemberOrder.findAll({
        where: { payBatch: traceValue },
        order: [['createdAt', 'DESC']],
        limit: 100,
      });
      const orderIds = orders.map(o => o.id);
      const logs = orderIds.length > 0
        ? await MemberOrderLog.findAll({ where: { orderId: { [Op.in]: orderIds } }, order: [['createdAt', 'DESC']], limit: 100 })
        : [];

      return {
        found: orders.length > 0,
        traceType,
        traceValue,
        orders: orders.map(formatOrder),
        logs,
        summary: {
          totalOrders: orders.length,
          totalAmount: orders.filter(o => o.orderStatus === 1).reduce((sum, o) => sum + Number(o.payAmount), 0),
          totalLogs: logs.length,
        },
      };
    }

    throw new BadRequestError('不支持的溯源类型');
  }

  async checkConsistency(id) {
    const order = await MemberOrder.findByPk(id);
    if (!order) throw new NotFoundError('订单不存在');

    const issues = [];

    if (order.orderStatus === 1) {
      if (!order.payTime) issues.push({ type: 'missing_pay_time', level: 'high', message: '支付成功但缺少支付时间' });
      if (!order.payChannel) issues.push({ type: 'missing_pay_channel', level: 'medium', message: '支付成功但缺少支付渠道' });
      if (!order.payTradeNo) issues.push({ type: 'missing_trade_no', level: 'high', message: '支付成功但缺少第三方流水号' });

      if (order.payAmount && order.originalAmount) {
        if (Number(order.payAmount) > Number(order.originalAmount)) {
          issues.push({ type: 'amount_mismatch', level: 'high', message: `实付金额(${order.payAmount})大于原始金额(${order.originalAmount})` });
        }
      }

      if (order.discountAmount && Number(order.discountAmount) > 0) {
        const expected = Number(order.originalAmount) - Number(order.discountAmount);
        if (Math.abs(Number(order.payAmount) - expected) > 0.01) {
          issues.push({ type: 'discount_mismatch', level: 'medium', message: `优惠计算不一致: 原价${order.originalAmount} - 优惠${order.discountAmount} ≠ 实付${order.payAmount}` });
        }
      }
    }

    if (order.orderStatus === 4) {
      const refund = await MemberOrderRefund.findOne({ where: { orderId: order.id, refundStatus: 1 } });
      if (!refund) {
        issues.push({ type: 'missing_refund_record', level: 'high', message: '退款订单缺少退款记录' });
      } else if (refund.privilegeRevoked !== 1) {
        issues.push({ type: 'privilege_not_revoked', level: 'high', message: '退款订单权益未收回' });
      }
    }

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      isConsistent: issues.length === 0,
      issues,
    };
  }
}

module.exports = new MemberOrderService();
