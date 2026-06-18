const accountPermissionService = require('../services/accountPermissionService')
const ApiResponse = require('../utils/response')

class AccountPermissionController {
  async getAccountList(req, res, next) {
    try {
      const result = await accountPermissionService.getAccountList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getAccountDetail(req, res, next) {
    try {
      const { id } = req.params
      const result = await accountPermissionService.getAccountDetail(parseInt(id))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async assignRole(req, res, next) {
    try {
      const { userId, roleId } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip,
        source: 'manual'
      }
      const result = await accountPermissionService.assignRole(userId, roleId, operatorInfo)
      res.json(ApiResponse.success(result, '角色分配成功'))
    } catch (error) {
      next(error)
    }
  }

  async revokeRole(req, res, next) {
    try {
      const { userId, roleId, reason } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip,
        reason
      }
      const result = await accountPermissionService.revokeRole(userId, roleId, operatorInfo)
      res.json(ApiResponse.success(result, '角色撤销成功'))
    } catch (error) {
      next(error)
    }
  }

  async addPermissions(req, res, next) {
    try {
      const { userId, permissionIds } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip,
        source: 'manual'
      }
      const result = await accountPermissionService.addPermissions(userId, permissionIds, operatorInfo)
      res.json(ApiResponse.success(result, '权限分配成功'))
    } catch (error) {
      next(error)
    }
  }

  async removePermissions(req, res, next) {
    try {
      const { userId, permissionIds, reason } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip,
        reason
      }
      const result = await accountPermissionService.removePermissions(userId, permissionIds, operatorInfo)
      res.json(ApiResponse.success(result, '权限移除成功'))
    } catch (error) {
      next(error)
    }
  }

  async adjustPermissions(req, res, next) {
    try {
      const { id } = req.params
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip
      }
      const result = await accountPermissionService.adjustPermissions(parseInt(id), req.body, operatorInfo)
      res.json(ApiResponse.success(result, '权限调整成功'))
    } catch (error) {
      next(error)
    }
  }

  async batchAssignRole(req, res, next) {
    try {
      const { userIds, roleId } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip,
        source: 'batch'
      }
      const result = await accountPermissionService.batchAssignRole(userIds, roleId, operatorInfo)
      res.json(ApiResponse.success(result, '批量分配完成'))
    } catch (error) {
      next(error)
    }
  }

  async batchAddPermissions(req, res, next) {
    try {
      const { userIds, permissionIds } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip,
        source: 'batch'
      }
      const result = await accountPermissionService.batchAddPermissions(userIds, permissionIds, operatorInfo)
      res.json(ApiResponse.success(result, '批量分配完成'))
    } catch (error) {
      next(error)
    }
  }

  async validateAccountStatus(req, res, next) {
    try {
      const { id } = req.params
      const result = await accountPermissionService.validateAccountStatus(parseInt(id))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async checkConflict(req, res, next) {
    try {
      const { userId, permissionIds } = req.body
      const result = await accountPermissionService.checkPermissionStackConflicts(userId, permissionIds)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async checkRoleMatch(req, res, next) {
    try {
      const { userId, roleId } = req.query
      const result = await accountPermissionService.checkRolePermissionMatch(parseInt(roleId), parseInt(userId))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async traceAccount(req, res, next) {
    try {
      const { id } = req.params
      const result = await accountPermissionService.traceAccount(parseInt(id))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async cleanupRedundant(req, res, next) {
    try {
      const { id } = req.params
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip
      }
      const result = await accountPermissionService.cleanupRedundant(parseInt(id), operatorInfo)
      res.json(ApiResponse.success(result, '冗余权限清理完成'))
    } catch (error) {
      next(error)
    }
  }

  async getAccountLogs(req, res, next) {
    try {
      const result = await accountPermissionService.getAccountLogs(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AccountPermissionController()
