const categoryService = require('../services/categoryService')
const ApiResponse = require('../utils/response')

class CategoryController {
  async getList(req, res, next) {
    try {
      const list = await categoryService.getList(req.query)
      res.json(ApiResponse.success(list))
    } catch (error) {
      next(error)
    }
  }

  async getTree(req, res, next) {
    try {
      const tree = await categoryService.getTree(req.query)
      res.json(ApiResponse.success(tree))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const category = await categoryService.getDetail(parseInt(id))
      res.json(ApiResponse.success(category))
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.body)
      res.json(ApiResponse.success(category, '创建成功'))
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const category = await categoryService.update(parseInt(id), req.body)
      res.json(ApiResponse.success(category, '更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      await categoryService.delete(parseInt(id))
      res.json(ApiResponse.success(null, '删除成功'))
    } catch (error) {
      next(error)
    }
  }

  async validateHierarchy(req, res, next) {
    try {
      const { parentId, targetLevel } = req.body
      const result = categoryService.validateHierarchy(parentId, targetLevel)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async validateMatch(req, res, next) {
    try {
      const { resourceId, categoryId } = req.body
      const resource = await require('../models').Resource.findByPk(resourceId)
      const category = await require('../models').Category.findByPk(categoryId)
      if (!resource) return res.json(ApiResponse.error('素材不存在'))
      if (!category) return res.json(ApiResponse.error('分类不存在'))
      const result = await categoryService.validateResourceCategoryMatch(resource, category)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async bindResource(req, res, next) {
    try {
      const { resourceId, categoryId } = req.body
      const result = await categoryService.bindResourceToCategory(
        resourceId,
        categoryId,
        req.user.id,
        req.user.username
      )
      res.json(ApiResponse.success(result, '绑定成功'))
    } catch (error) {
      next(error)
    }
  }

  async adjustParent(req, res, next) {
    try {
      const { id } = req.params
      const { newParentId } = req.body
      const result = await categoryService.adjustParent(
        parseInt(id),
        newParentId,
        req.user.id,
        req.user.username
      )
      res.json(ApiResponse.success(result, '调整成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchMigrate(req, res, next) {
    try {
      const { resourceIds, targetCategoryId } = req.body
      const result = await categoryService.batchMigrateResources(
        resourceIds,
        targetCategoryId,
        req.user.id,
        req.user.username
      )
      res.json(ApiResponse.success(result, '迁移完成'))
    } catch (error) {
      next(error)
    }
  }

  async getTrace(req, res, next) {
    try {
      const { id } = req.params
      const { days } = req.query
      const result = await categoryService.getCategoryTrace(parseInt(id), days ? parseInt(days) : 30)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getStats(req, res, next) {
    try {
      const result = await categoryService.getCategoryStats()
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new CategoryController()
