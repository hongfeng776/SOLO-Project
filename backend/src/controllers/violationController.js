const violationService = require('../services/violationService')
const ApiResponse = require('../utils/response')

class ViolationController {
  async getList(req, res, next) {
    try {
      const result = await violationService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const violation = await violationService.getDetail(parseInt(id))
      res.json(ApiResponse.success(violation))
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const handler = req.user
      const violation = await violationService.create(req.body, handler)
      res.json(ApiResponse.success(violation, '创建违规记录成功'))
    } catch (error) {
      next(error)
    }
  }

  async handleViolation(req, res, next) {
    try {
      const { id } = req.params
      const { action } = req.body
      const handler = req.user
      const violation = await violationService.handleViolation(parseInt(id), action, handler)
      res.json(ApiResponse.success(violation, '处置成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchHandle(req, res, next) {
    try {
      const { ids, action } = req.body
      const handler = req.user
      const count = await violationService.batchHandle(ids, action, handler)
      res.json(ApiResponse.success(count, `批量处置成功，共处理${count}条记录`))
    } catch (error) {
      next(error)
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await violationService.getStats()
      res.json(ApiResponse.success(stats))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new ViolationController()
