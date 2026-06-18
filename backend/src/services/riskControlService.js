const { User, Violation, Appeal, UserStatusLog, Member, OperationLog, Notification } = require('../models')
const { Op } = require('sequelize')
const { getPagination, generateRandomString } = require('../utils/common')
const ApiError = require('../utils/apiError')
const dayjs = require('dayjs')

const STATUSES = ['active', 'frozen', 'temp_banned', 'permanent_banned']

const STATUS_MUTEX_RULES = {
  active: '只能从其他状态切回',
  frozen: '不能同时处于临时封禁或永久封禁',
  temp_banned: '不能同时处于冻结或永久封禁',
  permanent_banned: '不能同时处于冻结或临时封禁'
}

const STATUS_FUNCTION_PERMISSIONS = {
  active: { view: true, edit: true, create: true, audit: true, market: true },
  frozen: { view: true, edit: false, create: false, audit: false, market: false },
  temp_banned: { view: false, edit: false, create: false, audit: false, market: false },
  permanent_banned: { view: false, edit: false, create: false, audit: false, market: false }
}

const ROLE_STATUS_PERMISSIONS = {
  super_admin: ['active', 'frozen', 'temp_banned', 'permanent_banned'],
  admin: ['active', 'frozen', 'temp_banned'],
  auditor: ['active', 'frozen', 'temp_banned'],
  operator: ['active', 'frozen'],
  member: []
}

const HIGH_RISK_ACTIONS = ['permanent_banned', 'active-from-permanent']

const FREQUENCY_LIMIT = {
  sameStatus: { count: 3, hours: 24 },
  totalChanges: { count: 10, days: 7 }
}

const VIOLATION_TO_STATUS_MAPPING = {
  minor: 'frozen',
  moderate: 'temp_banned',
  severe: 'permanent_banned'
}

class RiskControlService {
  validateStatusMutex(oldStatus, newStatus) {
    if (oldStatus === newStatus) {
      return { valid: false, reason: `账号已处于此状态，无需重复变更` }
    }
    if (!STATUSES.includes(newStatus)) {
      return { valid: false, reason: `无效的账号状态: ${newStatus}` }
    }
    return { valid: true }
  }

  async validateAppealStatus(userId, newStatus) {
    if (newStatus === 'permanent_banned') {
      const pendingAppeals = await Appeal.findAll({
        where: {
          appellantId: userId,
          status: { [Op.in]: ['pending', 'reviewing'] }
        },
        include: [{ model: Violation, as: 'violation', attributes: ['id', 'violationLevel', 'action'] }]
      })
      if (pendingAppeals.length > 0) {
        return {
          valid: false,
          reason: `用户存在 ${pendingAppeals.length} 条申诉处理中，禁止永久封禁操作`,
          pendingAppealIds: pendingAppeals.map((a) => a.id)
        }
      }
    }
    return { valid: true }
  }

  async checkViolationLink(userId, newStatus) {
    if (newStatus === 'active') return { valid: true, matched: [] }

    const unresolvedViolations = await Violation.findAll({
      where: {
        authorId: userId,
        status: { [Op.in]: ['pending', 'processed', 'appealed'] }
      }
    })

    const matchedLevel = Object.entries(VIOLATION_TO_STATUS_MAPPING).find(
      ([, s]) => s === newStatus
    )?.[0]

    if (matchedLevel) {
      const matched = unresolvedViolations.filter((v) => v.violationLevel === matchedLevel)
      return { valid: true, matched }
    }
    return { valid: true, matched: [] }
  }

  validateRolePermission(operatorRole, targetStatus, fromStatus = '') {
    const allowed = ROLE_STATUS_PERMISSIONS[operatorRole] || []

    const action = `${targetStatus}${fromStatus === 'permanent_banned' ? '-from-permanent' : ''}`

    if (HIGH_RISK_ACTIONS.includes(action) && operatorRole !== 'super_admin') {
      return {
        valid: false,
        reason: `该操作(${action})仅超级管理员可执行`,
        requiredRole: 'super_admin'
      }
    }

    if (!allowed.includes(targetStatus)) {
      return {
        valid: false,
        reason: `您的角色(${operatorRole})无权将账号变更为该状态`,
        allowed: allowed.map((s) => this.getStatusLabel(s)).join('、')
      }
    }

    return { valid: true }
  }

  async checkChangeFrequency(userId, newStatus) {
    const oneDayAgo = dayjs().subtract(FREQUENCY_LIMIT.sameStatus.hours, 'hour').toDate()
    const sevenDaysAgo = dayjs().subtract(FREQUENCY_LIMIT.totalChanges.days, 'day').toDate()

    const sameStatusLogs = await UserStatusLog.count({
      where: {
        userId,
        newStatus,
        createdAt: { [Op.gte]: oneDayAgo }
      }
    })

    const totalLogs = await UserStatusLog.count({
      where: {
        userId,
        createdAt: { [Op.gte]: sevenDaysAgo }
      }
    })

    const violations = []

    if (sameStatusLogs >= FREQUENCY_LIMIT.sameStatus.count) {
      violations.push({
        type: 'same_status_frequency',
        message: `近${FREQUENCY_LIMIT.sameStatus.hours}小时内变更为【${this.getStatusLabel(newStatus)}】已达${FREQUENCY_LIMIT.sameStatus.count}次，已达操作上限`,
        limit: FREQUENCY_LIMIT.sameStatus
      })
    }

    if (totalLogs >= FREQUENCY_LIMIT.totalChanges.count) {
      violations.push({
        type: 'total_frequency',
        message: `近${FREQUENCY_LIMIT.totalChanges.days}天内状态变更总次数已达${FREQUENCY_LIMIT.totalChanges.count}次，操作过于频繁`,
        limit: FREQUENCY_LIMIT.totalChanges
      })
    }

    return {
      blocked: violations.length > 0,
      violations,
      stats: { sameStatusCount: sameStatusLogs, totalCount: totalLogs }
    }
  }

  checkStatusViolationMatch(newStatus, violationLink) {
    if (!violationLink || !violationLink.matched) return { valid: true }

    if (newStatus !== 'active' && violationLink.matched.length === 0) {
      const suggestions = Object.entries(VIOLATION_TO_STATUS_MAPPING)
      const possibleStatuses = suggestions.map(([l, s]) => `${this.getStatusLabel(s)}(${l})`).join('、')
      return {
        valid: false,
        warning: true,
        reason: `当前用户未发现匹配等级的未处置违规记录，建议根据违规等级对应选择: ${possibleStatuses}。您仍可强制提交。`
      }
    }
    return { valid: true }
  }

  getStatusFunctionPermissions(status) {
    return STATUS_FUNCTION_PERMISSIONS[status] || STATUS_FUNCTION_PERMISSIONS.active
  }

  getStatusLabel(status) {
    const labels = {
      active: '正常',
      frozen: '冻结',
      temp_banned: '临时封禁',
      permanent_banned: '永久封禁'
    }
    return labels[status] || status
  }

  async changeStatus(userId, params, operatorInfo = {}) {
    const {
      newStatus,
      reason,
      statusExpireAt,
      linkedViolationId,
      linkedAppealId,
      force = false,
      changeType = 'manual'
    } = params

    const user = await User.findByPk(userId)
    if (!user) {
      throw ApiError.notFound('用户不存在')
    }

    const oldStatus = user.status

    const mutexCheck = this.validateStatusMutex(oldStatus, newStatus)
    if (!mutexCheck.valid) {
      throw ApiError.badRequest(mutexCheck.reason)
    }

    const appealCheck = await this.validateAppealStatus(userId, newStatus)
    if (!appealCheck.valid) {
      throw ApiError.badRequest(appealCheck.reason)
    }

    const roleCheck = this.validateRolePermission(operatorInfo.role, newStatus, oldStatus)
    if (!roleCheck.valid) {
      throw ApiError.forbidden(roleCheck.reason)
    }

    if (!force) {
      const frequencyCheck = await this.checkChangeFrequency(userId, newStatus)
      if (frequencyCheck.blocked) {
        throw ApiError.badRequest({
          message: '高频变更拦截',
          details: frequencyCheck.violations,
          stats: frequencyCheck.stats
        })
      }
    }

    const violationLink = await this.checkViolationLink(userId, newStatus)
    const matchCheck = this.checkStatusViolationMatch(newStatus, violationLink)
    if (!matchCheck.valid && !matchCheck.warning) {
      throw ApiError.badRequest(matchCheck.reason)
    }

    const funcPermissions = this.getStatusFunctionPermissions(newStatus)

    const updateData = { status: newStatus, statusReason: reason || '' }

    if (newStatus === 'temp_banned' && statusExpireAt) {
      updateData.statusExpireAt = dayjs(statusExpireAt).toDate()
    } else if (newStatus === 'active') {
      updateData.statusExpireAt = null
    }

    await user.update(updateData)

    const log = await UserStatusLog.create({
      userId,
      uid: user.uid,
      oldStatus,
      newStatus,
      statusExpireAt: updateData.statusExpireAt || null,
      reason,
      linkedViolationId,
      linkedAppealId,
      operatorId: operatorInfo.id,
      operatorName: operatorInfo.username,
      operatorRole: operatorInfo.role,
      syncPermissions: funcPermissions,
      changeType,
      ip: operatorInfo.ip,
      batchId: params.batchId || null
    })

    await OperationLog.create({
      userId: operatorInfo.id,
      username: operatorInfo.username,
      module: 'user',
      action: 'change_status',
      target: user.username,
      targetId: user.id,
      detail: JSON.stringify({
        from: oldStatus,
        to: newStatus,
        reason,
        funcPermissions
      }),
      ip: operatorInfo.ip,
      result: 'success'
    })

    await Notification.create({
      userId,
      title: '账号状态变更通知',
      content: `您的账号状态已变更为【${this.getStatusLabel(newStatus)}】${reason ? '，原因：' + reason : ''}`,
      type: 'system'
    })

    const result = user.toJSON()
    delete result.password

    return {
      user: result,
      statusLog: log,
      functionPermissions: funcPermissions,
      warnings: matchCheck.warning ? [matchCheck.reason] : [],
      matchCheck
    }
  }

  async batchChangeStatus(ids, params, operatorInfo = {}) {
    if (!ids || ids.length === 0) {
      throw ApiError.badRequest('请选择需要操作的用户')
    }

    const { newStatus, reason, statusExpireAt } = params
    const batchId = 'B' + Date.now().toString().slice(-8) + generateRandomString(4).toUpperCase()

    const users = await User.findAll({ where: { id: { [Op.in]: ids } } })

    if (users.length === 0) {
      throw ApiError.notFound('未找到指定用户')
    }

    const results = {
      batchId,
      success: [],
      failed: [],
      warnings: [],
      functionPermissions: this.getStatusFunctionPermissions(newStatus)
    }

    for (const user of users) {
      try {
        const perResult = await this.changeStatus(
          user.id,
          {
            newStatus,
            reason,
            statusExpireAt,
            changeType: 'batch',
            batchId,
            force: params.force
          },
          operatorInfo
        )
        results.success.push({
          id: user.id,
          username: user.username,
          oldStatus: user.status,
          newStatus
        })
        if (perResult.warnings && perResult.warnings.length) {
          results.warnings.push({
            id: user.id,
            username: user.username,
            warnings: perResult.warnings
          })
        }
      } catch (err) {
        results.failed.push({
          id: user.id,
          username: user.username,
          reason: err.message || JSON.stringify(err)
        })
      }
    }

    return results
  }

  async getStatusLogs(userId, params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = { userId }

    if (params.newStatus) {
      where.newStatus = params.newStatus
    }
    if (params.changeType) {
      where.changeType = params.changeType
    }

    const { count, rows } = await UserStatusLog.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize
    }
  }

  async getChangeStats(userId) {
    const sevenDaysAgo = dayjs().subtract(7, 'day').toDate()

    const last7days = await UserStatusLog.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: sevenDaysAgo }
      },
      order: [['createdAt', 'ASC']],
      limit: 20
    })

    const statusGrouped = await UserStatusLog.findAll({
      where: { userId, createdAt: { [Op.gte]: sevenDaysAgo } },
      attributes: [
        'newStatus',
        [UserStatusLog.sequelize.fn('COUNT', UserStatusLog.sequelize.col('id')), 'cnt']
      ],
      group: ['newStatus']
    })

    const groupedMap = {}
    statusGrouped.forEach((row) => {
      groupedMap[row.newStatus] = parseInt(row.dataValues.cnt)
    })

    return {
      last7days: last7days,
      statusCounts: groupedMap,
      total: last7days.length
    }
  }

  async getRiskPreview(userId, newStatus, operatorRole) {
    const user = await User.findByPk(userId)
    if (!user) {
      throw ApiError.notFound('用户不存在')
    }

    const oldStatus = user.status

    return {
      mutex: this.validateStatusMutex(oldStatus, newStatus),
      appeal: await this.validateAppealStatus(userId, newStatus),
      role: this.validateRolePermission(operatorRole, newStatus, oldStatus),
      frequency: await this.checkChangeFrequency(userId, newStatus),
      match: this.checkStatusViolationMatch(newStatus, await this.checkViolationLink(userId, newStatus)),
      functionPermissions: this.getStatusFunctionPermissions(newStatus),
      pendingAppeals: (await Appeal.findAll({
        where: { appellantId: userId, status: { [Op.in]: ['pending', 'reviewing'] } },
        attributes: ['id', 'status']
      })).map((a) => ({ id: a.id, status: a.status })),
      unresolvedViolations: (await Violation.findAll({
        where: { authorId: userId, status: { [Op.ne]: 'revoked' } },
        attributes: ['id', 'violationLevel', 'violationType']
      })).map((v) => ({ id: v.id, level: v.violationLevel, type: v.violationType }))
    }
  }
}

module.exports = new RiskControlService()
