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

  async getResourceHotRank(req, res, next) {
    try {
      const { limit = 10 } = req.query
      const data = await dashboardService.getResourceHotRank(parseInt(limit))
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }

  async getUserActivityStats(req, res, next) {
    try {
      const { days = 7 } = req.query
      const data = await dashboardService.getUserActivityStats(parseInt(days))
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }

  async getMemberStats(req, res, next) {
    try {
      const data = await dashboardService.getMemberStats()
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }

  async getCategoryStats(req, res, next) {
    try {
      const data = await dashboardService.getCategoryStats()
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }

  async getViolationOverview(req, res, next) {
    try {
      const data = await dashboardService.getViolationOverview()
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }

  async getOperationLogStats(req, res, next) {
    try {
      const { days = 7 } = req.query
      const data = await dashboardService.getOperationLogStats(parseInt(days))
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }

  async getConversionStats(req, res, next) {
    try {
      const { days = 7 } = req.query
      const data = await dashboardService.getConversionStats(parseInt(days))
      res.json(ApiResponse.success(data))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new DashboardController()
