const templateService = require('../services/templateService')
const ApiResponse = require('../utils/response')

class TemplateController {
  async getList(req, res, next) {
    try {
      const result = await templateService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const template = await templateService.getDetail(parseInt(id))
      res.json(ApiResponse.success(template))
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const userId = req.user?.id
      const template = await templateService.create(req.body, userId)
      res.json(ApiResponse.success(template, '创建成功'))
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const template = await templateService.update(parseInt(id), req.body)
      res.json(ApiResponse.success(template, '更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      await templateService.delete(parseInt(id))
      res.json(ApiResponse.success(null, '删除成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchDelete(req, res, next) {
    try {
      const { ids } = req.body
      await templateService.batchDelete(ids)
      res.json(ApiResponse.success(null, '批量删除成功'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new TemplateController()
