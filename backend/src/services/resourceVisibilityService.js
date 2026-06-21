const { ResourceVisibilityLog, Resource, User, sequelize } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere } = require('../utils/common')
const ApiError = require('../utils/apiError')

const VISIBILITY_OPTIONS = ['public', 'private', 'friends_only', 'violation_hidden']

const VISIBILITY_TRANSITIONS = {
  public: ['private', 'friends_only', 'violation_hidden'],
  private: ['public', 'friends_only'],
  friends_only: ['public', 'private'],
  violation_hidden: ['public']
}

const HIGH_FREQUENCY_THRESHOLD = {
  maxChangesPer24h: 5,
  minIntervalSeconds: 10
}

const ABNORMAL_ACCOUNT_STATUSES = ['frozen', 'temp_banned', 'permanent_banned']

const AUDIT_REQUIRED_TRANSITIONS = [
  { from: 'violation_hidden', to: 'public' }
]

class ResourceVisibilityService {
  _needsAudit(oldVisibility, newVisibility) {
    return AUDIT_REQUIRED_TRANSITIONS.some(
      t => t.from === oldVisibility && t.to === newVisibility
    )
  }

  _canTransition(oldVisibility, newVisibility) {
    const allowed = VISIBILITY_TRANSITIONS[oldVisibility] || []
    return allowed.includes(newVisibility)
  }

  async _checkHighFrequency(resourceId) {
    const resource = await Resource.findByPk(resourceId)
    if (!resource) return { blocked: false, reason: '' }

    const now = new Date()
    const lastReset = resource.lastVisibilityResetAt
      ? new Date(resource.lastVisibilityResetAt)
      : null

    const hoursSinceReset = lastReset
      ? (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60)
      : 25

    if (hoursSinceReset >= 24) {
      await resource.update({
        visibilityChangeCount: 0,
        lastVisibilityResetAt: now
      })
      return { blocked: false, reason: '', currentCount: 0 }
    }

    const currentCount = resource.visibilityChangeCount || 0
    if (currentCount >= HIGH_FREQUENCY_THRESHOLD.maxChangesPer24h) {
      return {
        blocked: true,
        reason: `24小时内已变更${currentCount}次，超过${HIGH_FREQUENCY_THRESHOLD.maxChangesPer24h}次限制`,
        currentCount
      }
    }

    if (resource.visibilityChangedAt) {
      const lastChange = new Date(resource.visibilityChangedAt)
      const secondsSince = (now.getTime() - lastChange.getTime()) / 1000
      if (secondsSince < HIGH_FREQUENCY_THRESHOLD.minIntervalSeconds) {
        return {
          blocked: true,
          reason: `操作过于频繁，请${Math.ceil(HIGH_FREQUENCY_THRESHOLD.minIntervalSeconds - secondsSince)}秒后再试`,
          currentCount
        }
      }
    }

    return { blocked: false, reason: '', currentCount }
  }

  async _validateAccount(authorId) {
    if (!authorId) return { valid: true, reason: '' }
    const author = await User.findByPk(authorId)
    if (!author) return { valid: true, reason: '' }

    if (ABNORMAL_ACCOUNT_STATUSES.includes(author.status)) {
      const statusLabels = {
        frozen: '已冻结',
        temp_banned: '临时封禁',
        permanent_banned: '永久封禁'
      }
      return {
        valid: false,
        reason: `作者账号状态异常：${statusLabels[author.status] || author.status}`
      }
    }
    return { valid: true, reason: '' }
  }

  async _validateContent(resource) {
    const issues = []

    if (resource.violationCount > 0) {
      issues.push(`存在${resource.violationCount}次违规记录`)
    }
    if (resource.isBlocked) {
      issues.push('作品已被风控拦截')
    }
    if (resource.status === 'rejected') {
      issues.push('作品审核未通过')
    }

    return { valid: issues.length === 0, issues }
  }

  async preValidate(resourceId, targetVisibility) {
    const resource = await Resource.findByPk(resourceId)
    if (!resource) {
      throw new ApiError('作品不存在', 404)
    }

    const checks = {
      transition: { valid: true, reason: '' },
      permission: { valid: true, reason: '' },
      account: { valid: true, reason: '' },
      content: { valid: true, issues: [] },
      highFrequency: { valid: true, reason: '', currentCount: 0 }
    }

    if (!VISIBILITY_OPTIONS.includes(targetVisibility)) {
      checks.transition.valid = false
      checks.transition.reason = '无效的可见性状态'
    } else if (!this._canTransition(resource.visibility, targetVisibility)) {
      checks.transition.valid = false
      checks.transition.reason = `不允许从${resource.visibility}变更为${targetVisibility}`
    }

    const accountCheck = await this._validateAccount(resource.authorId)
    checks.account.valid = accountCheck.valid
    checks.account.reason = accountCheck.reason

    const contentCheck = await this._validateContent(resource)
    checks.content.valid = contentCheck.valid
    checks.content.issues = contentCheck.issues

    const hfCheck = await this._checkHighFrequency(resourceId)
    checks.highFrequency.valid = !hfCheck.blocked
    checks.highFrequency.reason = hfCheck.reason
    checks.highFrequency.currentCount = hfCheck.currentCount || 0

    const needsAudit = this._needsAudit(resource.visibility, targetVisibility)

    const allValid =
      checks.transition.valid &&
      checks.permission.valid &&
      checks.account.valid &&
      checks.content.valid &&
      checks.highFrequency.valid

    return {
      canChange: allValid,
      needsAudit,
      currentVisibility: resource.visibility,
      targetVisibility,
      checks,
      blockReasons: [
        ...(checks.transition.reason ? [checks.transition.reason] : []),
        ...(checks.account.reason ? [checks.account.reason] : []),
        ...checks.content.issues,
        ...(checks.highFrequency.reason ? [checks.highFrequency.reason] : [])
      ]
    }
  }

  async changeVisibility(resourceId, newVisibility, options = {}) {
    const { reason, operatorId, operatorName, operatorRole, ip, userAgent, changeType = 'manual' } = options

    const resource = await Resource.findByPk(resourceId)
    if (!resource) {
      throw new ApiError('作品不存在', 404)
    }

    const oldVisibility = resource.visibility

    if (!VISIBILITY_OPTIONS.includes(newVisibility)) {
      throw new ApiError('无效的可见性状态', 400)
    }

    if (oldVisibility === newVisibility) {
      return { resource, changed: false, reason: '状态未变更' }
    }

    if (!this._canTransition(oldVisibility, newVisibility)) {
      throw new ApiError(`不允许从${oldVisibility}变更为${newVisibility}`, 400)
    }

    const accountCheck = await this._validateAccount(resource.authorId)
    if (!accountCheck.valid) {
      throw new ApiError(accountCheck.reason, 403)
    }

    if (newVisibility !== 'violation_hidden') {
      const contentCheck = await this._validateContent(resource)
      if (!contentCheck.valid && newVisibility === 'public') {
        throw new ApiError(`作品存在违规，无法设为公开：${contentCheck.issues.join('，')}`, 400)
      }
    }

    const hfCheck = await this._checkHighFrequency(resourceId)
    if (hfCheck.blocked) {
      throw new ApiError(hfCheck.reason, 429)
    }

    const needsAudit = this._needsAudit(oldVisibility, newVisibility)
    const isHighFrequency = (hfCheck.currentCount || 0) + 1 >= HIGH_FREQUENCY_THRESHOLD.maxChangesPer24h

    const transaction = await sequelize.transaction()

    try {
      const beforeSnapshot = resource.toJSON()

      let auditStatus = 'none'
      let effectiveVisibility = newVisibility

      if (needsAudit) {
        auditStatus = 'pending'
        effectiveVisibility = oldVisibility
      }

      const updateData = {
        visibility: effectiveVisibility,
        visibilityChangedAt: new Date(),
        visibilityChangeCount: (resource.visibilityChangeCount || 0) + 1,
        visibilityAuditStatus: auditStatus
      }

      const updatedResource = await resource.update(updateData, { transaction })

      await ResourceVisibilityLog.create(
        {
          resourceId,
          resourceTitle: resource.title,
          oldVisibility,
          newVisibility,
          changeType,
          reason,
          operatorId,
          operatorName,
          operatorRole,
          auditStatus,
          beforeSnapshot,
          afterSnapshot: updatedResource.toJSON(),
          ip,
          userAgent,
          changeCount: (resource.visibilityChangeCount || 0) + 1,
          isHighFrequency
        },
        { transaction }
      )

      await transaction.commit()

      return {
        resource: updatedResource,
        changed: !needsAudit,
        pendingAudit: needsAudit,
        reason: needsAudit ? '已提交审核，等待审核通过后生效' : '状态变更成功'
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async auditVisibilityChange(logId, pass, options = {}) {
    const { auditOpinion, auditorId, auditorName } = options

    const log = await ResourceVisibilityLog.findByPk(logId)
    if (!log) {
      throw new ApiError('变更记录不存在', 404)
    }

    if (log.auditStatus !== 'pending') {
      throw new ApiError('该记录无需审核或已审核', 400)
    }

    const resource = await Resource.findByPk(log.resourceId)
    if (!resource) {
      throw new ApiError('作品不存在', 404)
    }

    const transaction = await sequelize.transaction()

    try {
      const beforeSnapshot = resource.toJSON()

      if (pass) {
        await resource.update(
          {
            visibility: log.newVisibility,
            visibilityAuditStatus: 'approved'
          },
          { transaction }
        )
      } else {
        await resource.update(
          {
            visibilityAuditStatus: 'rejected'
          },
          { transaction }
        )
      }

      await log.update(
        {
          auditStatus: pass ? 'approved' : 'rejected',
          auditorId,
          auditorName,
          auditOpinion,
          auditTime: new Date(),
          afterSnapshot: resource.toJSON()
        },
        { transaction }
      )

      await transaction.commit()

      return {
        success: true,
        resource,
        log,
        message: pass ? '审核通过，状态已生效' : '审核已拒绝'
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async batchChangeVisibility(resourceIds, newVisibility, options = {}) {
    const { reason, operatorId, operatorName, operatorRole, ip, userAgent } = options

    const results = {
      successIds: [],
      failedItems: [],
      pendingAuditIds: [],
      filteredItems: [],
      total: resourceIds.length,
      successCount: 0,
      failedCount: 0,
      pendingCount: 0,
      filteredCount: 0
    }

    const resources = await Resource.findAll({
      where: { id: { [Op.in]: resourceIds } }
    })

    const resourceMap = new Map(resources.map(r => [r.id, r]))

    for (const id of resourceIds) {
      const resource = resourceMap.get(id)

      if (!resource) {
        results.failedItems.push({ id, title: '', reason: '作品不存在' })
        results.failedCount++
        continue
      }

      if (resource.visibility === newVisibility) {
        results.filteredItems.push({ id, title: resource.title, reason: '当前状态与目标状态相同' })
        results.filteredCount++
        continue
      }

      const accountCheck = await this._validateAccount(resource.authorId)
      if (!accountCheck.valid) {
        results.filteredItems.push({ id, title: resource.title, reason: accountCheck.reason })
        results.filteredCount++
        continue
      }

      if (newVisibility !== 'violation_hidden') {
        const contentCheck = await this._validateContent(resource)
        if (!contentCheck.valid && newVisibility === 'public') {
          results.filteredItems.push({
            id,
            title: resource.title,
            reason: `作品存在违规：${contentCheck.issues.join('，')}`
          })
          results.filteredCount++
          continue
        }
      }

      const hfCheck = await this._checkHighFrequency(id)
      if (hfCheck.blocked) {
        results.failedItems.push({ id, title: resource.title, reason: hfCheck.reason })
        results.failedCount++
        continue
      }

      if (!this._canTransition(resource.visibility, newVisibility)) {
        results.failedItems.push({
          id,
          title: resource.title,
          reason: `不允许从${resource.visibility}变更为${newVisibility}`
        })
        results.failedCount++
        continue
      }

      try {
        const result = await this.changeVisibility(id, newVisibility, {
          reason,
          operatorId,
          operatorName,
          operatorRole,
          ip,
          userAgent,
          changeType: 'batch'
        })

        if (result.pendingAudit) {
          results.pendingAuditIds.push(id)
          results.pendingCount++
        } else {
          results.successIds.push(id)
          results.successCount++
        }
      } catch (error) {
        results.failedItems.push({ id, title: resource.title, reason: error.message })
        results.failedCount++
      }
    }

    return results
  }

  async getVisibilityList(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      visibility,
      visibilityAuditStatus,
      categoryId,
      fileType,
      authorId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      violationOnly = false,
      abnormalOnly = false
    } = params

    const where = {}

    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { materialCode: { [Op.like]: `%${keyword}%` } }
      ]
    }

    if (visibility) {
      where.visibility = visibility
    }

    if (visibilityAuditStatus) {
      where.visibilityAuditStatus = visibilityAuditStatus
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (fileType) {
      where.fileType = fileType
    }

    if (authorId) {
      where.authorId = authorId
    }

    if (violationOnly) {
      where.violationCount = { [Op.gt]: 0 }
    }

    if (abnormalOnly) {
      where.isBlocked = true
    }

    const { limit, offset } = getPagination(page, pageSize)

    const order = []
    if (sortBy && sortOrder) {
      order.push([sortBy, sortOrder])
    }
    order.push(['id', 'desc'])

    const { count, rows } = await Resource.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [
        { association: 'category', attributes: ['id', 'name'] },
        { association: 'author', attributes: ['id', 'username', 'nickname', 'status'] }
      ]
    })

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  }

  async getVisibilityLogs(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      resourceId,
      operatorId,
      changeType,
      newVisibility,
      auditStatus,
      startTime,
      endTime,
      keyword
    } = params

    const where = {}

    if (resourceId) {
      where.resourceId = resourceId
    }
    if (operatorId) {
      where.operatorId = operatorId
    }
    if (changeType) {
      where.changeType = changeType
    }
    if (newVisibility) {
      where.newVisibility = newVisibility
    }
    if (auditStatus) {
      where.auditStatus = auditStatus
    }
    if (startTime || endTime) {
      where.createdAt = {}
      if (startTime) where.createdAt[Op.gte] = startTime
      if (endTime) where.createdAt[Op.lte] = endTime
    }
    if (keyword) {
      where[Op.or] = [
        { resourceTitle: { [Op.like]: `%${keyword}%` } },
        { operatorName: { [Op.like]: `%${keyword}%` } }
      ]
    }

    const { limit, offset } = getPagination(page, pageSize)

    const { count, rows } = await ResourceVisibilityLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'desc'], ['id', 'desc']],
      include: [
        {
          association: 'resource',
          attributes: ['id', 'title', 'visibility', 'status']
        }
      ]
    })

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  }

  async getVisibilityStats() {
    const visibilities = ['public', 'private', 'friends_only', 'violation_hidden']
    const stats = {}

    for (const v of visibilities) {
      stats[v] = await Resource.count({ where: { visibility: v } })
    }

    const pendingAudit = await ResourceVisibilityLog.count({
      where: { auditStatus: 'pending' }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayChanges = await ResourceVisibilityLog.count({
      where: { createdAt: { [Op.gte]: today } }
    })

    const highFrequencyCount = await ResourceVisibilityLog.count({
      where: { isHighFrequency: true, createdAt: { [Op.gte]: today } }
    })

    return {
      visibilityDistribution: stats,
      pendingAudit,
      todayChanges,
      highFrequencyCount
    }
  }

  async getResourceVisibilityDetail(resourceId) {
    const resource = await Resource.findByPk(resourceId, {
      include: [
        { association: 'category', attributes: ['id', 'name'] },
        { association: 'author', attributes: ['id', 'username', 'nickname', 'status'] }
      ]
    })

    if (!resource) {
      throw new ApiError('作品不存在', 404)
    }

    const logs = await ResourceVisibilityLog.findAll({
      where: { resourceId },
      order: [['createdAt', 'desc']],
      limit: 20
    })

    return {
      resource,
      changeLogs: logs,
      currentVisibility: resource.visibility,
      auditStatus: resource.visibilityAuditStatus,
      changeCount24h: resource.visibilityChangeCount || 0
    }
  }
}

module.exports = new ResourceVisibilityService()
