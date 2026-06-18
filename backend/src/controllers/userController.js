const userService = require('../services/userService')
const accountService = require('../services/accountService')
const riskControlService = require('../services/riskControlService')
const ApiResponse = require('../utils/response')

class UserController {
  async getList(req, res, next) {
    try {
      const result = await userService.getList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getDetail(req, res, next) {
    try {
      const { id } = req.params
      const user = await userService.getDetail(parseInt(id))
      res.json(ApiResponse.success(user))
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        ip: req.ip
      }
      const user = await accountService.createAccount(req.body, operatorInfo)
      res.json(ApiResponse.success(user, '创建成功'))
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        ip: req.ip
      }
      const result = await accountService.editWithVerification(
        parseInt(id),
        req.body,
        operatorInfo,
        req.body.verifyPassword
      )
      res.json(ApiResponse.success(result, '更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      await userService.delete(parseInt(id))
      res.json(ApiResponse.success(null, '删除成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchDelete(req, res, next) {
    try {
      const { ids } = req.body
      await userService.batchDelete(ids)
      res.json(ApiResponse.success(null, '批量删除成功'))
    } catch (error) {
      next(error)
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip
      }
      const result = await riskControlService.changeStatus(
        parseInt(id),
        {
          newStatus: req.body.status,
          reason: req.body.reason,
          statusExpireAt: req.body.statusExpireAt,
          linkedViolationId: req.body.linkedViolationId,
          linkedAppealId: req.body.linkedAppealId,
          force: req.body.force
        },
        operatorInfo
      )
      res.json(ApiResponse.success(result, '状态变更成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchChangeStatus(req, res, next) {
    try {
      const { ids, ...rest } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip
      }
      const result = await riskControlService.batchChangeStatus(
        ids,
        rest,
        operatorInfo
      )
      res.json(ApiResponse.success(result, '批量状态变更完成'))
    } catch (error) {
      next(error)
    }
  }

  async getRiskPreview(req, res, next) {
    try {
      const { id } = req.params
      const { newStatus } = req.query
      const result = await riskControlService.getRiskPreview(
        parseInt(id),
        newStatus,
        req.user?.role
      )
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getStatusLogs(req, res, next) {
    try {
      const { userId } = req.params
      const result = await riskControlService.getStatusLogs(parseInt(userId), req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getChangeStats(req, res, next) {
    try {
      const { userId } = req.params
      const result = await riskControlService.getChangeStats(parseInt(userId))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async validateAccount(req, res, next) {
    try {
      const { phone, nickname, uid, excludeUserId } = req.query
      const result = await accountService.validateAccount(
        { phone, nickname, uid },
        excludeUserId ? parseInt(excludeUserId) : null
      )
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getEditLogs(req, res, next) {
    try {
      const { userId } = req.params
      const result = await accountService.getEditLogs(parseInt(userId), req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async batchUpdate(req, res, next) {
    try {
      const { ids, ...data } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        ip: req.ip
      }
      const result = await accountService.batchUpdate(ids, data, operatorInfo)
      res.json(ApiResponse.success(result, '批量更新完成'))
    } catch (error) {
      next(error)
    }
  }

  async traceAccount(req, res, next) {
    try {
      const operatorInfo = {
        operatorId: req.user?.id,
        operatorName: req.user?.username
      }
      const result = await accountService.traceAccount({ ...req.query, ...operatorInfo })
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getComplianceLogs(req, res, next) {
    try {
      const result = await accountService.getComplianceLogs(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new UserController()
