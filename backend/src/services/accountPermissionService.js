const { User, Role, RolePermission, PermissionMenu, AccountPermission, AccountPermissionLog } = require('../models')
const { Op } = require('sequelize')
const { getPagination } = require('../utils/common')
const ApiError = require('../utils/apiError')

const BLOCKED_STATUSES = ['frozen', 'temp_banned', 'permanent_banned']

class AccountPermissionService {
  async validateAccountStatus(userId) {
    const user = await User.findByPk(userId)
    if (!user) return { valid: false, reason: '用户不存在' }
    if (BLOCKED_STATUSES.includes(user.status)) {
      return { valid: false, reason: `账号状态为"${user.status}"，禁止权限分配操作` }
    }
    return { valid: true, user }
  }

  async validateCoreRoleUniqueness(userId, excludeRoleId = null) {
    const where = { userId, bindingType: 'core_role', isActive: true }
    if (excludeRoleId) where.roleId = { [Op.ne]: excludeRoleId }
    const existing = await AccountPermission.findOne({ where })
    if (existing) {
      const role = await Role.findByPk(existing.roleId)
      return {
        valid: false,
        reason: `该账号已绑定核心角色"${role?.name || existing.roleId}"，一个账号仅可绑定一个核心角色`,
        existingCoreRoleId: existing.roleId
      }
    }
    return { valid: true }
  }

  async checkPermissionStackConflicts(userId, permissionIds) {
    if (!permissionIds || permissionIds.length === 0) return { hasConflict: false, conflicts: [] }
    const existingBindings = await AccountPermission.findAll({
      where: { userId, isActive: true },
      include: [{ model: PermissionMenu, as: 'permission' }]
    })
    const existingPermIds = new Set()
    for (const binding of existingBindings) {
      if (binding.permissionId) existingPermIds.add(binding.permissionId)
      if (binding.roleId) {
        const rolePerms = await RolePermission.findAll({
          where: { roleId: binding.roleId },
          attributes: ['permissionId']
        })
        rolePerms.forEach(rp => existingPermIds.add(rp.permissionId))
      }
    }
    const allPermIds = [...new Set([...existingPermIds, ...permissionIds])]
    const permissions = await PermissionMenu.findAll({
      where: { id: { [Op.in]: allPermIds }, status: 'active' }
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
    const duplicateIds = permissionIds.filter(id => existingPermIds.has(id))
    if (duplicateIds.length > 0) {
      const dupPerms = await PermissionMenu.findAll({ where: { id: { [Op.in]: duplicateIds } } })
      conflicts.push({
        mutexGroup: '__duplicate__',
        description: '存在重复权限分配',
        permissions: dupPerms.map(p => ({ id: p.id, name: p.name, code: p.code }))
      })
    }
    return { hasConflict: conflicts.length > 0, conflicts }
  }

  async checkRolePermissionMatch(roleId, userId) {
    const role = await Role.findByPk(roleId)
    if (!role) return { matched: false, reason: '角色不存在' }
    const user = await User.findByPk(userId)
    if (!user) return { matched: false, reason: '用户不存在' }
    const rolePerms = await RolePermission.findAll({
      where: { roleId },
      include: [{ model: PermissionMenu, as: 'permission' }]
    })
    const mismatchPerms = rolePerms.filter(rp => rp.permission && rp.permission.requiredLevel > role.level)
    const matchScore = rolePerms.length > 0 ? Math.round(((rolePerms.length - mismatchPerms.length) / rolePerms.length) * 100) : 100
    return {
      matched: mismatchPerms.length === 0,
      matchScore,
      roleName: role.name,
      roleLevel: role.level,
      totalPerms: rolePerms.length,
      mismatchCount: mismatchPerms.length
    }
  }

  async assignRole(userId, roleId, operatorInfo = {}) {
    const statusCheck = await this.validateAccountStatus(userId)
    if (!statusCheck.valid) throw ApiError.badRequest(statusCheck.reason)
    const coreCheck = await this.validateCoreRoleUniqueness(userId)
    if (!coreCheck.valid) throw ApiError.badRequest(coreCheck.reason)
    const matchCheck = await this.checkRolePermissionMatch(roleId, userId)
    if (!matchCheck.matched) throw ApiError.badRequest(`角色权限匹配度不足(${matchCheck.matchScore}%)，存在${matchCheck.mismatchCount}个不匹配权限`)
    const beforeSnapshot = await this._getUserPermissionSnapshot(userId)
    const existing = await AccountPermission.findOne({
      where: { userId, roleId, bindingType: 'core_role', isActive: true }
    })
    if (existing) throw ApiError.badRequest('该账号已绑定此核心角色')
    await AccountPermission.create({
      userId,
      roleId,
      permissionId: null,
      bindingType: 'core_role',
      source: operatorInfo.source || 'manual',
      isActive: true
    })
    const rolePerms = await RolePermission.findAll({ where: { roleId } })
    for (const rp of rolePerms) {
      const exists = await AccountPermission.findOne({
        where: { userId, permissionId: rp.permissionId, bindingType: 'auxiliary', isActive: true }
      })
      if (!exists) {
        await AccountPermission.create({
          userId,
          roleId: null,
          permissionId: rp.permissionId,
          bindingType: 'auxiliary',
          source: 'role',
          isActive: true
        })
      }
    }
    const afterSnapshot = await this._getUserPermissionSnapshot(userId)
    await this._logChange(userId, statusCheck.user, 'assign_role', {
      roleId,
      roleName: (await Role.findByPk(roleId))?.name,
      beforeSnapshot,
      afterSnapshot,
      operatorInfo
    })
    return this.getAccountDetail(userId)
  }

  async revokeRole(userId, roleId, operatorInfo = {}) {
    const statusCheck = await this.validateAccountStatus(userId)
    if (!statusCheck.valid) throw ApiError.badRequest(statusCheck.reason)
    const beforeSnapshot = await this._getUserPermissionSnapshot(userId)
    await AccountPermission.update(
      { isActive: false },
      { where: { userId, roleId, bindingType: 'core_role', isActive: true } }
    )
    await AccountPermission.update(
      { isActive: false },
      { where: { userId, permissionId: { [Op.in]: (await RolePermission.findAll({ where: { roleId } })).map(rp => rp.permissionId) }, source: 'role', isActive: true } }
    )
    const afterSnapshot = await this._getUserPermissionSnapshot(userId)
    const role = await Role.findByPk(roleId)
    await this._logChange(userId, statusCheck.user, 'revoke_role', {
      roleId,
      roleName: role?.name,
      beforeSnapshot,
      afterSnapshot,
      operatorInfo,
      reason: operatorInfo.reason
    })
    return this.getAccountDetail(userId)
  }

  async addPermissions(userId, permissionIds, operatorInfo = {}) {
    const statusCheck = await this.validateAccountStatus(userId)
    if (!statusCheck.valid) throw ApiError.badRequest(statusCheck.reason)
    const conflictCheck = await this.checkPermissionStackConflicts(userId, permissionIds)
    if (conflictCheck.hasConflict) {
      const nonDupConflicts = conflictCheck.conflicts.filter(c => c.mutexGroup !== '__duplicate__')
      if (nonDupConflicts.length > 0) {
        throw ApiError.badRequest(`权限叠加冲突: ${nonDupConflicts.map(c => c.description).join('; ')}`)
      }
    }
    const beforeSnapshot = await this._getUserPermissionSnapshot(userId)
    const dedupedIds = []
    for (const pid of permissionIds) {
      const exists = await AccountPermission.findOne({
        where: { userId, permissionId: pid, isActive: true }
      })
      if (!exists) dedupedIds.push(pid)
    }
    if (dedupedIds.length > 0) {
      const bulkData = dedupedIds.map(pid => ({
        userId,
        roleId: null,
        permissionId: pid,
        bindingType: 'auxiliary',
        source: operatorInfo.source || 'manual',
        isActive: true
      }))
      await AccountPermission.bulkCreate(bulkData, { ignoreDuplicates: true })
    }
    const afterSnapshot = await this._getUserPermissionSnapshot(userId)
    const addedPermNames = []
    if (dedupedIds.length > 0) {
      const perms = await PermissionMenu.findAll({ where: { id: { [Op.in]: dedupedIds } } })
      addedPermNames.push(...perms.map(p => p.name))
    }
    await this._logChange(userId, statusCheck.user, 'add_permission', {
      beforeSnapshot,
      afterSnapshot,
      addedPermissions: dedupedIds,
      operatorInfo,
      reason: operatorInfo.reason
    })
    return this.getAccountDetail(userId)
  }

  async removePermissions(userId, permissionIds, operatorInfo = {}) {
    const beforeSnapshot = await this._getUserPermissionSnapshot(userId)
    await AccountPermission.update(
      { isActive: false },
      { where: { userId, permissionId: { [Op.in]: permissionIds }, isActive: true } }
    )
    const user = await User.findByPk(userId)
    const afterSnapshot = await this._getUserPermissionSnapshot(userId)
    await this._logChange(userId, user, 'remove_permission', {
      beforeSnapshot,
      afterSnapshot,
      removedPermissions: permissionIds,
      operatorInfo,
      reason: operatorInfo.reason
    })
    return this.getAccountDetail(userId)
  }

  async adjustPermissions(userId, data, operatorInfo = {}) {
    const statusCheck = await this.validateAccountStatus(userId)
    if (!statusCheck.valid) throw ApiError.badRequest(statusCheck.reason)
    const beforeSnapshot = await this._getUserPermissionSnapshot(userId)
    if (data.roleId !== undefined) {
      const currentCoreRole = await AccountPermission.findOne({
        where: { userId, bindingType: 'core_role', isActive: true }
      })
      if (data.roleId) {
        if (currentCoreRole && currentCoreRole.roleId !== data.roleId) {
          await AccountPermission.update(
            { isActive: false },
            { where: { userId, roleId: currentCoreRole.roleId, bindingType: 'core_role', isActive: true } }
          )
          const oldRolePerms = await RolePermission.findAll({ where: { roleId: currentCoreRole.roleId } })
          if (oldRolePerms.length > 0) {
            await AccountPermission.update(
              { isActive: false },
              { where: { userId, permissionId: { [Op.in]: oldRolePerms.map(rp => rp.permissionId) }, source: 'role', isActive: true } }
            )
          }
        }
        const coreCheck = await this.validateCoreRoleUniqueness(userId, data.roleId)
        if (!coreCheck.valid && (!currentCoreRole || currentCoreRole.roleId !== data.roleId)) {
          throw ApiError.badRequest(coreCheck.reason)
        }
        const matchCheck = await this.checkRolePermissionMatch(data.roleId, userId)
        if (!matchCheck.matched) throw ApiError.badRequest(`角色权限匹配度不足(${matchCheck.matchScore}%)`)
        await AccountPermission.create({
          userId,
          roleId: data.roleId,
          permissionId: null,
          bindingType: 'core_role',
          source: 'manual',
          isActive: true
        })
        const rolePerms = await RolePermission.findAll({ where: { roleId: data.roleId } })
        for (const rp of rolePerms) {
          const exists = await AccountPermission.findOne({
            where: { userId, permissionId: rp.permissionId, isActive: true }
          })
          if (!exists) {
            await AccountPermission.create({
              userId,
              roleId: null,
              permissionId: rp.permissionId,
              bindingType: 'auxiliary',
              source: 'role',
              isActive: true
            })
          }
        }
      } else if (currentCoreRole) {
        await AccountPermission.update(
          { isActive: false },
          { where: { userId, roleId: currentCoreRole.roleId, bindingType: 'core_role', isActive: true } }
        )
      }
    }
    if (data.addPermissionIds?.length) {
      const conflictCheck = await this.checkPermissionStackConflicts(userId, data.addPermissionIds)
      const nonDupConflicts = conflictCheck.conflicts.filter(c => c.mutexGroup !== '__duplicate__')
      if (nonDupConflicts.length > 0) {
        throw ApiError.badRequest(`权限叠加冲突: ${nonDupConflicts.map(c => c.description).join('; ')}`)
      }
      const dedupedIds = []
      for (const pid of data.addPermissionIds) {
        const exists = await AccountPermission.findOne({ where: { userId, permissionId: pid, isActive: true } })
        if (!exists) dedupedIds.push(pid)
      }
      if (dedupedIds.length > 0) {
        await AccountPermission.bulkCreate(
          dedupedIds.map(pid => ({
            userId,
            roleId: null,
            permissionId: pid,
            bindingType: 'auxiliary',
            source: 'manual',
            isActive: true
          })),
          { ignoreDuplicates: true }
        )
      }
    }
    if (data.removePermissionIds?.length) {
      await AccountPermission.update(
        { isActive: false },
        { where: { userId, permissionId: { [Op.in]: data.removePermissionIds }, source: 'manual', isActive: true } }
      )
    }
    const afterSnapshot = await this._getUserPermissionSnapshot(userId)
    await this._logChange(userId, statusCheck.user, 'sync_role_perms', {
      beforeSnapshot,
      afterSnapshot,
      roleId: data.roleId,
      roleName: data.roleId ? (await Role.findByPk(data.roleId))?.name : null,
      addedPermissions: data.addPermissionIds || [],
      removedPermissions: data.removePermissionIds || [],
      operatorInfo,
      reason: data.reason
    })
    return this.getAccountDetail(userId)
  }

  async batchAssignRole(userIds, roleId, operatorInfo = {}) {
    const role = await Role.findByPk(roleId)
    if (!role) throw ApiError.notFound('角色不存在')
    const allUsers = await User.findAll({ where: { id: { [Op.in]: userIds } } })
    const validUsers = allUsers.filter(u => !BLOCKED_STATUSES.includes(u.status))
    const filteredCount = userIds.length - validUsers.length
    const results = { success: [], failed: [], filteredCount }
    const batchId = `batch_role_${Date.now()}`
    for (const user of validUsers) {
      try {
        const coreCheck = await this.validateCoreRoleUniqueness(user.id)
        if (!coreCheck.valid) {
          results.failed.push({ id: user.id, username: user.username, reason: coreCheck.reason })
          continue
        }
        await AccountPermission.create({
          userId: user.id,
          roleId,
          permissionId: null,
          bindingType: 'core_role',
          source: 'batch',
          isActive: true
        })
        const rolePerms = await RolePermission.findAll({ where: { roleId } })
        for (const rp of rolePerms) {
          const exists = await AccountPermission.findOne({
            where: { userId: user.id, permissionId: rp.permissionId, isActive: true }
          })
          if (!exists) {
            await AccountPermission.create({
              userId: user.id,
              roleId: null,
              permissionId: rp.permissionId,
              bindingType: 'auxiliary',
              source: 'role',
              isActive: true
            })
          }
        }
        await this._logChange(user.id, user, 'batch_assign_role', {
          roleId,
          roleName: role.name,
          operatorInfo,
          batchId
        })
        results.success.push({ id: user.id, username: user.username })
      } catch (err) {
        results.failed.push({ id: user.id, username: user.username, reason: err.message })
      }
    }
    return results
  }

  async batchAddPermissions(userIds, permissionIds, operatorInfo = {}) {
    const allUsers = await User.findAll({ where: { id: { [Op.in]: userIds } } })
    const validUsers = allUsers.filter(u => !BLOCKED_STATUSES.includes(u.status))
    const filteredCount = userIds.length - validUsers.length
    const results = { success: [], failed: [], filteredCount }
    const batchId = `batch_perm_${Date.now()}`
    for (const user of validUsers) {
      try {
        const conflictCheck = await this.checkPermissionStackConflicts(user.id, permissionIds)
        const nonDupConflicts = conflictCheck.conflicts.filter(c => c.mutexGroup !== '__duplicate__')
        if (nonDupConflicts.length > 0) {
          results.failed.push({
            id: user.id,
            username: user.username,
            reason: `权限冲突: ${nonDupConflicts.map(c => c.description).join('; ')}`
          })
          continue
        }
        const dedupedIds = []
        for (const pid of permissionIds) {
          const exists = await AccountPermission.findOne({ where: { userId: user.id, permissionId: pid, isActive: true } })
          if (!exists) dedupedIds.push(pid)
        }
        if (dedupedIds.length > 0) {
          await AccountPermission.bulkCreate(
            dedupedIds.map(pid => ({
              userId: user.id,
              roleId: null,
              permissionId: pid,
              bindingType: 'auxiliary',
              source: 'batch',
              isActive: true
            })),
            { ignoreDuplicates: true }
          )
        }
        await this._logChange(user.id, user, 'batch_add_permission', {
          addedPermissions: dedupedIds,
          operatorInfo,
          batchId
        })
        results.success.push({ id: user.id, username: user.username })
      } catch (err) {
        results.failed.push({ id: user.id, username: user.username, reason: err.message })
      }
    }
    return results
  }

  async getAccountList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = {}
    if (params.status) where.status = params.status
    if (params.role) where.role = params.role
    if (params.keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${params.keyword}%` } },
        { uid: { [Op.like]: `%${params.keyword}%` } },
        { nickname: { [Op.like]: `%${params.keyword}%` } }
      ]
    }
    const { count, rows } = await User.findAndCountAll({
      where,
      offset,
      limit,
      order: [['id', 'ASC']],
      attributes: { exclude: ['password'] }
    })
    const listWithPerms = await Promise.all(rows.map(async (user) => {
      const coreRole = await AccountPermission.findOne({
        where: { userId: user.id, bindingType: 'core_role', isActive: true },
        include: [{ model: Role, as: 'role' }]
      })
      const auxPermCount = await AccountPermission.count({
        where: { userId: user.id, bindingType: 'auxiliary', isActive: true }
      })
      const allPermCount = await AccountPermission.count({
        where: { userId: user.id, isActive: true }
      })
      return {
        ...user.toJSON(),
        coreRoleName: coreRole?.role?.name || null,
        coreRoleId: coreRole?.roleId || null,
        auxPermCount,
        allPermCount
      }
    }))
    return { list: listWithPerms, total: count, page, pageSize }
  }

  async getAccountDetail(userId) {
    const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } })
    if (!user) throw ApiError.notFound('用户不存在')
    const bindings = await AccountPermission.findAll({
      where: { userId, isActive: true },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'code', 'type', 'level'] },
        { model: PermissionMenu, as: 'permission', attributes: ['id', 'name', 'code', 'level', 'module', 'isCore', 'mutexGroup'] }
      ]
    })
    const coreRoleBinding = bindings.find(b => b.bindingType === 'core_role')
    const auxPermissions = bindings.filter(b => b.bindingType === 'auxiliary')
    const effectivePermIds = new Set()
    for (const b of bindings) {
      if (b.permissionId) effectivePermIds.add(b.permissionId)
    }
    if (coreRoleBinding?.roleId) {
      const rolePerms = await RolePermission.findAll({ where: { roleId: coreRoleBinding.roleId } })
      rolePerms.forEach(rp => effectivePermIds.add(rp.permissionId))
    }
    return {
      ...user.toJSON(),
      coreRole: coreRoleBinding?.role || null,
      coreRoleId: coreRoleBinding?.roleId || null,
      auxPermissions: auxPermissions.map(b => ({
        ...b.toJSON(),
        permission: b.permission
      })),
      effectivePermCount: effectivePermIds.size
    }
  }

  async traceAccount(userId) {
    const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } })
    if (!user) throw ApiError.notFound('用户不存在')
    const detail = await this.getAccountDetail(userId)
    const logs = await AccountPermissionLog.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 100
    })
    const validation = await this._validateAccountPermissions(userId, detail)
    return {
      user: user.toJSON(),
      detail,
      logs,
      validation
    }
  }

  async _validateAccountPermissions(userId, detail) {
    const issues = []
    const effectivePermIds = new Set()
    if (detail.coreRoleId) {
      const rolePerms = await RolePermission.findAll({ where: { roleId: detail.coreRoleId } })
      rolePerms.forEach(rp => effectivePermIds.add(rp.permissionId))
    }
    for (const aux of detail.auxPermissions || []) {
      if (aux.permissionId) effectivePermIds.add(aux.permissionId)
    }
    const permArray = [...effectivePermIds]
    if (permArray.length > 0) {
      const permissions = await PermissionMenu.findAll({
        where: { id: { [Op.in]: permArray }, status: 'active' }
      })
      const mutexMap = {}
      for (const perm of permissions) {
        if (perm.mutexGroup) {
          if (!mutexMap[perm.mutexGroup]) mutexMap[perm.mutexGroup] = []
          mutexMap[perm.mutexGroup].push(perm)
        }
      }
      for (const [group, perms] of Object.entries(mutexMap)) {
        if (perms.length > 1) {
          const groupDef = PermissionMenu.MUTEX_GROUPS[group]
          issues.push({
            type: 'conflict',
            severity: 'high',
            description: groupDef ? groupDef.description : `互斥组"${group}"内存在冲突权限`,
            permissions: perms.map(p => ({ id: p.id, name: p.name, code: p.code }))
          })
        }
      }
    }
    const roleLevel = detail.coreRole?.level || 0
    const overLevelPerms = []
    if (permArray.length > 0) {
      const perms = await PermissionMenu.findAll({ where: { id: { [Op.in]: permArray } } })
      for (const p of perms) {
        if (p.requiredLevel > roleLevel && roleLevel > 0) {
          overLevelPerms.push({ id: p.id, name: p.name, code: p.code, requiredLevel: p.requiredLevel })
        }
      }
    }
    if (overLevelPerms.length > 0) {
      issues.push({
        type: 'overprivileged',
        severity: 'high',
        description: `存在${overLevelPerms.length}个越权权限配置(超出角色层级)`,
        permissions: overLevelPerms
      })
    }
    const seenPermIds = new Set()
    const duplicates = []
    const allBindings = await AccountPermission.findAll({
      where: { userId, isActive: true },
      attributes: ['permissionId']
    })
    for (const b of allBindings) {
      if (b.permissionId) {
        if (seenPermIds.has(b.permissionId)) {
          duplicates.push(b.permissionId)
        }
        seenPermIds.add(b.permissionId)
      }
    }
    if (duplicates.length > 0) {
      const dupPerms = await PermissionMenu.findAll({ where: { id: { [Op.in]: duplicates } } })
      issues.push({
        type: 'redundant',
        severity: 'medium',
        description: `存在${duplicates.length}个重复权限分配`,
        permissions: dupPerms.map(p => ({ id: p.id, name: p.name, code: p.code }))
      })
    }
    const score = Math.max(0, 100 - issues.reduce((sum, i) => {
      return sum + (i.severity === 'high' ? 30 : i.severity === 'medium' ? 15 : 5)
    }, 0))
    return { score, valid: issues.filter(i => i.severity === 'high').length === 0, issues }
  }

  async cleanupRedundant(userId, operatorInfo = {}) {
    const user = await User.findByPk(userId)
    if (!user) throw ApiError.notFound('用户不存在')
    const beforeSnapshot = await this._getUserPermissionSnapshot(userId)
    const allBindings = await AccountPermission.findAll({
      where: { userId, isActive: true }
    })
    const permIdCount = {}
    for (const b of allBindings) {
      if (b.permissionId) {
        permIdCount[b.permissionId] = (permIdCount[b.permissionId] || 0) + 1
      }
    }
    const redundantPermIds = Object.entries(permIdCount)
      .filter(([, count]) => count > 1)
      .map(([pid]) => parseInt(pid))
    let removedCount = 0
    for (const pid of redundantPermIds) {
      const bindings = allBindings.filter(b => b.permissionId === pid)
      if (bindings.length > 1) {
        for (let i = 1; i < bindings.length; i++) {
          await bindings[i].update({ isActive: false })
          removedCount++
        }
      }
    }
    const afterSnapshot = await this._getUserPermissionSnapshot(userId)
    await this._logChange(userId, user, 'cleanup_redundant', {
      beforeSnapshot,
      afterSnapshot,
      removedPermissions: redundantPermIds,
      operatorInfo,
      reason: `清理${removedCount}个冗余权限绑定`
    })
    return { removedCount, remainingPerms: afterSnapshot.length }
  }

  async getAccountLogs(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = {}
    if (params.userId) where.userId = params.userId
    if (params.changeType) where.changeType = params.changeType
    if (params.operatorId) where.operatorId = params.operatorId
    if (params.startTime && params.endTime) {
      where.createdAt = { [Op.between]: [params.startTime, params.endTime] }
    }
    if (params.batchId) where.batchId = params.batchId
    const { count, rows } = await AccountPermissionLog.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    })
    return { list: rows, total: count, page, pageSize }
  }

  async _getUserPermissionSnapshot(userId) {
    const bindings = await AccountPermission.findAll({
      where: { userId, isActive: true },
      include: [
        { model: PermissionMenu, as: 'permission', attributes: ['id', 'name', 'code'] },
        { model: Role, as: 'role', attributes: ['id', 'name', 'code'] }
      ]
    })
    return bindings.map(b => ({
      bindingType: b.bindingType,
      roleId: b.roleId,
      roleName: b.role?.name,
      permissionId: b.permissionId,
      permissionName: b.permission?.name,
      permissionCode: b.permission?.code,
      source: b.source
    }))
  }

  async _logChange(userId, user, changeType, options = {}) {
    const {
      beforeSnapshot = null,
      afterSnapshot = null,
      roleId = null,
      roleName = null,
      addedPermissions = [],
      removedPermissions = [],
      conflictInfo = null,
      batchId = null,
      operatorInfo = {},
      reason = ''
    } = options
    await AccountPermissionLog.create({
      userId,
      userUid: user?.uid,
      username: user?.username,
      changeType,
      beforeSnapshot,
      afterSnapshot,
      roleId,
      roleName,
      addedPermissions,
      removedPermissions,
      conflictInfo,
      batchId,
      operatorId: operatorInfo.id,
      operatorName: operatorInfo.username,
      operatorRole: operatorInfo.role,
      reason,
      ip: operatorInfo.ip
    })
  }
}

module.exports = new AccountPermissionService()
