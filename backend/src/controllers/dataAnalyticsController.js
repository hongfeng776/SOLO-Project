const dataAnalyticsService = require('../services/dataAnalyticsService')
const ApiResponse = require('../utils/response')
const ApiError = require('../utils/apiError')

class DataAnalyticsController {
  async preValidate(req, res, next) {
    try {
      const result = dataAnalyticsService.preValidateQuery(req.body)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getDataList(req, res, next) {
    try {
      const result = await dataAnalyticsService.getDataList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getOverview(req, res, next) {
    try {
      const result = await dataAnalyticsService.getDataOverview()
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getResourceDetail(req, res, next) {
    try {
      const { id } = req.params
      const result = await dataAnalyticsService.getResourceDataDetail(parseInt(id))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async batchSummary(req, res, next) {
    try {
      const { ids } = req.body
      if (!ids || !ids.length) {
        throw new ApiError('请选择需要汇总的作品', 400)
      }
      const result = await dataAnalyticsService.batchSummary(ids, {
        operatorId: req.user?.id,
        operatorName: req.user?.username,
        operatorRole: req.user?.role,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      })
      res.json(ApiResponse.success(result, '批量汇总完成'))
    } catch (error) {
      next(error)
    }
  }

  async traceResourceData(req, res, next) {
    try {
      const { id } = req.params
      const { days } = req.query
      const result = await dataAnalyticsService.traceResourceData(parseInt(id), { days: parseInt(days) || 30 })
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getQueryLogs(req, res, next) {
    try {
      const result = await dataAnalyticsService.getQueryLogs(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new DataAnalyticsController()
