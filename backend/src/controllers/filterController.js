const filterService = require('../services/filterService')
const ApiResponse = require('../utils/response')

class FilterController {
  async getList(req, res, next) {
    try {
      const result = await filterService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const filter = await filterService.getDetail(parseInt(id))
      res.json(ApiResponse.success(filter))
    } catch (error) {
      next(error)
    }
  }

  async validateCreate(req, res, next) {
    try {
      const userId = req.user?.id
      const result = await filterService.validateBeforeCreate(req.body, userId)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async createWithValidation(req, res, next) {
    try {
      const userId = req.user?.id
      const filter = await filterService.createWithValidation(req.body, userId)
      res.json(ApiResponse.success(filter, '录入成功'))
    } catch (error) {
      next(error)
    }
  }

  async updateWithConstraint(req, res, next) {
    try {
      const { id } = req.params
      const userId = req.user?.id
      const filter = await filterService.updateWithConstraint(parseInt(id), req.body, userId)
      res.json(ApiResponse.success(filter, '编辑成功'))
    } catch (error) {
      next(error)
    }
  }

  async getEditLogs(req, res, next) {
    try {
      const { id } = req.params
      const result = await filterService.getEditLogs(parseInt(id), req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async batchValidateAndSubmit(req, res, next) {
    try {
      const { items } = req.body
      const userId = req.user?.id
      const result = await filterService.batchValidateAndSubmit(items, userId)
      res.json(ApiResponse.success(result, '批量录入完成'))
    } catch (error) {
      next(error)
    }
  }

  async traceFilter(req, res, next) {
    try {
      const { keyword } = req.query
      const result = await filterService.traceFilter(keyword)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status, skipSecondConfirm, violationReason, operatorName } = req.body
      const userId = req.user?.id
      const result = await filterService.updateStatus(
        parseInt(id),
        status,
        userId,
        { skipSecondConfirm, violationReason, operatorName }
      )
      if (result.needSecondConfirm) {
        res.json(ApiResponse.success(result, '需要二次确认'))
      } else {
        res.json(ApiResponse.success(result, '状态更新成功'))
      }
    } catch (error) {
      next(error)
    }
  }

  async batchUpdateStatus(req, res, next) {
    try {
      const { ids, status, operatorName } = req.body
      const userId = req.user?.id
      const result = await filterService.batchStatusUpdate(ids, status, userId, { operatorName })
      res.json(ApiResponse.success(result, '批量状态操作完成'))
    } catch (error) {
      next(error)
    }
  }

  async getStatusOverview(req, res, next) {
    try {
      const result = await filterService.getStatusOverview()
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async validateCategoryBind(req, res, next) {
    try {
      const userId = req.user?.id
      const result = await filterService.validateCategoryBind(req.body.filterId, req.body.categoryId, userId)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async adjustCategoryStep(req, res, next) {
    try {
      const { filterId, categoryId, operatorName, reason } = req.body
      const userId = req.user?.id
      const result = await filterService.adjustCategoryStep(filterId, categoryId, userId, { operatorName, reason })
      res.json(ApiResponse.success(result, '分类调整成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchCategoryMigrate(req, res, next) {
    try {
      const { filterIds, categoryId, operatorName } = req.body
      const userId = req.user?.id
      const result = await filterService.batchCategoryMigrate(filterIds, categoryId, userId, { operatorName })
      res.json(ApiResponse.success(result, '批量分类迁移完成'))
    } catch (error) {
      next(error)
    }
  }

  async traceCategoryAdapt(req, res, next) {
    try {
      const categoryId = req.query.categoryId
      const result = await filterService.traceCategoryAdapt(parseInt(String(categoryId)))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getCategoryAdaptList(req, res, next) {
    try {
      const result = await filterService.getCategoryAdaptList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async validateWeightAdjust(req, res, next) {
    try {
      const { filterId, targetWeight } = req.body
      const userId = req.user?.id
      const result = await filterService.validateWeightAdjust(filterId, targetWeight, userId)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async adjustWeightStep(req, res, next) {
    try {
      const { filterId, newWeight, operatorName, reason } = req.body
      const userId = req.user?.id
      const result = await filterService.adjustWeightStep(filterId, newWeight, userId, { operatorName, reason })
      res.json(ApiResponse.success(result, '权重调整成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchWeightConfig(req, res, next) {
    try {
      const { filterIds, mode, operatorName } = req.body
      const userId = req.user?.id
      const result = await filterService.batchWeightConfig(filterIds, mode, userId, { operatorName })
      res.json(ApiResponse.success(result, '批量权重配置完成'))
    } catch (error) {
      next(error)
    }
  }

  async traceWeightHistory(req, res, next) {
    try {
      const { filterId } = req.query
      const result = await filterService.traceWeightHistory(parseInt(String(filterId)))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getWeightLogList(req, res, next) {
    try {
      const result = await filterService.getWeightLogList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      await filterService.delete(parseInt(id))
      res.json(ApiResponse.success(null, '删除成功'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new FilterController()
