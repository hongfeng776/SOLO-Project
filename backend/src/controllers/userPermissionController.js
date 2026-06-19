const userPermissionService = require('../services/userPermissionService')
const ApiResponse = require('../utils/response')

class UserPermissionController {
  async getUserPermissionList(req, res, next) {
    try {
      const result = await userPermissionService.getUserPermissionList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) { next(error) }
  }

  async getUserPermissionDetail(req, res, next) {
    try {
      const { userId } = req.params
      const result = await userPermissionService.getUserPermissionDetail(parseInt(userId))
      res.json(ApiResponse.success(result))
    } catch (error) { next(error) }
  }

  async assignRole(req, res, next) {
    try {
      const { userId, roleId, reason } = req.body
      const operatorInfo = {
        id: req.user?.id, username: req.user?.username,
        role: req.user?.role, ip: req.ip
      }
      const result = await userPermissionService.assignRoleToUser(
        parseInt(userId), parseInt(roleId),
        { ...operatorInfo, reason }
      )
      res.json(ApiResponse.success(result, '角色分配成功'))
    } catch (error) { next(error) }
  }

  async addDirectPermissions(req, res, next) {
    try {
      const { userId, permissionIds, expiresAt, reason } = req.body
      const operatorInfo = {
        id: req.user?.id, username: req.user?.username,
        role: req.user?.role, ip: req.ip
      }
      const result = await userPermissionService.addDirectPermissions(
        parseInt(userId), permissionIds,
        { expiresAt, reason, operatorInfo }
      )
      res.json(ApiResponse.success(result, '权限添加完成'))
    } catch (error) { next(error) }
  }

  async removeDirectPermissions(req, res, next) {
    try {
      const { userId, permissionIds, reason, forceRemove } = req.body
      const operatorInfo = {
        id: req.user?.id, username: req.user?.username,
        role: req.user?.role, ip: req.ip
      }
      const result = await userPermissionService.removeDirectPermissions(
        parseInt(userId), permissionIds,
        { reason, forceRemove, operatorInfo }
      )
      res.json(ApiResponse.success(result, '权限移除完成'))
    } catch (error) { next(error) }
  }

  async batchAssign(req, res, next) {
    try {
      const operatorInfo = {
        id: req.user?.id, username: req.user?.username,
        role: req.user?.role, ip: req.ip
      }
      const result = await userPermissionService.batchAssign(req.body, operatorInfo)
      res.json(ApiResponse.success(result, '批量分配完成'))
    } catch (error) { next(error) }
  }

  async traceUserPermissions(req, res, next) {
    try {
      const { userId } = req.params
      const result = await userPermissionService.traceUserPermissions(parseInt(userId))
      res.json(ApiResponse.success(result))
    } catch (error) { next(error) }
  }

  async getPermissionLogs(req, res, next) {
    try {
      const result = await userPermissionService.getPermissionLogs(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) { next(error) }
  }

  async cleanRedundantPermissions(req, res, next) {
    try {
      const { userId } = req.params
      const operatorInfo = {
        id: req.user?.id, username: req.user?.username,
        role: req.user?.role, ip: req.ip
      }
      const result = await userPermissionService.cleanRedundantPermissions(parseInt(userId), operatorInfo)
      res.json(ApiResponse.success(result, '冗余权限清理完成'))
    } catch (error) { next(error) }
  }

  async getAllRoles(req, res, next) {
    try {
      const result = await userPermissionService.getAllRoles()
      res.json(ApiResponse.success(result))
    } catch (error) { next(error) }
  }

  async getAllUsersForSelect(req, res, next) {
    try {
      const result = await userPermissionService.getAllUsersForSelect(req.query)
      res.json(ApiResponse.success(result))
    } catch (error) { next(error) }
  }

  async validateUserStatus(req, res, next) {
    try {
      const { User } = require('../models')
      const user = await User.findByPk(parseInt(req.params.userId))
      const result = userPermissionService.validateUserStatus(user)
      res.json(ApiResponse.success(result))
    } catch (error) { next(error) }
  }

  async validateRolePermissionMatch(req, res, next) {
    try {
      const { User } = require('../models')
      const { userId, roleId, additionalPermIds = [] } = req.body
      const user = await User.findByPk(parseInt(userId))
      const result = await userPermissionService.validateRolePermissionMatch(
        user, parseInt(roleId), additionalPermIds
      )
      res.json(ApiResponse.success(result))
    } catch (error) { next(error) }
  }

  async validatePermissionUniqueness(req, res, next) {
    try {
      const { userId, permissionIds, source = 'direct_assign' } = req.body
      const result = await userPermissionService.validatePermissionUniqueness(
        parseInt(userId), permissionIds, source
      )
      res.json(ApiResponse.success(result))
    } catch (error) { next(error) }
  }
}

module.exports = new UserPermissionController()
