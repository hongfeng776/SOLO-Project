const { sequelize } = require('../config/db');
const { Op, QueryTypes } = require('sequelize');
const Order = require('../models/Order');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const memoryCache = require('../utils/cache');
const { ValidationError } = require('../utils/error');

const CATEGORY_MAP = {
  flight: '机票',
  hotel: '酒店',
  car: '租车',
  ticket: '票务',
  business_travel: '商旅定制'
};

const STATUS_MAP = {
  0: '待支付',
  1: '已支付',
  2: '已取消',
  3: '已完成',
  4: '已履约',
  5: '退款中',
  6: '已退款'
};

const PAYMENT_CHANNEL_MAP = {
  wechat: '微信支付',
  alipay: '支付宝',
  unionpay: '银联支付',
  credit_card: '信用卡',
  balance: '余额支付'
};

const VALID_PERIODS = ['day', 'week', 'month', 'custom'];
const MAX_DATE_RANGE_DAYS = 365;
const EXPORT_MAX_LIMIT = 10000;

class OrderStatisticsService {
  async getOrderStatistics(params, operator) {
    const { period = 'day', startTime, endTime, category } = params;

    const operatorId = operator && operator.id ? operator.id : 0;
    const cacheKey = 'stats:order:' + period + ':' + (startTime || '') + ':' + (endTime || '') + ':' + (category || '') + ':' + operatorId;
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    const resolved = this._resolveTimeRange(period, startTime, endTime);
    const where = this._buildPermissionWhere(operator, category, resolved.startTime, resolved.endTime);

    const dateFormat = this._getDateFormat(period);

    const salesWhere = Object.assign({}, where, { status: { [Op.in]: [1, 3, 4] } });
    const refundWhere = Object.assign({}, where, { status: { [Op.in]: [5, 6] } });
    const fulfillWhere = Object.assign({}, where, { status: { [Op.in]: [3, 4] } });

    const totalOrdersPromise = Order.count({ where: where });
    const totalSalesPromise = Order.sum('paidAmount', { where: salesWhere });
    const refundedOrdersPromise = Order.count({ where: refundWhere });
    const fulfilledOrdersPromise = Order.count({ where: fulfillWhere });
    const categoryStatsPromise = this._getCategoryStats(where);
    const paymentStatsPromise = this._getPaymentStats(where);
    const statusStatsPromise = this._getStatusStats(where);
    const timeStatsPromise = this._getTimeStats(where, dateFormat);

    const results = await Promise.all([
      totalOrdersPromise,
      totalSalesPromise,
      refundedOrdersPromise,
      fulfilledOrdersPromise,
      categoryStatsPromise,
      paymentStatsPromise,
      statusStatsPromise,
      timeStatsPromise
    ]);

    const totalOrders = results[0];
    const totalSales = results[1] || 0;
    const refundedOrders = results[2];
    const fulfilledOrders = results[3];
    const categoryStats = results[4];
    const paymentStats = results[5];
    const statusStats = results[6];
    const timeStats = results[7];

    const result = {
      totalOrders: totalOrders,
      totalSales: parseFloat(totalSales).toFixed(2),
      refundedOrders: refundedOrders,
      refundRate: totalOrders > 0 ? ((refundedOrders / totalOrders) * 100).toFixed(2) : '0.00',
      fulfilledOrders: fulfilledOrders,
      fulfillRate: totalOrders > 0 ? ((fulfilledOrders / totalOrders) * 100).toFixed(2) : '0.00',
      avgOrderAmount: totalOrders > 0 ? parseFloat((parseFloat(totalSales) / totalOrders).toFixed(2)) : '0.00',
      categoryStats: categoryStats,
      paymentStats: paymentStats,
      statusStats: statusStats,
      timeStats: timeStats,
      period: period,
      startTime: resolved.startTime,
      endTime: resolved.endTime
    };

    memoryCache.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  async filterOrders(params, operator) {
    const {
      pageNum = 1,
      pageSize = 10,
      status,
      userLevel,
      merchantType,
      paymentChannel,
      category,
      amountRange,
      dateRange
    } = params;

    const where = {};

    if (operator.roleCode === 'admin') {
      if (status !== undefined && status !== null && status !== '') {
        where.status = status;
      }
      if (userLevel !== undefined && userLevel !== null && userLevel !== '') {
        where['$user.level$'] = userLevel;
      }
      if (merchantType !== undefined && merchantType !== null && merchantType !== '') {
        where['$merchant.businessType$'] = merchantType;
      }
    } else {
      where['$merchant.userId$'] = operator.id;
    }

    if (paymentChannel !== undefined && paymentChannel !== null && paymentChannel !== '') {
      where.paymentChannel = paymentChannel;
    }
    if (category !== undefined && category !== null && category !== '') {
      where.category = category;
    }

    if (amountRange && (amountRange.min !== undefined || amountRange.max !== undefined)) {
      where.amount = {};
      if (amountRange.min !== undefined && amountRange.min !== null) {
        where.amount[Op.gte] = parseFloat(amountRange.min);
      }
      if (amountRange.max !== undefined && amountRange.max !== null) {
        where.amount[Op.lte] = parseFloat(amountRange.max);
      }
    }

    if (dateRange && (dateRange.startTime || dateRange.endTime)) {
      where.createTime = {};
      if (dateRange.startTime) {
        where.createTime[Op.gte] = new Date(dateRange.startTime);
      }
      if (dateRange.endTime) {
        where.createTime[Op.lte] = new Date(dateRange.endTime);
      }
    }

    const include = [];
    if (operator.roleCode !== 'admin') {
      include.push({
        model: Merchant,
        as: 'merchant',
        attributes: [],
        where: { userId: operator.id },
        required: true
      });
    } else {
      include.push(
        { model: User, as: 'user', attributes: ['id', 'nickname', 'level'] },
        { model: Merchant, as: 'merchant', attributes: ['id', 'name', 'businessType'] }
      );
    }

    const offset = (pageNum - 1) * pageSize;
    const limit = Math.min(pageSize, 200);

    const { count, rows } = await Order.findAndCountAll({
      where,
      include,
      offset,
      limit,
      order: [['id', 'DESC']],
      distinct: true
    });

    return {
      list: rows,
      total: count,
      pageNum: parseInt(pageNum),
      pageSize: parseInt(pageSize)
    };
  }

  async exportOrders(params, operator) {
    const filterParams = { ...params, pageNum: 1, pageSize: EXPORT_MAX_LIMIT + 1 };
    const filterResult = await this.filterOrders(filterParams, operator);
    const { list, total } = filterResult;

    if (total === 0) {
      throw new ValidationError('筛选结果为空，无法导出');
    }

    if (total > EXPORT_MAX_LIMIT) {
      throw new ValidationError('导出数据量超过最大限制(10000)，请缩小筛选范围');
    }

    const validRecords = [];
    let abnormalCount = 0;

    for (const order of list) {
      const hasMissing = !order.orderNo || !order.amount || order.status === undefined || !order.createTime || !order.userId;
      if (hasMissing) {
        abnormalCount++;
        continue;
      }
      validRecords.push(order);
    }

    const period = params.period || 'custom';
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `订单数据_${period}_${timestamp}.csv`;

    const headers = ['订单号', '商品名称', '品类', '订单金额', '实付金额', '订单状态', '支付渠道', '支付时间', '用户名称', '商家名称', '创建时间', '退款金额', '退款时间'];

    const rows = validRecords.map(order => {
      const orderData = order.toJSON ? order.toJSON() : order;
      return [
        this._escapeCsv(orderData.orderNo || ''),
        this._escapeCsv(orderData.productName || ''),
        this._escapeCsv(CATEGORY_MAP[orderData.category] || orderData.category || ''),
        this._escapeCsv(parseFloat(orderData.amount || 0).toFixed(2)),
        this._escapeCsv(parseFloat(orderData.paidAmount || 0).toFixed(2)),
        this._escapeCsv(STATUS_MAP[orderData.status] || ''),
        this._escapeCsv(PAYMENT_CHANNEL_MAP[orderData.paymentChannel] || orderData.paymentChannel || ''),
        this._escapeCsv(orderData.payTime ? this._formatDate(orderData.payTime) : ''),
        this._escapeCsv(orderData.user?.nickname || orderData.userName || ''),
        this._escapeCsv(orderData.merchant?.name || orderData.merchantName || ''),
        this._escapeCsv(orderData.createTime ? this._formatDate(orderData.createTime) : ''),
        this._escapeCsv(parseFloat(orderData.refundAmount || 0).toFixed(2)),
        this._escapeCsv(orderData.refundTime ? this._formatDate(orderData.refundTime) : '')
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    return {
      filename,
      csvContent,
      total,
      abnormalCount,
      exportedCount: validRecords.length
    };
  }

  _resolveTimeRange(period, startTime, endTime) {
    const now = new Date();

    switch (period) {
      case 'day': {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { startTime: start.toISOString(), endTime: end.toISOString() };
      }
      case 'week': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { startTime: start.toISOString(), endTime: end.toISOString() };
      }
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { startTime: start.toISOString(), endTime: end.toISOString() };
      }
      case 'custom':
      default:
        return { startTime, endTime };
    }
  }

  _buildPermissionWhere(operator, category, startTime, endTime) {
    const where = {};

    if (startTime && endTime) {
      where.createTime = { [Op.between]: [new Date(startTime), new Date(endTime)] };
    } else if (startTime) {
      where.createTime = { [Op.gte]: new Date(startTime) };
    } else if (endTime) {
      where.createTime = { [Op.lte]: new Date(endTime) };
    }

    if (category) {
      where.category = category;
    }

    if (operator?.roleCode !== 'admin') {
      where['$merchant.userId$'] = operator.id;
    }

    return where;
  }

  async _getCategoryStats(where) {
    const stats = await Order.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('Order.paidAmount')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN Order.status IN (5, 6) THEN 1 ELSE 0 END')), 'refundCount'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN Order.status IN (3, 4) THEN 1 ELSE 0 END')), 'fulfillCount']
      ],
      where: where,
      group: ['Order.category'],
      raw: true
    });

    return stats.map(s => {
      const orderCount = parseInt(s.orderCount) || 0;
      const totalAmount = parseFloat(s.totalAmount) || 0;
      const refundCount = parseInt(s.refundCount) || 0;
      const fulfillCount = parseInt(s.fulfillCount) || 0;
      return {
        category: s.category,
        categoryName: CATEGORY_MAP[s.category] || s.category,
        orderCount,
        totalAmount: totalAmount.toFixed(2),
        refundRate: orderCount > 0 ? ((refundCount / orderCount) * 100).toFixed(2) : '0.00',
        fulfillRate: orderCount > 0 ? ((fulfillCount / orderCount) * 100).toFixed(2) : '0.00'
      };
    });
  }

  async _getPaymentStats(where) {
    const stats = await Order.findAll({
      attributes: [
        'paymentChannel',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('paidAmount')), 'totalAmount']
      ],
      where: { ...where, paymentChannel: { [Op.ne]: null } },
      group: ['paymentChannel'],
      raw: true
    });

    return stats.map(s => ({
      paymentChannel: s.paymentChannel,
      paymentChannelName: PAYMENT_CHANNEL_MAP[s.paymentChannel] || s.paymentChannel,
      orderCount: parseInt(s.orderCount) || 0,
      totalAmount: (parseFloat(s.totalAmount) || 0).toFixed(2)
    }));
  }

  async _getStatusStats(where) {
    const stats = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['status'],
      raw: true
    });

    return stats.map(s => ({
      status: s.status,
      statusName: STATUS_MAP[s.status] || '未知',
      count: parseInt(s.count) || 0
    }));
  }

  async _getTimeStats(where, dateFormat) {
    return Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createTime'), dateFormat), 'dateLabel'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('paidAmount')), 'totalAmount']
      ],
      where,
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createTime'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createTime'), dateFormat), 'ASC']],
      raw: true
    }).then(rows => rows.map(r => ({
      dateLabel: r.dateLabel,
      orderCount: parseInt(r.orderCount) || 0,
      totalAmount: (parseFloat(r.totalAmount) || 0).toFixed(2)
    })));
  }

  _getDateFormat(period) {
    switch (period) {
      case 'day': return '%Y-%m-%d';
      case 'week': return '%Y-%u';
      case 'month': return '%Y-%m';
      default: return '%Y-%m-%d';
    }
  }

  _formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  _escapeCsv(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }
}

module.exports = new OrderStatisticsService();
