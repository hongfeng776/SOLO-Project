const { sequelize } = require('../config/db');
const { Op, QueryTypes } = require('sequelize');
const Order = require('../models/Order');
const Merchant = require('../models/Merchant');
const Flight = require('../models/Flight');
const Hotel = require('../models/Hotel');
const Car = require('../models/Car');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const memoryCache = require('../utils/cache');

const CATEGORY_MAP = {
  flight: '机票',
  hotel: '酒店',
  car: '租车',
  ticket: '票务'
};

class StatisticsService {
  async getOverviewStats() {
    const cacheKey = 'stats:overview';
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, todaySales, totalUsers, totalProducts, recentOrders] = await Promise.all([
      Order.count({ where: { createTime: { [Op.gte]: today } } }),
      Order.sum('amount', { where: { status: { [Op.in]: [1, 3] }, createTime: { [Op.gte]: today } } }) || 0,
      User.count(),
      Flight.count({ where: { status: 1 } }) + Hotel.count({ where: { status: 1 } }) +
        Car.count({ where: { status: 1 } }) + Ticket.count({ where: { status: 1 } }),
      Order.findAll({
        where: { createTime: { [Op.gte]: today } },
        order: [['id', 'DESC']],
        limit: 5,
        raw: true
      })
    ]);

    const trendData = await this._getRecentTrend(7);

    const result = {
      todayOrders,
      todaySales: parseFloat(todaySales).toFixed(2),
      totalUsers,
      totalProducts,
      trendData,
      recentOrders
    };

    memoryCache.set(cacheKey, result, 60 * 1000);
    return result;
  }

  async getOrderStats(params = {}) {
    const { period = 'day', startTime, endTime } = params;
    const where = {};
    if (startTime && endTime) {
      where.createTime = { [Op.between]: [new Date(startTime), new Date(endTime)] };
    }

    const dateFormat = this._getDateFormat(period);

    const [categoryStats, statusStats, timeStats] = await Promise.all([
      this._getCategoryStats(where),
      this._getStatusStats(where),
      this._getTimeStats(where, dateFormat, 'createTime')
    ]);

    const totalOrders = await Order.count({ where });
    const totalSales = await Order.sum('amount', { where: { ...where, status: { [Op.in]: [1, 3] } } }) || 0;

    return {
      totalOrders,
      totalSales: parseFloat(totalSales).toFixed(2),
      categoryStats,
      statusStats,
      timeStats,
      period
    };
  }

  async getMerchantStats(params = {}) {
    const { startTime, endTime } = params;
    const where = {};
    if (startTime && endTime) {
      where.createTime = { [Op.between]: [new Date(startTime), new Date(endTime)] };
    }

    const [orderRanking, salesRanking, auditStats] = await Promise.all([
      this._getMerchantOrderRanking(where),
      this._getMerchantSalesRanking(where),
      this._getMerchantAuditStats()
    ]);

    return {
      orderRanking,
      salesRanking,
      auditStats
    };
  }

  async getInventoryStats() {
    const cacheKey = 'stats:inventory';
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    const [flights, hotels, cars, tickets] = await Promise.all([
      Flight.findAll({ where: { status: 1 }, raw: true }),
      Hotel.findAll({ where: { status: 1 }, raw: true }),
      Car.findAll({ where: { status: 1 }, raw: true }),
      Ticket.findAll({ where: { status: 1 }, raw: true })
    ]);

    const inventory = [
      {
        category: 'flight',
        categoryName: CATEGORY_MAP.flight,
        total: flights.length,
        totalStock: flights.reduce((sum, f) => sum + (f.seats || 0), 0),
        lowStockItems: flights.filter(f => f.seats < 10).map(f => ({
          id: f.id,
          name: f.flightNo,
          stock: f.seats
        }))
      },
      {
        category: 'hotel',
        categoryName: CATEGORY_MAP.hotel,
        total: hotels.length,
        totalStock: hotels.reduce((sum, h) => sum + (h.rooms || 0), 0),
        lowStockItems: hotels.filter(h => h.rooms < 10).map(h => ({
          id: h.id,
          name: h.name,
          stock: h.rooms
        }))
      },
      {
        category: 'car',
        categoryName: CATEGORY_MAP.car,
        total: cars.length,
        totalStock: cars.length,
        lowStockItems: cars.filter(c => c.status === 0).map(c => ({
          id: c.id,
          name: `${c.brand} ${c.model}`,
          stock: 0
        }))
      },
      {
        category: 'ticket',
        categoryName: CATEGORY_MAP.ticket,
        total: tickets.length,
        totalStock: tickets.reduce((sum, t) => sum + (t.stock || 0), 0),
        lowStockItems: tickets.filter(t => t.stock < 10).map(t => ({
          id: t.id,
          name: t.name,
          stock: t.stock
        }))
      }
    ];

    const result = { inventory };
    memoryCache.set(cacheKey, result, 2 * 60 * 1000);
    return result;
  }

  async getCouponStats() {
    const orderStats = await Order.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where: { status: { [Op.in]: [1, 3] } },
      group: ['category'],
      raw: true
    });

    const categoryCouponStats = orderStats.map(item => ({
      category: item.category,
      categoryName: CATEGORY_MAP[item.category] || item.category,
      orderCount: parseInt(item.orderCount) || 0,
      totalAmount: parseFloat(item.totalAmount) || 0
    }));

    return {
      totalIssued: 0,
      totalUsed: 0,
      totalExpired: 0,
      usageRate: '0.00',
      categoryCouponStats
    };
  }

  async getCategoryRanking(params = {}) {
    const { category = 'flight', limit = 10 } = params;

    let ranking = [];
    switch (category) {
      case 'flight':
        ranking = await this._getFlightRanking(limit);
        break;
      case 'hotel':
        ranking = await this._getHotelRanking(limit);
        break;
      case 'car':
        ranking = await this._getCarRanking(limit);
        break;
      case 'ticket':
        ranking = await this._getTicketRanking(limit);
        break;
    }

    return { category, ranking };
  }

  async getSalesTrend(params = {}) {
    const { period = 'day', startTime, endTime } = params;
    const where = {};
    if (startTime && endTime) {
      where.createTime = { [Op.between]: [new Date(startTime), new Date(endTime)] };
    }

    const dateFormat = this._getDateFormat(period);
    const trendData = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createTime'), dateFormat), 'dateLabel'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'salesAmount']
      ],
      where,
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createTime'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createTime'), dateFormat), 'ASC']],
      raw: true
    });

    return {
      period,
      labels: trendData.map(item => item.dateLabel),
      orderCounts: trendData.map(item => parseInt(item.orderCount) || 0),
      salesAmounts: trendData.map(item => parseFloat(item.salesAmount) || 0)
    };
  }

  async _getRecentTrend(days) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [orderCount, salesAmount] = await Promise.all([
        Order.count({ where: { createTime: { [Op.gte]: date, [Op.lt]: nextDate } } }),
        Order.sum('amount', {
          where: {
            status: { [Op.in]: [1, 3] },
            createTime: { [Op.gte]: date, [Op.lt]: nextDate }
          }
        }) || 0
      ]);

      result.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        orderCount,
        salesAmount: parseFloat(salesAmount).toFixed(2)
      });
    }
    return result;
  }

  async _getCategoryStats(where) {
    const stats = await Order.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where,
      group: ['category'],
      raw: true
    });

    const total = stats.reduce((sum, s) => sum + parseInt(s.orderCount), 0);
    return stats.map(s => ({
      category: s.category,
      categoryName: CATEGORY_MAP[s.category] || s.category,
      orderCount: parseInt(s.orderCount) || 0,
      totalAmount: parseFloat(s.totalAmount) || 0,
      percentage: total > 0 ? ((parseInt(s.orderCount) / total) * 100).toFixed(2) : '0.00'
    }));
  }

  async _getStatusStats(where) {
    const statusMap = { 0: '待支付', 1: '已支付', 2: '已取消', 3: '已完成' };
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
      statusName: statusMap[s.status] || '未知',
      count: parseInt(s.count) || 0
    }));
  }

  async _getTimeStats(where, dateFormat, dateField) {
    return Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col(dateField), dateFormat), 'dateLabel'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where,
      group: [sequelize.fn('DATE_FORMAT', sequelize.col(dateField), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col(dateField), dateFormat), 'ASC']],
      raw: true
    }).then(rows => rows.map(r => ({
      dateLabel: r.dateLabel,
      orderCount: parseInt(r.orderCount) || 0,
      totalAmount: parseFloat(r.totalAmount) || 0
    })));
  }

  async _getMerchantOrderRanking(where) {
    return Order.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      where,
      group: ['category'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    }).then(rows => rows.map(r => ({
      category: r.category,
      categoryName: CATEGORY_MAP[r.category] || r.category,
      orderCount: parseInt(r.orderCount) || 0
    })));
  }

  async _getMerchantSalesRanking(where) {
    return Order.findAll({
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where: { ...where, status: { [Op.in]: [1, 3] } },
      group: ['category'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']],
      limit: 10,
      raw: true
    }).then(rows => rows.map(r => ({
      category: r.category,
      categoryName: CATEGORY_MAP[r.category] || r.category,
      totalAmount: parseFloat(r.totalAmount) || 0
    })));
  }

  async _getMerchantAuditStats() {
    const [pending, approved, rejected] = await Promise.all([
      Merchant.count({ where: { auditStatus: 0 } }),
      Merchant.count({ where: { auditStatus: 1 } }),
      Merchant.count({ where: { auditStatus: 2 } })
    ]);

    const total = pending + approved + rejected;
    return {
      pending,
      approved,
      rejected,
      approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : '0.00'
    };
  }

  async _getFlightRanking(limit) {
    return Order.findAll({
      attributes: [
        'productId',
        'productName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where: { category: 'flight' },
      group: ['productId', 'productName'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit,
      raw: true
    }).then(rows => rows.map(r => ({
      id: r.productId,
      name: r.productName,
      orderCount: parseInt(r.orderCount) || 0,
      totalAmount: parseFloat(r.totalAmount) || 0
    })));
  }

  async _getHotelRanking(limit) {
    return Order.findAll({
      attributes: [
        'productId',
        'productName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where: { category: 'hotel' },
      group: ['productId', 'productName'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit,
      raw: true
    }).then(rows => rows.map(r => ({
      id: r.productId,
      name: r.productName,
      orderCount: parseInt(r.orderCount) || 0,
      totalAmount: parseFloat(r.totalAmount) || 0
    })));
  }

  async _getCarRanking(limit) {
    return Order.findAll({
      attributes: [
        'productId',
        'productName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where: { category: 'car' },
      group: ['productId', 'productName'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit,
      raw: true
    }).then(rows => rows.map(r => ({
      id: r.productId,
      name: r.productName,
      orderCount: parseInt(r.orderCount) || 0,
      totalAmount: parseFloat(r.totalAmount) || 0
    })));
  }

  async _getTicketRanking(limit) {
    return Order.findAll({
      attributes: [
        'productId',
        'productName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where: { category: 'ticket' },
      group: ['productId', 'productName'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit,
      raw: true
    }).then(rows => rows.map(r => ({
      id: r.productId,
      name: r.productName,
      orderCount: parseInt(r.orderCount) || 0,
      totalAmount: parseFloat(r.totalAmount) || 0
    })));
  }

  _getDateFormat(period) {
    switch (period) {
      case 'day': return '%Y-%m-%d';
      case 'week': return '%Y-%u';
      case 'month': return '%Y-%m';
      case 'year': return '%Y';
      default: return '%Y-%m-%d';
    }
  }
}

module.exports = new StatisticsService();
