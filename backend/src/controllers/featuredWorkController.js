const featuredWorkService = require('../services/featuredWorkService')
const ApiResponse = require('../utils/response')

class FeaturedWorkController {
  async preValidate(req, res, next) {
    try {
      const { resourceId } = req.body
      const userId = req.user?.id
      const result = await featuredWorkService.preValidate(parseInt(resourceId), userId)
      res.json(ApiResponse.success(result, result.valid ? '校验通过' : '校验未通过'))
    } catch (error) {
      next(error)
    }
  }

  async getResourceListForFeatured(req, res, next) {
    try {
      const result = await featuredWorkService.getResourceListForFeatured(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getFeaturedList(req, res, next) {
    try {
      const result = await featuredWorkService.getFeaturedList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const featured = await featuredWorkService.getDetail(parseInt(id))
      res.json(ApiResponse.success(featured))
    } catch (error) {
      next(error)
    }
  }

  async createWithValidation(req, res, next) {
    try {
      const { resourceId, operatorName, ...data } = req.body
      const userId = req.user?.id
      const featured = await featuredWorkService.createWithValidation(
        parseInt(resourceId),
        userId,
        data,
        operatorName
      )
      res.json(ApiResponse.success(featured, '收录成功'))
    } catch (error) {
      next(error)
    }
  }

  async cancelFeatured(req, res, next) {
    try {
      const { id } = req.params
      const { operatorName, ...data } = req.body
      const userId = req.user?.id
      const result = await featuredWorkService.cancelFeatured(parseInt(id), userId, data, operatorName)
      res.json(ApiResponse.success(result, '取消收录成功'))
    } catch (error) {
      next(error)
    }
  }

  async adjustWeight(req, res, next) {
    try {
      const { id } = req.params
      const { newWeight, operatorName, ...data } = req.body
      const userId = req.user?.id
      const result = await featuredWorkService.adjustWeight(parseInt(id), parseInt(newWeight), userId, data, operatorName)
      res.json(ApiResponse.success(result, '权重调整成功'))
    } catch (error) {
      next(error)
    }
  }

  async adjustPosition(req, res, next) {
    try {
      const { id } = req.params
      const { newPosition, operatorName, ...data } = req.body
      const userId = req.user?.id
      const result = await featuredWorkService.adjustPosition(parseInt(id), newPosition, userId, data, operatorName)
      res.json(ApiResponse.success(result, '展示位置调整成功'))
    } catch (error) {
      next(error)
    }
  }

  async adjustLevel(req, res, next) {
    try {
      const { id } = req.params
      const { newLevel, operatorName, ...data } = req.body
      const userId = req.user?.id
      const result = await featuredWorkService.adjustLevel(parseInt(id), newLevel, userId, data, operatorName)
      res.json(ApiResponse.success(result, '精选等级调整成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchFeature(req, res, next) {
    try {
      const { resourceIds, operatorName, ...data } = req.body
      const userId = req.user?.id
      const result = await featuredWorkService.batchFeature(resourceIds, userId, data, operatorName)
      res.json(ApiResponse.success(result, '批量收录操作完成'))
    } catch (error) {
      next(error)
    }
  }

  async batchCancel(req, res, next) {
    try {
      const { featuredIds, operatorName, ...data } = req.body
      const userId = req.user?.id
      const result = await featuredWorkService.batchCancel(featuredIds, userId, data, operatorName)
      res.json(ApiResponse.success(result, '批量取消收录完成'))
    } catch (error) {
      next(error)
    }
  }

  async getLogs(req, res, next) {
    try {
      const result = await featuredWorkService.getLogs(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async traceFeatured(req, res, next) {
    try {
      const { id } = req.params
      const result = await featuredWorkService.traceFeatured(parseInt(id))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getStatusOverview(req, res, next) {
    try {
      const result = await featuredWorkService.getStatusOverview()
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async verify(req, res, next) {
    try {
      const { id } = req.params
      const { pass, operatorName, ...data } = req.body
      const userId = req.user?.id
      const result = await featuredWorkService.verify(parseInt(id), !!pass, userId, data, operatorName)
      res.json(ApiResponse.success(result, pass ? '核验通过' : '核验不通过'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new FeaturedWorkController()
