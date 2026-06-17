const recycleService = require('../services/recycleService')
const ApiResponse = require('../utils/response')

class RecycleController {
  async validateDiscard(req, res, next) {
    try {
      const { resourceId } = req.params
      const result = await recycleService.validateDiscard(parseInt(resourceId))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async submitDiscard(req, res, next) {
    try {
      const { resourceId } = req.params
      const { reason } = req.body
      const applicant = req.user
      const recycle = await recycleService.submitDiscard(parseInt(resourceId), reason, applicant)
      res.json(ApiResponse.success(recycle, '废弃申请提交成功'))
    } catch (error) {
      next(error)
    }
  }

  async reviewDiscard(req, res, next) {
    try {
      const { id } = req.params
      const { result, opinion } = req.body
      const reviewer = req.user
      const recycle = await recycleService.reviewDiscard(parseInt(id), result, opinion, reviewer)
      res.json(ApiResponse.success(recycle, `废弃申请已${result === 'approved' ? '通过' : '驳回'}`))
    } catch (error) {
      next(error)
    }
  }

  async batchDiscard(req, res, next) {
    try {
      const { resourceIds, reason } = req.body
      const applicant = req.user
      const results = await recycleService.batchDiscard(resourceIds, reason, applicant)
      res.json(ApiResponse.success(results, `批量废弃申请完成，成功提交${results.submitted.length}条`))
    } catch (error) {
      next(error)
    }
  }

  async getList(req, res, next) {
    try {
      const result = await recycleService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const recycle = await recycleService.getDetail(parseInt(id))
      res.json(ApiResponse.success(recycle))
    } catch (error) {
      next(error)
    }
  }

  async validateRestore(req, res, next) {
    try {
      const { id } = req.params
      const result = await recycleService.validateRestore(parseInt(id))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async restoreResource(req, res, next) {
    try {
      const { id } = req.params
      const operator = req.user
      const result = await recycleService.restoreResource(parseInt(id), operator)
      res.json(ApiResponse.success(result, '素材恢复成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchRestore(req, res, next) {
    try {
      const { recycleIds } = req.body
      const operator = req.user
      const results = await recycleService.batchRestore(recycleIds, operator)
      res.json(ApiResponse.success(results, `批量恢复完成，成功${results.success.length}条`))
    } catch (error) {
      next(error)
    }
  }

  async getPendingCount(req, res, next) {
    try {
      const count = await recycleService.getPendingCount()
      res.json(ApiResponse.success({ count }))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new RecycleController()
