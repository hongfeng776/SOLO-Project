const DashboardService = require('../services/DashboardService');
const { success } = require('../utils/response');

class DashboardController {
  getDashboardStats = [
    async (req, res, next) => {
      try {
        const result = await DashboardService.getDashboardStats();
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getPlayTrend = [
    async (req, res, next) => {
      try {
        const result = await DashboardService.getPlayTrend(req.query.days);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getAuditEfficiency = [
    async (req, res, next) => {
      try {
        const result = await DashboardService.getAuditEfficiency(req.query.days);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getRevenueOverview = [
    async (req, res, next) => {
      try {
        const result = await DashboardService.getRevenueOverview(req.query.days);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new DashboardController();
