const { success, pagination } = require('../utils/result');
const orderStatisticsService = require('../services/OrderStatisticsService');

class OrderStatisticsController {
  async getOrderStatistics(req, res, next) {
    try {
      const result = await orderStatisticsService.getOrderStatistics(req.query, req.user);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async filterOrders(req, res, next) {
    try {
      const { pageNum, pageSize } = req.pagination;
      const params = { ...req.query, pageNum, pageSize };
      const result = await orderStatisticsService.filterOrders(params, req.user);
      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async exportOrders(req, res, next) {
    try {
      const result = await orderStatisticsService.exportOrders(req.body, req.user);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderStatisticsController();
