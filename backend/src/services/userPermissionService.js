const { User, UserPermission, UserPermissionLog, Role, RolePermission, PermissionMenu } = require('../models')
const { Op } = require('sequelize')
const { getPagination } = require('../utils/common')
const ApiError = require('../utils/apiError')

const BLOCKED_STATUS = ['banned', 'frozen', 'disabled']
const ACTIVE_STATUS = ['active', 'pending']

class UserPermissionService {
  validateUserStatus(user) {
    if (!user) return { valid: false, reason: '用户不存在', level: 'error' }
    if (BLOCKED_STATUS.includes(user.status)) {
      return {
        valid: false,
        reason: `账号状态为"${user.status}"，禁止进行权限分配操作`,
        level: 'error',
        status: user.status
      }
    }
    if (user.status !== 'active') {
      return {
        valid: true,
        reason: `账号状态为"${user.status}"，权限将在激活后生效`,
        level: 'warning',
        status: user.status
      }
    }
    return { valid: true, level: 'success' }
  }

  async validateRolePermissionMatch(user, roleId, additionalPermIds = []) {
    const issues = []
    const role = await Role.findByPk(roleId)
    if (!role) {
      issues.push({ type: 'role_missing', level: 'error', reason: '目标角色不存在' })
      return { valid: false, matchScore: 0, issues }
    }
    if (role.requiredLevel !== undefined && user.level !== undefined && user.level < role.requiredLevel) {
      issues.push({
        type: 'level_mismatch',
        level: 'warning',
        reason: `用户层级(${user.level})低于角色所需层级(${role.requiredLevel})`
      })
    }
    const rolePerms = await RolePermission.findAll({
      where: { roleId },
      include: [{ model: PermissionMenu, as: 'permission' }]
    })
    const allPermIds = [
      ...rolePerms.map(rp => rp.permissionId),
      ...additionalPermIds
    ]
    const mutexMap = {}
    rolePerms.forEach(rp => {
      const perm = rp.permission
      if (perm && perm.mutexGroup) {
        if (!mutexMap[perm.mutexGroup]) mutexMap[perm.mutexGroup] = []
        mutexMap[perm.mutexGroup].push({ id: perm.id, name: perm.name, code: perm.code })
      }
    })
    for (const groupPermId of additionalPermIds) {
      const perm = await PermissionMenu.findByPk(groupPermId)
      if (perm && perm.mutexGroup) {
        if (!mutexMap[perm.mutexGroup]) mutexMap[perm.mutexGroup] = []
        mutexMap[perm.mutexGroup].push({ id: perm.id, name: perm.name, code: perm.code })
      }
    }
    for (const [group, perms] of Object.entries(mutexMap)) {
      if (perms.length > 1) {
        const groupDef = PermissionMenu.MUTEX_GROUPS[group]
        issues.push({
          type: 'conflict',
          level: 'error',
          reason: groupDef ? groupDef.description : `互斥组"${group}"存在冲突`,
          mutexGroup: group,
          permissions: perms
        })
      }
    }
    const errorCount = issues.filter(i => i.level === 'error').length
    const warningCount = issues.filter(i => i.level === 'warning').length
    const matchScore = Math.max(0, 100 - errorCount * 30 - warningCount * 10)
    return {
      valid: errorCount === 0,
      matchScore,
      issues,
      roleName: role.name,
      permCount: new Set(allPermIds).size
    }
  }

  async validatePermissionUniqueness(userId, permIds, source = 'direct_assign') {
    const duplicates = []
    const overreach = []
    const redundant = []
    const existingPerms = await UserPermission.findAll({
      where: { userId, permissionId: { [Op.in]: permIds }, source }
    })
    existingPerms.forEach(ep => duplicates.push(ep.permissionId))
    const user = await User.findByPk(userId, { include: [{ model: Role, as: 'roleInfo' }] })
    const operatorLevel = 100
    for (const permId of permIds) {
      const perm = await PermissionMenu.findByPk(permId)
      if (perm) {
        if (perm.requiredLevel > operatorLevel) {
          overreach.push({ permissionId: permId, permissionName: perm.name, requiredLevel: perm.requiredLevel })
        }
      }
    }
    const rolePerms = []
    if (user) {
      const role = await Role.findOne({ where: { type: user.role } })
      if (role) {
        const rps = await RolePermission.findAll({ where: { roleId: role.id } })
        for (const rp of rps) {
          if (permIds.includes(rp.permissionId) && source !== 'role_inherit') {
            const pm = await PermissionMenu.findByPk(rp.permissionId)
            redundant.push({
              permissionId: rp.permissionId,
              permissionName: pm?.name,
              reason: '该权限已通过角色继承'
            })
          }
          rolePerms.push(rp.permissionId)
        }
      }
    }
    return {
      duplicates,
      overreach,
      redundant,
      valid: duplicates.length === 0 && overreach.length === 0
    }
  }

  async getUserPermissionList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const userWhere = {}
    if (params.keyword) {
      userWhere[Op.or] = [
        { username: { [Op.like]: `%${params.keyword}%` } },
        { nickname: { [Op.like]: `%${params.keyword}%` } },
        { uid: { [Op.like]: `%${params.keyword}%` } }
      ]
    }
    if (params.status && params.status !== 'all') {
      userWhere.status = params.status
    }
    if (params.role && params.role !== 'all') {
      userWhere.role = params.role
    }
    const { count, rows } = await User.findAndCountAll({
      where: userWhere,
      offset,
      limit,
      order: [['id', 'DESC']]
    })
    const enriched = await Promise.all(rows.map(async (user) => {
      const role = await Role.findOne({ where: { type: user.role } })
      const directPerms = await UserPermission.count({ where: { userId: user.id, source: 'direct_assign' } })
      const rolePerms = role ? await RolePermission.count({ where: { roleId: role.id } }) : 0
      const totalPerms = directPerms + rolePerms
      const statusCheck = this.validateUserStatus(user)
      return {
        ...user.toJSON(),
        roleId: role?.id || null,
        roleName: role?.name || user.role,
        directPermCount: directPerms,
        rolePermCount: rolePerms,
        totalPermCount: totalPerms,
        statusCheck: statusCheck
      }
    }))
    return { list: enriched, total: count, page, pageSize }
  }

  async getUserPermissionDetail(userId) {
    const user = await User.findByPk(userId)
    if (!user) throw ApiError.notFound('用户不存在')
    const role = await Role.findOne({ where: { type: user.role } })
    const rolePerms = role ? await RolePermission.findAll({
      where: { roleId: role.id },
      include: [{ model: PermissionMenu, as: 'permission' }]
    }) : []
    const directPerms = await UserPermission.findAll({
      where: { userId, source: { [Op.ne]: 'role_inherit' } },
      include: [{ model: PermissionMenu, as: 'permission' }]
    })
    const roleInheritedPerms = await UserPermission.findAll({
      where: { userId, source: 'role_inherit' },
      include: [{ model: PermissionMenu, as: 'permission' }]
    })
    const overridePerms = directPerms.filter(p => p.isOverride)
    const denyPerms = overridePerms.filter(p => p.overrideType === 'deny')
    const grantPerms = overridePerms.filter(p => p.overrideType === 'grant')
    const statusCheck = this.validateUserStatus(user)
    return {
      user: user.toJSON(),
      statusCheck,
      role: role ? role.toJSON() : null,
      rolePermissions: rolePerms.map(rp => rp.permission?.toJSON() || null).filter(Boolean),
      directPermissions: directPerms.map(dp => ({
        ...(dp.permission?.toJSON() || {}),
        userPermissionId: dp.id,
        source: dp.source,
        isCore: dp.isCore,
        isOverride: dp.isOverride,
        overrideType: dp.overrideType,
        expiresAt: dp.expiresAt
      })),
      roleInheritedPermissions: roleInheritedPerms.map(rp => rp.permission?.toJSON() || null).filter(Boolean),
      overridePermissions: overridePerms.map(op => ({
        ...(op.permission?.toJSON() || {}),
        userPermissionId: op.id,
        overrideType: op.overrideType
      })),
      denyPermissions: denyPerms.map(dp => ({
        ...(dp.permission?.toJSON() || {}),
        userPermissionId: dp.id
      })),
      grantExtraPermissions: grantPerms.map(gp => ({
        ...(gp.permission?.toJSON() || {}),
        userPermissionId: gp.id
      }))
    }
  }

  async assignRoleToUser(userId, roleId, operatorInfo = {}) {
    const user = await User.findByPk(userId)
    if (!user) throw ApiError.notFound('用户不存在')
    const statusCheck = this.validateUserStatus(user)
    if (!statusCheck.valid) throw ApiError.badRequest(statusCheck.reason)
    const role = await Role.findByPk(roleId)
    if (!role) throw ApiError.notFound('目标角色不存在')
    const oldRole = await Role.findOne({ where: { type: user.role } })
    const oldRoleId = oldRole?.id || null
    const oldRoleName = oldRole?.name || null
    if (role.isSystem && role.type === 'super_admin') {
      throw ApiError.forbidden('超级管理员角色仅可由系统分配')
    }
    if (oldRole && oldRole.isSystem && oldRole.type === 'super_admin') {
      throw ApiError.forbidden('超级管理员角色禁止修改')
    }
    const matchCheck = await this.validateRolePermissionMatch(user, roleId)
    if (!matchCheck.valid) {
      const errors = matchCheck.issues.filter(i => i.level === 'error').map(i => i.reason)
      if (errors.length) throw ApiError.badRequest(`角色权限校验失败: ${errors.join('; ')}`)
    }
    await UserPermission.destroy({ where: { userId, source: 'role_inherit' } })
    const rolePerms = await RolePermission.findAll({ where: { roleId } })
    if (rolePerms.length) {
      const bulkData = rolePerms.map(rp => ({
        userId,
        permissionId: rp.permissionId,
        roleId,
        source: 'role_inherit',
        isCore: rp.isCore,
        isOverride: false
      }))
      await UserPermission.bulkCreate(bulkData, { ignoreDuplicates: true })
    }
    const oldRoleType = user.role
    await user.update({ role: role.type })
    await this._logChange(userId, user, 'assign_role', {
      oldRoleId, newRoleId: roleId, oldRoleName, newRoleName: role.name,
      added: rolePerms.map(rp => rp.permissionId), removed: [],
      operatorInfo, tookEffect: true,
      reason: `切换角色: ${oldRoleName || '无'} → ${role.name}`
    })
    return this.getUserPermissionDetail(userId)
  }

  async addDirectPermissions(userId, permIds, options = {}) {
    const { source = 'direct_assign', expiresAt = null, operatorInfo = {}, roleId = null } = options
    const user = await User.findByPk(userId)
    if (!user) throw ApiError.notFound('用户不存在')
    const statusCheck = this.validateUserStatus(user)
    if (!statusCheck.valid) throw ApiError.badRequest(statusCheck.reason)
    const uniqueCheck = await this.validatePermissionUniqueness(userId, permIds, source)
    const checkResults = []
    const validPermIds = []
    for (const pid of permIds) {
      const perm = await PermissionMenu.findByPk(pid)
      if (uniqueCheck.duplicates.includes(pid)) {
        checkResults.push({ permissionId: pid, permissionName: perm?.name, result: 'duplicate', reason: '重复分配' })
      } else if (uniqueCheck.overreach.find(o => o.permissionId === pid)) {
        checkResults.push({ permissionId: pid, permissionName: perm?.name, result: 'overreach', reason: '越权配置' })
      } else if (uniqueCheck.redundant.find(r => r.permissionId === pid)) {
        checkResults.push({ permissionId: pid, permissionName: perm?.name, result: 'redundant', reason: '权限冗余(角色已继承)' })
        validPermIds.push(pid)
      } else {
        checkResults.push({ permissionId: pid, permissionName: perm?.name, result: 'pass', reason: '通过' })
        validPermIds.push(pid)
      }
    }
    const blocked = uniqueCheck.overreach.find(o => o.permissionId === pid)
    if (blocked && !options.allowOverreach) {
      // 不抛错，而是返回过滤后的结果，前端展示拦截详情
    }
    const addedIds = []
    for (const pid of validPermIds) {
      const perm = await PermissionMenu.findByPk(pid)
      if (!perm) continue
      const existing = await UserPermission.findOne({ where: { userId, permissionId: pid, source } })
      if (existing) {
        if (expiresAt) await existing.update({ expiresAt })
        continue
      }
      await UserPermission.create({
        userId,
        permissionId: pid,
        roleId,
        source,
        isCore: perm.isCore,
        isOverride: false,
        expiresAt
      })
      addedIds.push(pid)
    }
    await this._logChange(userId, user, 'add_perm', {
      added: addedIds, removed: [], checkResults,
      operatorInfo, tookEffect: true,
      reason: options.reason || `直接分配${addedIds.length}个权限`
    })
    return {
      addedIds,
      checkResults,
      totalRequested: permIds.length,
      totalAdded: addedIds.length,
      totalBlocked: checkResults.filter(r => r.result === 'duplicate' || r.result === 'overreach').length
    }
  }

  async removeDirectPermissions(userId, permIds, options = {}) {
    const { operatorInfo = {} } = options
    const user = await User.findByPk(userId)
    if (!user) throw ApiError.notFound('用户不存在')
    const statusCheck = this.validateUserStatus(user)
    if (!statusCheck.valid && statusCheck.level === 'error') {
      throw ApiError.badRequest(statusCheck.reason)
    }
    const corePerms = []
    const permsToDelete = []
    for (const pid of permIds) {
      const up = await UserPermission.findOne({
        where: { userId, permissionId: pid, source: { [Op.ne]: 'role_inherit' } }
      })
      if (!up) continue
      if (up.isCore && up.source === 'direct_assign') {
        const boundCount = 1
        if (boundCount > 0) {
          corePerms.push({ permissionId: pid, reason: '核心权限不可删除' })
          continue
        }
      }
      permsToDelete.push(pid)
    }
    if (corePerms.length > 0 && !options.forceRemove) {
      throw ApiError.badRequest(`存在${corePerms.length}个核心权限禁止删除`)
    }
    if (permsToDelete.length > 0) {
      await UserPermission.destroy({
        where: {
          userId,
          permissionId: { [Op.in]: permsToDelete },
          source: { [Op.ne]: 'role_inherit' }
        }
      })
    }
    await this._logChange(userId, user, 'remove_perm', {
      added: [], removed: permsToDelete,
      operatorInfo, tookEffect: true,
      reason: options.reason || `移除${permsToDelete.length}个权限`
    })
    return {
      removedIds: permsToDelete,
      coreBlocked: corePerms,
      totalRequested: permIds.length,
      totalRemoved: permsToDelete.length
    }
  }

  async batchAssign(params, operatorInfo = {}) {
    const { userIds, roleId = null, permissionIds = [], reason = '' } = params
    const results = { success: [], failed: [], skipped: [], total: userIds.length }
    const batchId = `batch_${Date.now()}`
    const targetRole = roleId ? await Role.findByPk(roleId) : null
    let filteredPermIds = permissionIds
    if (targetRole) {
      const rolePermIds = (await RolePermission.findAll({ where: { roleId } })).map(rp => rp.permissionId)
      const corePerms = (await PermissionMenu.findAll({
        where: { id: { [Op.in]: permissionIds }, isCore: true }
      })).map(p => p.id)
      filteredPermIds = permissionIds.filter(pid => !corePerms.includes(pid) || rolePermIds.includes(pid))
    }
    for (const uid of userIds) {
      try {
        const user = await User.findByPk(uid)
        if (!user) {
          results.failed.push({ userId: uid, reason: '用户不存在' })
          continue
        }
        const statusCheck = this.validateUserStatus(user)
        if (!statusCheck.valid) {
          results.skipped.push({ userId: uid, username: user.username, reason: statusCheck.reason })
          continue
        }
        if (targetRole) {
          if (targetRole.isSystem && targetRole.type === 'super_admin') {
            results.failed.push({ userId: uid, username: user.username, reason: '超级管理员角色不可批量分配' })
            continue
          }
          if (user.role === 'super_admin') {
            results.skipped.push({ userId: uid, username: user.username, reason: '超级管理员账号跳过' })
            continue
          }
        }
        let addedPerms = []
        if (targetRole) {
          await UserPermission.destroy({ where: { userId: uid, source: 'role_inherit' } })
          const rolePerms = await RolePermission.findAll({ where: { roleId } })
          const bulkData = rolePerms.map(rp => ({
            userId: uid, permissionId: rp.permissionId, roleId,
            source: 'role_inherit', isCore: rp.isCore, isOverride: false
          }))
          await UserPermission.bulkCreate(bulkData, { ignoreDuplicates: true })
          addedPerms = rolePerms.map(rp => rp.permissionId)
          const oldRole = await Role.findOne({ where: { type: user.role } })
          const oldRoleName = oldRole?.name
          await user.update({ role: targetRole.type })
          await this._logChange(uid, user, 'batch_assign', {
            oldRoleId: oldRole?.id || null, newRoleId: roleId,
            oldRoleName, newRoleName: targetRole.name,
            added: addedPerms, removed: [], operatorInfo,
            tookEffect: true, reason: reason || `批量分配角色: ${oldRoleName || '无'} → ${targetRole.name}`,
            batchId
          })
        }
        if (filteredPermIds.length > 0) {
          const res = await this.addDirectPermissions(uid, filteredPermIds, {
            source: 'batch_assign', operatorInfo, roleId, reason
          })
          addedPerms = [...addedPerms, ...res.addedIds]
        }
        results.success.push({ userId: uid, username: user.username, permCount: new Set(addedPerms).size })
      } catch (err) {
        results.failed.push({ userId: uid, reason: err.message })
      }
    }
    results.batchId = batchId
    return results
  }

  async traceUserPermissions(userId) {
    const user = await User.findByPk(userId)
    if (!user) throw ApiError.notFound('用户不存在')
    const detail = await this.getUserPermissionDetail(userId)
    const logs = await UserPermissionLog.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 100
    })
    const allPerms = [
      ...(detail.rolePermissions || []),
      ...(detail.directPermissions || [])
    ]
    const checkResults = await this._doFullPermissionCheck(user, detail, logs)
    return {
      user: detail.user,
      role: detail.role,
      statusCheck: detail.statusCheck,
      rolePermissions: detail.rolePermissions,
      directPermissions: detail.directPermissions,
      overridePermissions: detail.overridePermissions,
      logs,
      validation: checkResults
    }
  }

  async _doFullPermissionCheck(user, detail, logs) {
    const issues = []
    const rolePermIds = (detail.rolePermissions || []).map(p => p.id)
    const directPermIds = (detail.directPermissions || []).map(p => p.id)
    const allPermIds = [...new Set([...rolePermIds, ...directPermIds])]
    const duplicates = new Set()
    const idSet = new Set()
    for (const pid of allPermIds) {
      if (idSet.has(pid)) duplicates.add(pid)
      idSet.add(pid)
    }
    duplicates.forEach(pid => {
      const perm = (detail.rolePermissions || []).find(p => p.id === pid) ||
                   (detail.directPermissions || []).find(p => p.id === pid)
      issues.push({
        type: 'duplicate',
        severity: 'medium',
        description: `重复权限: ${perm?.name || '#' + pid}`,
        permissionId: pid,
        permissionName: perm?.name
      })
    })
    const mutexMap = {}
    const allPermObjects = [
      ...(detail.rolePermissions || []),
      ...(detail.directPermissions || [])
    ]
    allPermObjects.forEach(p => {
      if (p.mutexGroup) {
        if (!mutexMap[p.mutexGroup]) mutexMap[p.mutexGroup] = []
        mutexMap[p.mutexGroup].push(p)
      }
    })
    for (const [group, perms] of Object.entries(mutexMap)) {
      if (perms.length > 1) {
        const groupDef = PermissionMenu.MUTEX_GROUPS[group]
        issues.push({
          type: 'conflict',
          severity: 'high',
          description: groupDef?.description || `互斥组${group}存在冲突`,
          permissions: perms.map(p => ({ id: p.id, name: p.name, code: p.code }))
        })
      }
    }
    const operatorLevel = 100
    allPermObjects.forEach(p => {
      if (p.requiredLevel > operatorLevel) {
        issues.push({
          type: 'overreach',
          severity: 'high',
          description: `越权配置: ${p.name}(所需层级${p.requiredLevel})`,
          permissionId: p.id,
          permissionName: p.name
        })
      }
    })
    const redundant = []
    const directPermSet = new Set(directPermIds)
    rolePermIds.forEach(rpid => {
      if (directPermSet.has(rpid)) redundant.push(rpid)
    })
    redundant.forEach(pid => {
      const perm = (detail.rolePermissions || []).find(p => p.id === pid)
      issues.push({
        type: 'redundant',
        severity: 'low',
        description: `冗余权限: ${perm?.name || '#' + pid}(同时存在于角色与直接分配)`,
        permissionId: pid,
        permissionName: perm?.name
      })
    })
    const coreCount = allPermObjects.filter(p => p.isCore).length
    const requiredModules = ['dashboard', 'user']
    const assignedModules = new Set(allPermObjects.map(p => p.module))
    requiredModules.forEach(m => {
      if (!assignedModules.has(m)) {
        issues.push({
          type: 'missing',
          severity: 'low',
          description: `缺少模块: ${m}`,
          module: m
        })
      }
    })
    const score = Math.max(0, 100 - issues.reduce((sum, i) => {
      return sum + (i.severity === 'high' ? 25 : i.severity === 'medium' ? 10 : 5)
    }, 0))
    return {
      score,
      consistent: issues.filter(i => i.severity === 'high').length === 0,
      duplicateCount: duplicates.size,
      conflictCount: issues.filter(i => i.severity === 'high' && i.type === 'conflict').length,
      overreachCount: issues.filter(i => i.type === 'overreach').length,
      redundantCount: redundant.length,
      corePermissionCount: coreCount,
      totalPermissionCount: allPermIds.length,
      issues
    }
  }

  async getPermissionLogs(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = {}
    if (params.userId) where.userId = params.userId
    if (params.changeType) where.changeType = params.changeType
    if (params.operatorId) where.operatorId = params.operatorId
    if (params.startTime && params.endTime) {
      where.createdAt = { [Op.between]: [params.startTime, params.endTime] }
    }
    const { count, rows } = await UserPermissionLog.findAndCountAll({
      where, offset, limit, order: [['createdAt', 'DESC']]
    })
    return { list: rows, total: count, page, pageSize }
  }

  async cleanRedundantPermissions(userId, operatorInfo = {}) {
    const detail = await this.getUserPermissionDetail(userId)
    const rolePermIds = (detail.rolePermissions || []).map(p => p.id)
    const redundantPerms = (detail.directPermissions || []).filter(p =>
      rolePermIds.includes(p.id) && p.source === 'direct_assign' && !p.isCore
    )
    const removedIds = []
    for (const rp of redundantPerms) {
      await UserPermission.destroy({ where: { id: rp.userPermissionId } })
      removedIds.push(rp.id)
    }
    const user = await User.findByPk(userId)
    await this._logChange(userId, user, 'sync', {
      added: [], removed: removedIds, operatorInfo, tookEffect: true,
      reason: `清理${removedIds.length}个冗余权限`
    })
    return { cleanedCount: removedIds.length, removedIds, cleanedPermissions: redundantPerms }
  }

  async getAllRoles() {
    const roles = await Role.findAll({
      where: { status: 'active' },
      order: [['level', 'DESC'], ['sort', 'ASC']]
    })
    return roles
  }

  async getAllUsersForSelect(params = {}) {
    const where = { status: { [Op.in]: ACTIVE_STATUS } }
    if (params.keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${params.keyword}%` } },
        { nickname: { [Op.like]: `%${params.keyword}%` } },
        { uid: { [Op.like]: `%${params.keyword}%` } }
      ]
    }
    if (params.role && params.role !== 'all') where.role = params.role
    const users = await User.findAll({
      where,
      limit: 50,
      order: [['id', 'DESC']]
    })
    return users.map(u => {
      const statusCheck = this.validateUserStatus(u)
      return {
        id: u.id, uid: u.uid, username: u.username, nickname: u.nickname,
        role: u.role, status: u.status, level: u.level,
        statusCheck, blocked: !statusCheck.valid
      }
    })
  }

  async _logChange(userId, user, changeType, options = {}) {
    const {
      oldRoleId = null, newRoleId = null, oldRoleName = null, newRoleName = null,
      added = [], removed = [], overridePermissions = [], checkResults = [],
      operatorInfo = {}, snapshot = null, batchId = null,
      reason = '', tookEffect = false
    } = options
    let permSnapshot = snapshot
    if (!permSnapshot) {
      const allPerms = await UserPermission.findAll({
        where: { userId },
        include: [{ model: PermissionMenu, as: 'permission', attributes: ['id', 'name', 'code', 'isCore'] }]
      })
      permSnapshot = allPerms.map(up => ({
        id: up.id,
        permissionId: up.permissionId,
        source: up.source,
        isCore: up.isCore || up.permission?.isCore,
        name: up.permission?.name,
        code: up.permission?.code
      }))
    }
    await UserPermissionLog.create({
      userId,
      userUid: user.uid,
      userName: user.username || user.nickname,
      changeType,
      oldRoleId,
      newRoleId,
      oldRoleName,
      newRoleName,
      addedPermissions: added.map(id => {
        const perm = (permSnapshot || []).find(p => p.permissionId === id)
        return { id, name: perm?.name, code: perm?.code }
      }),
      removedPermissions: removed.map(id => {
        const perm = (permSnapshot || []).find(p => p.permissionId === id)
        return { id, name: perm?.name, code: perm?.code }
      }),
      overridePermissions,
      checkResults,
      permissionSnapshot: permSnapshot,
      batchId,
      operatorId: operatorInfo.id,
      operatorName: operatorInfo.username,
      operatorRole: operatorInfo.role,
      reason,
      tookEffectAt: tookEffect ? new Date() : null,
      ip: operatorInfo.ip
    })
  }
}

module.exports = new UserPermissionService()
