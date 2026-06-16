const appealService = require('../services/appealService')
const ApiResponse = require('../utils/response')

class AppealController {
  async getList(req, res, next) {
    try {
      const result = await appealService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const appeal = await appealService.getDetail(parseInt(id))
      res.json(ApiResponse.success(appeal))
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const appeal = await appealService.create(req.body)
      res.json(ApiResponse.success(appeal, '申诉提交成功'))
    } catch (error) {
      next(error)
    }
  }

  async review(req, res, next) {
    try {
      const { id } = req.params
      const { result, opinion } = req.body
      const reviewer = req.user
      const appeal = await appealService.review(parseInt(id), result, opinion, reviewer)
      res.json(ApiResponse.success(appeal, '复核成功'))
    } catch (error) {
      next(error)
    }
  }

  async getPendingCount(req, res, next) {
    try {
      const count = await appealService.getPendingCount()
      res.json(ApiResponse.success({ count }))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AppealController()
