const resourceVisibilityService = require('../services/resourceVisibilityService')
const ApiResponse = require('../utils/response')
const ApiError = require('../utils/apiError')

class ResourceVisibilityController {
  async preValidate(req, res, next) {
    try {
      const { resourceId, targetVisibility } = req.body
      if (!resourceId || !targetVisibility) {
        throw new ApiError('缺少必要参数', 400)
      }
      const result = await resourceVisibilityService.preValidate(
        parseInt(resourceId),
        targetVisibility
      )
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async changeVisibility(req, res, next) {
    try {
      const { id } = req.params
      const { newVisibility, reason } = req.body
      const userId = req.user?.id
      const username = req.user?.username
      const userRole = req.user?.role
      const ip = req.ip
      const userAgent = req.headers['user-agent']

      if (!id || !newVisibility) {
        throw new ApiError('缺少必要参数', 400)
      }

      const result = await resourceVisibilityService.changeVisibility(
        parseInt(id),
        newVisibility,
        {
          reason,
          operatorId: userId,
          operatorName: username,
          operatorRole: userRole,
          ip,
          userAgent
        }
      )

      res.json(
        ApiResponse.success(
          result,
          result.reason || (result.changed ? '状态变更成功' : '状态未变更')
        )
      )
    } catch (error) {
      next(error)
    }
  }

  async auditVisibility(req, res, next) {
    try {
      const { logId } = req.params
      const { pass, auditOpinion } = req.body
      const userId = req.user?.id
      const username = req.user?.username

      if (!logId || pass === undefined) {
        throw new ApiError('缺少必要参数', 400)
      }

      const result = await resourceVisibilityService.auditVisibilityChange(
        parseInt(logId),
        pass,
        {
          auditOpinion,
          auditorId: userId,
          auditorName: username
        }
      )

      res.json(ApiResponse.success(result, result.message))
    } catch (error) {
      next(error)
    }
  }

  async batchChangeVisibility(req, res, next) {
    try {
      const { ids, newVisibility, reason } = req.body
      const userId = req.user?.id
      const username = req.user?.username
      const userRole = req.user?.role
      const ip = req.ip
      const userAgent = req.headers['user-agent']

      if (!ids || !ids.length || !newVisibility) {
        throw new ApiError('缺少必要参数', 400)
      }

      const result = await resourceVisibilityService.batchChangeVisibility(ids, newVisibility, {
        reason,
        operatorId: userId,
        operatorName: username,
        operatorRole: userRole,
        ip,
        userAgent
      })

      res.json(ApiResponse.success(result, '批量操作完成'))
    } catch (error) {
      next(error)
    }
  }

  async getVisibilityList(req, res, next) {
    try {
      const result = await resourceVisibilityService.getVisibilityList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getVisibilityLogs(req, res, next) {
    try {
      const result = await resourceVisibilityService.getVisibilityLogs(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getVisibilityStats(req, res, next) {
    try {
      const result = await resourceVisibilityService.getVisibilityStats()
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getResourceVisibilityDetail(req, res, next) {
    try {
      const { id } = req.params
      const result = await resourceVisibilityService.getResourceVisibilityDetail(parseInt(id))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new ResourceVisibilityController()
