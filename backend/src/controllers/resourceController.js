const resourceService = require('../services/resourceService')
const ApiResponse = require('../utils/response')

class ResourceController {
  async getList(req, res, next) {
    try {
      const result = await resourceService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const resource = await resourceService.getDetail(parseInt(id))
      res.json(ApiResponse.success(resource))
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const userId = req.user?.id
      const resource = await resourceService.create(req.body, userId)
      res.json(ApiResponse.success(resource, '创建成功'))
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const resource = await resourceService.update(parseInt(id), req.body)
      res.json(ApiResponse.success(resource, '更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      await resourceService.delete(parseInt(id))
      res.json(ApiResponse.success(null, '删除成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchDelete(req, res, next) {
    try {
      const { ids } = req.body
      await resourceService.batchDelete(ids)
      res.json(ApiResponse.success(null, '批量删除成功'))
    } catch (error) {
      next(error)
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status } = req.body
      await resourceService.updateStatus(parseInt(id), status)
      res.json(ApiResponse.success(null, '状态更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchUpdateStatus(req, res, next) {
    try {
      const { ids, status } = req.body
      await resourceService.batchUpdateStatus(ids, status)
      res.json(ApiResponse.success(null, '批量状态更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async submitForAudit(req, res, next) {
    try {
      const { id } = req.params
      const resource = await resourceService.submitForAudit(parseInt(id))
      res.json(ApiResponse.success(resource, '提交审核成功'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new ResourceController()
