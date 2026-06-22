const qualityControlService = require('../services/qualityControlService')
const ApiResponse = require('../utils/response')
const ApiError = require('../utils/apiError')

class QualityControlController {
  async getStats(req, res, next) {
    try {
      const result = await qualityControlService.getQualityStats()
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async assessResource(req, res, next) {
    try {
      const { id } = req.params
      const { remark } = req.body
      const userId = req.user?.id
      const username = req.user?.username
      const userRole = req.user?.role
      const ip = req.ip
      const userAgent = req.headers['user-agent']

      if (!id) {
        throw new ApiError('缺少作品ID', 400)
      }

      const result = await qualityControlService.assessResourceQuality(parseInt(id), {
        assessType: 'manual',
        operatorId: userId,
        operatorName: username,
        operatorRole: userRole,
        ip,
        userAgent,
        remark
      })

      res.json(ApiResponse.success(result, result.needsReview ? '评估完成，该作品待人工复核' : '评估完成'))
    } catch (error) {
      next(error)
    }
  }

  async batchAssess(req, res, next) {
    try {
      const { ids, remark, timeRange } = req.body
      const userId = req.user?.id
      const username = req.user?.username
      const userRole = req.user?.role
      const ip = req.ip
      const userAgent = req.headers['user-agent']

      if (!ids || !ids.length) {
        throw new ApiError('请选择需要评估的作品', 400)
      }

      const result = await qualityControlService.batchAssessResources(ids, {
        operatorId: userId,
        operatorName: username,
        operatorRole: userRole,
        ip,
        userAgent,
        remark
      })

      res.json(ApiResponse.success(result, `批量评估完成，成功${result.successCount}个，失败${result.failedCount}个`))
    } catch (error) {
      next(error)
    }
  }

  async reviewResource(req, res, next) {
    try {
      const { id } = req.params
      const { reviewResult, newLevel, reviewReason, lockReason, ruleOptimizationNote } = req.body
      const userId = req.user?.id
      const username = req.user?.username
      const userRole = req.user?.role
      const ip = req.ip
      const userAgent = req.headers['user-agent']

      if (!id || !reviewResult) {
        throw new ApiError('缺少必要参数', 400)
      }

      const result = await qualityControlService.reviewResource(parseInt(id), reviewResult, {
        newLevel,
        reviewReason,
        reviewerId: userId,
        reviewerName: username,
        reviewerRole: userRole,
        lockReason,
        ruleOptimizationNote,
        ip,
        userAgent
      })

      res.json(ApiResponse.success(result, result.message))
    } catch (error) {
      next(error)
    }
  }

  async getQualityList(req, res, next) {
    try {
      const result = await qualityControlService.getQualityList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getAssessmentLogs(req, res, next) {
    try {
      const result = await qualityControlService.getAssessmentLogs(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getReviewLogs(req, res, next) {
    try {
      const result = await qualityControlService.getReviewLogs(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getResourceQualityDetail(req, res, next) {
    try {
      const { id } = req.params
      const result = await qualityControlService.getResourceQualityDetail(parseInt(id))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new QualityControlController()
