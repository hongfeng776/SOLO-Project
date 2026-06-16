const { success, pagination } = require('../utils/result');
const statisticsService = require('../services/StatisticsService');

class StatisticsController {
  async getOverview(req, res, next) {
    try {
      const result = await statisticsService.getOverviewStats();
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async getOrderAnalysis(req, res, next) {
    try {
      const result = await statisticsService.getOrderStats(req.query);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async getMerchantAnalysis(req, res, next) {
    try {
      const result = await statisticsService.getMerchantStats(req.query);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async getInventoryAnalysis(req, res, next) {
    try {
      const result = await statisticsService.getInventoryStats();
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async getCouponAnalysis(req, res, next) {
    try {
      const result = await statisticsService.getCouponStats();
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async getCategoryRanking(req, res, next) {
    try {
      const result = await statisticsService.getCategoryRanking(req.query);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async getSalesTrend(req, res, next) {
    try {
      const result = await statisticsService.getSalesTrend(req.query);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StatisticsController();
