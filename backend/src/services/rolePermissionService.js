const { Role, PermissionMenu, RolePermission, RolePermissionLog, User } = require('../models')
const { Op } = require('sequelize')
const { getPagination } = require('../utils/common')
const ApiError = require('../utils/apiError')
const dayjs = require('dayjs')

class RolePermissionService {
  async validateRoleName(name, excludeId = null) {
    if (!name || name.trim().length < 2 || name.trim().length > 30) {
      return { valid: false, reason: '角色名称长度2-30字符' }
    }
    const where = { name: name.trim() }
    if (excludeId) where.id = { [Op.ne]: excludeId }
    const exists = await Role.count({ where })
    if (exists > 0) return { valid: false, reason: `角色名称"${name}"已存在` }
    return { valid: true }
  }

  async validateRoleCode(code, excludeId = null) {
    if (!code || !/^[a-z_][a-z0-9_]{1,49}$/.test(code)) {
      return { valid: false, reason: '角色编码仅允许小写字母、数字和下划线，2-50字符' }
    }
    const where = { code }
    if (excludeId) where.id = { [Op.ne]: excludeId }
    const exists = await Role.count({ where })
    if (exists > 0) return { valid: false, reason: `角色编码"${code}"已存在` }
    return { valid: true }
  }

  validatePermissionAdaptability(roleLevel, permissions) {
    const issues = []
    for (const perm of permissions) {
      if (perm.requiredLevel > roleLevel) {
        issues.push({
          permissionId: perm.id,
          permissionName: perm.name,
          permissionCode: perm.code,
          reason: `权限"${perm.name}"所需角色层级(${perm.requiredLevel})高于当前角色层级(${roleLevel})`
        })
      }
    }
    return { valid: issues.length === 0, issues }
  }

  async checkMutexConflicts(permissionIds) {
    if (!permissionIds || permissionIds.length === 0) return { hasConflict: false, conflicts: [] }
    const permissions = await PermissionMenu.findAll({
      where: { id: { [Op.in]: permissionIds }, status: 'active' }
    })
    const mutexMap = {}
    const conflicts = []
    for (const perm of permissions) {
      if (perm.mutexGroup) {
        if (!mutexMap[perm.mutexGroup]) mutexMap[perm.mutexGroup] = []
        mutexMap[perm.mutexGroup].push(perm)
      }
    }
    for (const [group, perms] of Object.entries(mutexMap)) {
      if (perms.length > 1) {
        const groupDef = PermissionMenu.MUTEX_GROUPS[group]
        conflicts.push({
          mutexGroup: group,
          description: groupDef ? groupDef.description : `互斥组"${group}"内存在冲突权限`,
          permissions: perms.map(p => ({ id: p.id, name: p.name, code: p.code }))
        })
      }
    }
    return { hasConflict: conflicts.length > 0, conflicts }
  }

  checkSuperAdminProtection(role) {
    if (role.isSystem && role.type === 'super_admin') {
      return { protected: true, reason: '超级管理员权限禁止自定义修改' }
    }
    return { protected: false }
  }

  async checkBoundUsersForCorePermissionDelete(roleId, removingPermissionIds) {
    const boundUsers = await User.findAll({ where: { role: (await Role.findByPk(roleId))?.type, status: 'active' } })
    if (boundUsers.length === 0) return { allowed: true, boundUserCount: 0 }
    const corePerms = await PermissionMenu.findAll({
      where: { id: { [Op.in]: removingPermissionIds }, isCore: true }
    })
    if (corePerms.length === 0) return { allowed: true, boundUserCount: boundUsers.length }
    return {
      allowed: false,
      boundUserCount: boundUsers.length,
      corePermissions: corePerms.map(p => ({ id: p.id, name: p.name, code: p.code })),
      reason: `该角色已绑定${boundUsers.length}个活跃用户，禁止删除核心权限: ${corePerms.map(p => p.name).join('、')}`
    }
  }

  async createRole(data, operatorInfo = {}) {
    const nameCheck = await this.validateRoleName(data.name)
    if (!nameCheck.valid) throw ApiError.badRequest(nameCheck.reason)
    const codeCheck = await this.validateRoleCode(data.code)
    if (!codeCheck.valid) throw ApiError.badRequest(codeCheck.reason)
    const role = await Role.create({
      name: data.name.trim(),
      code: data.code.trim(),
      description: data.description || '',
      type: data.type || 'member',
      isSystem: false,
      level: data.level || 0,
      sort: data.sort || 0,
      status: 'active'
    })
    if (data.permissionIds && data.permissionIds.length > 0) {
      const permissions = await PermissionMenu.findAll({
        where: { id: { [Op.in]: data.permissionIds }, status: 'active' }
      })
      const adaptCheck = this.validatePermissionAdaptability(role.level, permissions)
      if (!adaptCheck.valid) {
        await role.destroy()
        throw ApiError.badRequest(`权限层级不匹配: ${adaptCheck.issues.map(i => i.reason).join('; ')}`)
      }
      const mutexCheck = await this.checkMutexConflicts(data.permissionIds)
      if (mutexCheck.hasConflict) {
        await role.destroy()
        throw ApiError.badRequest(`权限冲突: ${mutexCheck.conflicts.map(c => c.description).join('; ')}`)
      }
      const bulkData = permissions.map(p => ({
        roleId: role.id,
        permissionId: p.id,
        isCore: p.isCore
      }))
      await RolePermission.bulkCreate(bulkData)
    }
    await this._logChange(role.id, role.name, 'create', {
      added: data.permissionIds || [],
      removed: [],
      operatorInfo,
      snapshot: await this._getPermissionSnapshot(role.id)
    })
    return this.getRoleDetail(role.id)
  }

  async updateRolePermissions(roleId, data, operatorInfo = {}) {
    const role = await Role.findByPk(roleId)
    if (!role) throw ApiError.notFound('角色不存在')
    const protection = this.checkSuperAdminProtection(role)
    if (protection.protected) throw ApiError.forbidden(protection.reason)
    const currentPerms = await RolePermission.findAll({ where: { roleId } })
    const currentPermIds = currentPerms.map(rp => rp.permissionId)
    const newPermIds = data.permissionIds || []
    const addedIds = newPermIds.filter(id => !currentPermIds.includes(id))
    const removedIds = currentPermIds.filter(id => !newPermIds.includes(id))
    if (removedIds.length > 0) {
      const coreCheck = await this.checkBoundUsersForCorePermissionDelete(roleId, removedIds)
      if (!coreCheck.allowed) throw ApiError.badRequest(coreCheck.reason)
    }
    if (newPermIds.length > 0) {
      const permissions = await PermissionMenu.findAll({
        where: { id: { [Op.in]: newPermIds }, status: 'active' }
      })
      const adaptCheck = this.validatePermissionAdaptability(role.level, permissions)
      if (!adaptCheck.valid) throw ApiError.badRequest(`权限层级不匹配: ${adaptCheck.issues.map(i => i.reason).join('; ')}`)
      const mutexCheck = await this.checkMutexConflicts(newPermIds)
      if (mutexCheck.hasConflict) throw ApiError.badRequest(`权限冲突: ${mutexCheck.conflicts.map(c => c.description).join('; ')}`)
    }
    if (removedIds.length > 0) {
      await RolePermission.destroy({ where: { roleId, permissionId: { [Op.in]: removedIds } } })
    }
    if (addedIds.length > 0) {
      const perms = await PermissionMenu.findAll({ where: { id: { [Op.in]: addedIds } } })
      const bulkData = perms.map(p => ({
        roleId,
        permissionId: p.id,
        isCore: p.isCore
      }))
      await RolePermission.bulkCreate(bulkData, { ignoreDuplicates: true })
    }
    if (data.name && data.name !== role.name) {
      const nameCheck = await this.validateRoleName(data.name, roleId)
      if (!nameCheck.valid) throw ApiError.badRequest(nameCheck.reason)
      await role.update({ name: data.name.trim() })
    }
    if (data.description !== undefined) {
      await role.update({ description: data.description })
    }
    if (data.level !== undefined) {
      await role.update({ level: data.level })
    }
    await this._syncPermissionsToUsers(roleId, operatorInfo)
    await this._logChange(roleId, role.name, 'edit', {
      added: addedIds,
      removed: removedIds,
      operatorInfo,
      snapshot: await this._getPermissionSnapshot(roleId),
      reason: data.reason
    })
    return this.getRoleDetail(roleId)
  }

  async deleteRole(roleId, operatorInfo = {}) {
    const role = await Role.findByPk(roleId)
    if (!role) throw ApiError.notFound('角色不存在')
    if (role.isSystem) throw ApiError.forbidden('系统内置角色禁止删除')
    const boundUsers = await User.count({ where: { role: role.type } })
    if (boundUsers > 0) throw ApiError.badRequest(`该角色已绑定${boundUsers}个用户，请先解绑后再删除`)
    await RolePermission.destroy({ where: { roleId } })
    await this._logChange(roleId, role.name, 'delete', {
      added: [],
      removed: [],
      operatorInfo,
      snapshot: []
    })
    await role.destroy()
    return { success: true }
  }

  async getRoleList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = {}
    if (params.status) where.status = params.status
    if (params.type) where.type = params.type
    if (params.keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${params.keyword}%` } },
        { code: { [Op.like]: `%${params.keyword}%` } }
      ]
    }
    const { count, rows } = await Role.findAndCountAll({
      where,
      offset,
      limit,
      order: [['level', 'DESC'], ['sort', 'ASC'], ['id', 'ASC']]
    })
    const rolesWithCounts = await Promise.all(rows.map(async (role) => {
      const permCount = await RolePermission.count({ where: { roleId: role.id } })
      const boundUserCount = await User.count({ where: { role: role.type } })
      return { ...role.toJSON(), permCount, boundUserCount }
    }))
    return { list: rolesWithCounts, total: count, page, pageSize }
  }

  async getRoleDetail(roleId) {
    const role = await Role.findByPk(roleId)
    if (!role) throw ApiError.notFound('角色不存在')
    const rolePerms = await RolePermission.findAll({
      where: { roleId },
      include: [{ model: PermissionMenu, as: 'permission' }]
    })
    const boundUsers = await User.findAll({
      where: { role: role.type },
      attributes: ['id', 'uid', 'username', 'nickname', 'status']
    })
    return {
      ...role.toJSON(),
      permissions: rolePerms.map(rp => ({
        ...rp.permission.toJSON(),
        isCore: rp.isCore,
        rolePermissionId: rp.id
      })),
      boundUsers
    }
  }

  async getPermissionMenuTree(params = {}) {
    const where = { status: 'active' }
    if (params.module) where.module = params.module
    if (params.level) where.level = params.level
    const allPerms = await PermissionMenu.findAll({
      where,
      order: [['sort', 'ASC'], ['id', 'ASC']]
    })
    return this._buildTree(allPerms)
  }

  _buildTree(items, parentId = null) {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item.toJSON(),
        children: this._buildTree(items, item.id)
      }))
  }

  async getPermissionModules() {
    const modules = await PermissionMenu.findAll({
      where: { level: 'module', status: 'active' },
      order: [['sort', 'ASC']]
    })
    return modules
  }

  async batchCopyTemplate(sourceRoleId, targetRoleIds, operatorInfo = {}) {
    const sourceRole = await Role.findByPk(sourceRoleId)
    if (!sourceRole) throw ApiError.notFound('源角色不存在')
    const sourcePerms = await RolePermission.findAll({ where: { roleId: sourceRoleId } })
    const sourcePermIds = sourcePerms.map(rp => rp.permissionId)
    const results = { success: [], failed: [] }
    for (const targetId of targetRoleIds) {
      try {
        const targetRole = await Role.findByPk(targetId)
        if (!targetRole) {
          results.failed.push({ id: targetId, reason: '目标角色不存在' })
          continue
        }
        if (targetRole.isSystem && targetRole.type === 'super_admin') {
          results.failed.push({ id: targetId, reason: '超级管理员权限禁止修改' })
          continue
        }
        const permissions = await PermissionMenu.findAll({
          where: { id: { [Op.in]: sourcePermIds }, status: 'active' }
        })
        const adaptCheck = this.validatePermissionAdaptability(targetRole.level, permissions)
        if (!adaptCheck.valid) {
          results.failed.push({
            id: targetId,
            reason: `权限层级不匹配: ${adaptCheck.issues.map(i => i.reason).join('; ')}`
          })
          continue
        }
        await RolePermission.destroy({ where: { roleId: targetId } })
        const bulkData = sourcePerms.map(sp => ({
          roleId: targetId,
          permissionId: sp.permissionId,
          isCore: sp.isCore
        }))
        await RolePermission.bulkCreate(bulkData)
        await this._syncPermissionsToUsers(targetId, operatorInfo)
        await this._logChange(targetId, targetRole.name, 'batch_copy', {
          added: sourcePermIds,
          removed: [],
          operatorInfo,
          snapshot: await this._getPermissionSnapshot(targetId),
          batchId: `copy_${sourceRoleId}_${Date.now()}`
        })
        results.success.push({ id: targetId, name: targetRole.name })
      } catch (err) {
        results.failed.push({ id: targetId, reason: err.message })
      }
    }
    return results
  }

  async batchModifyPermissions(roleIds, permissionIds, operatorInfo = {}) {
    const corePerms = await PermissionMenu.findAll({
      where: { id: { [Op.in]: permissionIds }, isCore: true }
    })
    if (corePerms.length > 0) {
      throw ApiError.badRequest(`核心权限禁止批量修改: ${corePerms.map(p => p.name).join('、')}`)
    }
    const results = { success: [], failed: [] }
    const batchId = `batch_modify_${Date.now()}`
    for (const roleId of roleIds) {
      try {
        const role = await Role.findByPk(roleId)
        if (!role) {
          results.failed.push({ id: roleId, reason: '角色不存在' })
          continue
        }
        if (role.isSystem && role.type === 'super_admin') {
          results.failed.push({ id: roleId, reason: '超级管理员权限禁止修改' })
          continue
        }
        const currentPerms = await RolePermission.findAll({ where: { roleId } })
        const currentPermIds = currentPerms.map(rp => rp.permissionId)
        const currentCorePermIds = currentPerms.filter(rp => rp.isCore).map(rp => rp.permissionId)
        const newPermIds = [...new Set([...currentCorePermIds, ...permissionIds])]
        const removedIds = currentPermIds.filter(id => !newPermIds.includes(id))
        if (removedIds.length > 0) {
          await RolePermission.destroy({ where: { roleId, permissionId: { [Op.in]: removedIds } } })
        }
        const addedIds = permissionIds.filter(id => !currentPermIds.includes(id))
        if (addedIds.length > 0) {
          const perms = await PermissionMenu.findAll({ where: { id: { [Op.in]: addedIds } } })
          const adaptCheck = this.validatePermissionAdaptability(role.level, perms)
          if (!adaptCheck.valid) {
            results.failed.push({
              id: roleId,
              reason: `权限层级不匹配: ${adaptCheck.issues.map(i => i.reason).join('; ')}`
            })
            continue
          }
          const bulkData = perms.map(p => ({
            roleId,
            permissionId: p.id,
            isCore: p.isCore
          }))
          await RolePermission.bulkCreate(bulkData, { ignoreDuplicates: true })
        }
        await this._syncPermissionsToUsers(roleId, operatorInfo)
        await this._logChange(roleId, role.name, 'batch_modify', {
          added: addedIds,
          removed: removedIds,
          operatorInfo,
          snapshot: await this._getPermissionSnapshot(roleId),
          batchId
        })
        results.success.push({ id: roleId, name: role.name })
      } catch (err) {
        results.failed.push({ id: roleId, reason: err.message })
      }
    }
    return results
  }

  async traceRole(roleId) {
    const role = await Role.findByPk(roleId)
    if (!role) throw ApiError.notFound('角色不存在')
    const rolePerms = await RolePermission.findAll({
      where: { roleId },
      include: [{ model: PermissionMenu, as: 'permission' }]
    })
    const boundUsers = await User.findAll({
      where: { role: role.type },
      attributes: ['id', 'uid', 'username', 'nickname', 'status', 'createdAt']
    })
    const logs = await RolePermissionLog.findAll({
      where: { roleId },
      order: [['createdAt', 'DESC']],
      limit: 50
    })
    const compliance = await this._checkCompliance(role, rolePerms, boundUsers)
    return {
      role: role.toJSON(),
      permissions: rolePerms.map(rp => ({
        ...rp.permission.toJSON(),
        isCore: rp.isCore
      })),
      boundUsers,
      logs,
      compliance
    }
  }

  async _checkCompliance(role, rolePerms, boundUsers) {
    const issues = []
    const permIds = rolePerms.map(rp => rp.permissionId)
    const mutexCheck = await this.checkMutexConflicts(permIds)
    if (mutexCheck.hasConflict) {
      issues.push(...mutexCheck.conflicts.map(c => ({
        type: 'conflict',
        severity: 'high',
        description: c.description,
        fields: c.permissions.map(p => p.code)
      })))
    }
    const requiredModulePerms = await PermissionMenu.findAll({
      where: { level: 'module', status: 'active' }
    })
    const assignedModuleIds = new Set(
      (await PermissionMenu.findAll({
        where: { id: { [Op.in]: permIds } },
        attributes: ['parentId']
      })).filter(p => p.parentId).map(p => p.parentId)
    )
    const missingModules = requiredModulePerms.filter(m => !assignedModuleIds.has(m.id) && m.requiredLevel <= role.level)
    if (missingModules.length > 0) {
      issues.push(...missingModules.map(m => ({
        type: 'missing',
        severity: 'medium',
        description: `缺少模块级权限: ${m.name}`,
        fields: [m.code]
      })))
    }
    const allActivePerms = await PermissionMenu.findAll({ where: { status: 'active' } })
    const redundantPerms = rolePerms.filter(rp => {
      const perm = allActivePerms.find(p => p.id === rp.permissionId)
      return perm && perm.requiredLevel > role.level
    })
    if (redundantPerms.length > 0) {
      issues.push({
        type: 'redundant',
        severity: 'low',
        description: `存在${redundantPerms.length}个权限超出角色层级适配范围`,
        fields: redundantPerms.map(rp => {
          const p = allActivePerms.find(pm => pm.id === rp.permissionId)
          return p ? p.code : rp.permissionId
        })
      })
    }
    const score = Math.max(0, 100 - issues.reduce((sum, i) => {
      return sum + (i.severity === 'high' ? 30 : i.severity === 'medium' ? 15 : 5)
    }, 0))
    return {
      score,
      consistent: issues.filter(i => i.severity === 'high').length === 0,
      issues
    }
  }

  async getPermissionLogs(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = {}
    if (params.roleId) where.roleId = params.roleId
    if (params.changeType) where.changeType = params.changeType
    if (params.operatorId) where.operatorId = params.operatorId
    if (params.startTime && params.endTime) {
      where.createdAt = { [Op.between]: [params.startTime, params.endTime] }
    }
    const { count, rows } = await RolePermissionLog.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    })
    return { list: rows, total: count, page, pageSize }
  }

  async validatePermissionConfig(roleId, permissionIds) {
    const role = await Role.findByPk(roleId)
    if (!role) throw ApiError.notFound('角色不存在')
    const protection = this.checkSuperAdminProtection(role)
    if (protection.protected) {
      return { valid: false, errors: [protection.reason], conflicts: [], adaptIssues: [] }
    }
    const permissions = await PermissionMenu.findAll({
      where: { id: { [Op.in]: permissionIds }, status: 'active' }
    })
    const adaptCheck = this.validatePermissionAdaptability(role.level, permissions)
    const mutexCheck = await this.checkMutexConflicts(permissionIds)
    const errors = []
    if (!adaptCheck.valid) errors.push(...adaptCheck.issues.map(i => i.reason))
    if (mutexCheck.hasConflict) errors.push(...mutexCheck.conflicts.map(c => c.description))
    return {
      valid: errors.length === 0,
      errors,
      conflicts: mutexCheck.conflicts,
      adaptIssues: adaptCheck.issues
    }
  }

  async _syncPermissionsToUsers(roleId, operatorInfo = {}) {
    const role = await Role.findByPk(roleId)
    if (!role) return
    const boundUsers = await User.findAll({ where: { role: role.type } })
    await this._logChange(roleId, role.name, 'sync', {
      added: [],
      removed: [],
      operatorInfo,
      snapshot: await this._getPermissionSnapshot(roleId),
      affectedUserIds: boundUsers.map(u => u.id),
      reason: '权限变更自动同步'
    })
  }

  async _getPermissionSnapshot(roleId) {
    const rps = await RolePermission.findAll({
      where: { roleId },
      include: [{ model: PermissionMenu, as: 'permission', attributes: ['id', 'name', 'code'] }]
    })
    return rps.map(rp => ({
      permissionId: rp.permissionId,
      isCore: rp.isCore,
      name: rp.permission?.name,
      code: rp.permission?.code
    }))
  }

  async _logChange(roleId, roleName, changeType, options = {}) {
    const {
      added = [],
      removed = [],
      operatorInfo = {},
      snapshot = [],
      affectedUserIds = [],
      batchId = null,
      reason = '',
      conflictResolution = null
    } = options
    await RolePermissionLog.create({
      roleId,
      roleName,
      changeType,
      addedPermissions: added,
      removedPermissions: removed,
      permissionSnapshot: snapshot,
      conflictResolution,
      affectedUserIds,
      batchId,
      operatorId: operatorInfo.id,
      operatorName: operatorInfo.username,
      operatorRole: operatorInfo.role,
      reason,
      ip: operatorInfo.ip
    })
  }

  async initDefaultData() {
    const roleCount = await Role.count()
    if (roleCount > 0) return
    const defaultRoles = [
      { name: '超级管理员', code: 'super_admin', type: 'super_admin', isSystem: true, level: 100, sort: 1 },
      { name: '管理员', code: 'admin', type: 'admin', isSystem: true, level: 80, sort: 2 },
      { name: '审核员', code: 'auditor', type: 'auditor', isSystem: true, level: 60, sort: 3 },
      { name: '运营员', code: 'operator', type: 'operator', isSystem: true, level: 40, sort: 4 },
      { name: '普通用户', code: 'member', type: 'member', isSystem: true, level: 0, sort: 5 }
    ]
    await Role.bulkCreate(defaultRoles)
    const defaultMenus = [
      { name: '数据概览', code: 'dashboard', parentId: null, level: 'module', module: 'dashboard', isCore: true, requiredLevel: 0, sort: 1 },
      { name: '查看概览', code: 'dashboard:view', parentId: 1, level: 'page', module: 'dashboard', isCore: true, requiredLevel: 0, sort: 1 },
      { name: '影像资源', code: 'resource', parentId: null, level: 'module', module: 'resource', isCore: true, requiredLevel: 0, sort: 2 },
      { name: '查看资源', code: 'resource:view', parentId: 2, level: 'page', module: 'resource', isCore: true, requiredLevel: 0, sort: 1 },
      { name: '创建资源', code: 'resource:create', parentId: 2, level: 'action', module: 'resource', isCore: false, requiredLevel: 0, sort: 2 },
      { name: '编辑资源', code: 'resource:edit', parentId: 2, level: 'action', module: 'resource', isCore: false, requiredLevel: 20, sort: 3 },
      { name: '删除资源', code: 'resource:delete', parentId: 2, level: 'action', module: 'resource', isCore: false, requiredLevel: 60, sort: 4 },
      { name: '发布资源', code: 'resource:publish', parentId: 2, level: 'action', module: 'resource', isCore: true, requiredLevel: 40, mutexGroup: 'resource_publish', sort: 5 },
      { name: '下架资源', code: 'resource:offline', parentId: 2, level: 'action', module: 'resource', isCore: true, requiredLevel: 60, mutexGroup: 'resource_publish', sort: 6 },
      { name: '内容审核', code: 'audit', parentId: null, level: 'module', module: 'audit', isCore: true, requiredLevel: 40, sort: 3 },
      { name: '查看审核', code: 'audit:view', parentId: 10, level: 'page', module: 'audit', isCore: true, requiredLevel: 40, sort: 1 },
      { name: '审核通过', code: 'audit:approve', parentId: 10, level: 'action', module: 'audit', isCore: true, requiredLevel: 60, mutexGroup: 'audit_approve', sort: 2 },
      { name: '审核拒绝', code: 'audit:reject', parentId: 10, level: 'action', module: 'audit', isCore: true, requiredLevel: 60, mutexGroup: 'audit_approve', sort: 3 },
      { name: '用户管理', code: 'user', parentId: null, level: 'module', module: 'user', isCore: true, requiredLevel: 40, sort: 4 },
      { name: '查看用户', code: 'user:view', parentId: 14, level: 'page', module: 'user', isCore: true, requiredLevel: 40, sort: 1 },
      { name: '编辑用户', code: 'user:edit', parentId: 14, level: 'action', module: 'user', isCore: false, requiredLevel: 60, sort: 2 },
      { name: '封禁用户', code: 'user:ban', parentId: 14, level: 'action', module: 'user', isCore: true, requiredLevel: 80, mutexGroup: 'user_ban', sort: 3 },
      { name: '激活用户', code: 'user:active', parentId: 14, level: 'action', module: 'user', isCore: true, requiredLevel: 80, mutexGroup: 'user_ban', sort: 4 },
      { name: '系统设置', code: 'settings', parentId: null, level: 'module', module: 'settings', isCore: true, requiredLevel: 80, sort: 5 },
      { name: '查看设置', code: 'settings:view', parentId: 19, level: 'page', module: 'settings', isCore: true, requiredLevel: 80, sort: 1 },
      { name: '修改设置', code: 'settings:edit', parentId: 19, level: 'action', module: 'settings', isCore: true, requiredLevel: 100, sort: 2 },
      { name: '操作日志', code: 'log', parentId: null, level: 'module', module: 'log', isCore: true, requiredLevel: 60, sort: 6 },
      { name: '查看日志', code: 'log:view', parentId: 22, level: 'page', module: 'log', isCore: true, requiredLevel: 60, sort: 1 },
      { name: '角色权限', code: 'role_permission', parentId: null, level: 'module', module: 'role_permission', isCore: true, requiredLevel: 80, sort: 7 },
      { name: '查看角色权限', code: 'role_permission:view', parentId: 24, level: 'page', module: 'role_permission', isCore: true, requiredLevel: 80, sort: 1 },
      { name: '编辑角色权限', code: 'role_permission:edit', parentId: 24, level: 'action', module: 'role_permission', isCore: true, requiredLevel: 100, sort: 2 }
    ]
    const createdMenus = []
    for (const menu of defaultMenus) {
      const { parentId, ...menuData } = menu
      createdMenus.push(await PermissionMenu.create(menuData))
    }
    const superAdminRole = await Role.findOne({ where: { code: 'super_admin' } })
    if (superAdminRole) {
      const allPermIds = createdMenus.map(m => m.id)
      await RolePermission.bulkCreate(
        allPermIds.map(pid => ({
          roleId: superAdminRole.id,
          permissionId: pid,
          isCore: true
        }))
      )
    }
    const adminRole = await Role.findOne({ where: { code: 'admin' } })
    if (adminRole) {
      const adminPermIds = createdMenus
        .filter(m => m.requiredLevel <= 80)
        .map(m => m.id)
      await RolePermission.bulkCreate(
        adminPermIds.map(pid => ({
          roleId: adminRole.id,
          permissionId: pid,
          isCore: createdMenus.find(cm => cm.id === pid)?.isCore || false
        }))
      )
    }
  }
}

module.exports = new RolePermissionService()
