const logService = require('../services/logService')
const ApiResponse = require('../utils/response')

class LogController {
  async getList(req, res, next) {
    try {
      const result = await logService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const log = await logService.create(req.body)
      res.json(ApiResponse.success(log, '日志记录成功'))
    } catch (error) {
      next(error)
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await logService.getStats()
      res.json(ApiResponse.success(stats))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new LogController()
