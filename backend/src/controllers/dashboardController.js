const dashboardService = require('../services/dashboardService')
const ApiResponse = require('../utils/response')

class DashboardController {
  async getStatistics(req, res, next) {
    try {
      const data = await dashboardService.getStatistics()
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }

  async getResourceStats(req, res, next) {
    try {
      const { days = 7 } = req.query
      const data = await dashboardService.getResourceStats(parseInt(days))
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }

  async getStatusDistribution(req, res, next) {
    try {
      const data = await dashboardService.getStatusDistribution()
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }

  async getRecentResources(req, res, next) {
    try {
      const { limit = 10 } = req.query
      const data = await dashboardService.getRecentResources(parseInt(limit))
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }

  async getRecentAudits(req, res, next) {
    try {
      const { limit = 10 } = req.query
      const data = await dashboardService.getRecentAudits(parseInt(limit))
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new DashboardController()
