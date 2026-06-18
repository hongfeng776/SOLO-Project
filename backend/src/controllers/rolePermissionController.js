const rolePermissionService = require('../services/rolePermissionService')
const ApiResponse = require('../utils/response')

class RolePermissionController {
  async getRoleList(req, res, next) {
    try {
      const result = await rolePermissionService.getRoleList(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async getRoleDetail(req, res, next) {
    try {
      const { id } = req.params
      const result = await rolePermissionService.getRoleDetail(parseInt(id))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async createRole(req, res, next) {
    try {
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip
      }
      const result = await rolePermissionService.createRole(req.body, operatorInfo)
      res.json(ApiResponse.success(result, '角色创建成功'))
    } catch (error) {
      next(error)
    }
  }

  async updateRolePermissions(req, res, next) {
    try {
      const { id } = req.params
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip
      }
      const result = await rolePermissionService.updateRolePermissions(parseInt(id), req.body, operatorInfo)
      res.json(ApiResponse.success(result, '权限更新成功'))
    } catch (error) {
      next(error)
    }
  }

  async deleteRole(req, res, next) {
    try {
      const { id } = req.params
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip
      }
      await rolePermissionService.deleteRole(parseInt(id), operatorInfo)
      res.json(ApiResponse.success(null, '角色删除成功'))
    } catch (error) {
      next(error)
    }
  }

  async getPermissionMenuTree(req, res, next) {
    try {
      const result = await rolePermissionService.getPermissionMenuTree(req.query)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getPermissionModules(req, res, next) {
    try {
      const result = await rolePermissionService.getPermissionModules()
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async validateRoleName(req, res, next) {
    try {
      const result = await rolePermissionService.validateRoleName(req.query.name, req.query.excludeId ? parseInt(req.query.excludeId) : null)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async validateRoleCode(req, res, next) {
    try {
      const result = await rolePermissionService.validateRoleCode(req.query.code, req.query.excludeId ? parseInt(req.query.excludeId) : null)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async validatePermissionConfig(req, res, next) {
    try {
      const { roleId } = req.params
      const { permissionIds } = req.body
      const result = await rolePermissionService.validatePermissionConfig(parseInt(roleId), permissionIds)
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async batchCopyTemplate(req, res, next) {
    try {
      const { sourceRoleId, targetRoleIds } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip
      }
      const result = await rolePermissionService.batchCopyTemplate(sourceRoleId, targetRoleIds, operatorInfo)
      res.json(ApiResponse.success(result, '批量复制完成'))
    } catch (error) {
      next(error)
    }
  }

  async batchModifyPermissions(req, res, next) {
    try {
      const { roleIds, permissionIds } = req.body
      const operatorInfo = {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        ip: req.ip
      }
      const result = await rolePermissionService.batchModifyPermissions(roleIds, permissionIds, operatorInfo)
      res.json(ApiResponse.success(result, '批量修改完成'))
    } catch (error) {
      next(error)
    }
  }

  async traceRole(req, res, next) {
    try {
      const { id } = req.params
      const result = await rolePermissionService.traceRole(parseInt(id))
      res.json(ApiResponse.success(result))
    } catch (error) {
      next(error)
    }
  }

  async getPermissionLogs(req, res, next) {
    try {
      const result = await rolePermissionService.getPermissionLogs(req.query)
      res.json(ApiResponse.page(result.list, result.total, result.page, result.pageSize))
    } catch (error) {
      next(error)
    }
  }

  async initDefaultData(req, res, next) {
    try {
      await rolePermissionService.initDefaultData()
      res.json(ApiResponse.success(null, '初始化完成'))
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new RolePermissionController()
