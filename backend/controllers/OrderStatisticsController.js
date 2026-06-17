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
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.setHeader('X-Total-Count', result.total);
      res.setHeader('X-Abnormal-Count', result.abnormalCount);
      res.setHeader('X-Exported-Count', result.exportedCount);
      res.send(result.csvContent);
    } catch (error) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      next(error);
    }
  }
}

module.exports = new OrderStatisticsController();
