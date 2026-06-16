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
      const { status, reason } = req.body
      const resource = await resourceService.updateStatus(parseInt(id), status, reason)
      res.json(ApiResponse.success(resource, '状态更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchUpdateStatus(req, res, next) {
    try {
      const { ids, status, reason } = req.body
      const result = await resourceService.batchUpdateStatus(ids, status, reason)
      res.json(ApiResponse.success(result, '批量状态更新成功'))
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

  async publishResource(req, res, next) {
    try {
      const { id } = req.params
      const resource = await resourceService.publishResource(parseInt(id))
      res.json(ApiResponse.success(resource, '发布成功'))
    } catch (error) {
      next(error)
    }
  }

  async offlineResource(req, res, next) {
    try {
      const { id } = req.params
      const { reason } = req.body
      const resource = await resourceService.offlineResource(parseInt(id), reason)
      res.json(ApiResponse.success(resource, '下架成功'))
    } catch (error) {
      next(error)
    }
  }

  async blockResource(req, res, next) {
    try {
      const { id } = req.params
      const { reason } = req.body
      const resource = await resourceService.blockResource(parseInt(id), reason)
      res.json(ApiResponse.success(resource, '风控拦截成功'))
    } catch (error) {
      next(error)
    }
  }

  async unblockResource(req, res, next) {
    try {
      const { id } = req.params
      const resource = await resourceService.unblockResource(parseInt(id))
      res.json(ApiResponse.success(resource, '解除拦截成功'))
    } catch (error) {
      next(error)
    }
  }

  async getHotResources(req, res, next) {
    try {
      const { limit } = req.query
      const resources = await resourceService.getHotResources(parseInt(limit) || 10)
      res.json(ApiResponse.success(resources))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new ResourceController()
