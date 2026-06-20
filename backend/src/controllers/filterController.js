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
