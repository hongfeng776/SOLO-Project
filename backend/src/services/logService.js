const { OperationLog } = require('../models')
const { Op, fn, col, literal } = require('sequelize')
const { getPagination, buildFuzzyWhere, generateRandomString } = require('../utils/common')
const dayjs = require('dayjs')
const crypto = require('crypto')

const MAX_DATE_RANGE_DAYS = 90
const VALID_MODULES = ['resource', 'audit', 'user', 'violation', 'appeal', 'system', 'template', 'notification', 'log', 'permission']
const VALID_ACTIONS = ['create', 'update', 'delete', 'approve', 'reject', 'handle', 'review', 'login', 'export', 'import', 'batch', 'restore', 'discard']

class LogService {
  validateQueryParams(params = {}) {
    const errors = []
    const warnings = []

    if (params.startDate && params.endDate) {
      const start = dayjs(params.startDate)
      const end = dayjs(params.endDate)
      if (!start.isValid() || !end.isValid()) {
        errors.push('日期格式不正确')
      } else if (start.isAfter(end)) {
        errors.push('开始日期不能晚于结束日期')
      } else {
        const diffDays = end.diff(start, 'day')
        if (diffDays > MAX_DATE_RANGE_DAYS) {
          errors.push(`查询时间区间不能超过${MAX_DATE_RANGE_DAYS}天`)
        }
      }
    } else if (params.startDate || params.endDate) {
      errors.push('请同时选择开始日期和结束日期')
    }

    if (params.username !== undefined && params.username !== null && params.username !== '') {
      if (typeof params.username !== 'string' || params.username.length > 50) {
        errors.push('操作人员名称格式不正确')
      }
    }

    if (params.module !== undefined && params.module !== null && params.module !== '') {
      if (!VALID_MODULES.includes(params.module)) {
        errors.push('操作模块不合法')
      }
    }

    if (params.action !== undefined && params.action !== null && params.action !== '') {
      if (!VALID_ACTIONS.includes(params.action)) {
        errors.push('操作动作不合法')
      }
    }

    if (params.module && params.action) {
      const moduleActionMap = {
        resource: ['create', 'update', 'delete', 'export', 'import', 'restore', 'discard'],
        audit: ['approve', 'reject', 'review', 'handle'],
        user: ['create', 'update', 'delete', 'batch'],
        violation: ['handle', 'review', 'update'],
        appeal: ['approve', 'reject', 'review'],
        system: ['update', 'export'],
        template: ['create', 'update', 'delete'],
        notification: ['create', 'update', 'delete'],
        log: ['export'],
        permission: ['update', 'batch']
      }
      if (moduleActionMap[params.module] && !moduleActionMap[params.module].includes(params.action)) {
        warnings.push(`模块"${params.module}"下通常不包含"${params.action}"操作，请注意筛选结果`)
      }
    }

    if (params.userId && isNaN(parseInt(params.userId))) {
      errors.push('用户ID格式不正确')
    }

    if (params.page && (isNaN(parseInt(params.page)) || parseInt(params.page) < 1)) {
      errors.push('页码格式不正确')
    }

    if (params.pageSize && (isNaN(parseInt(params.pageSize)) || parseInt(params.pageSize) < 1 || parseInt(params.pageSize) > 500)) {
      errors.push('每页数量必须在1-500之间')
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  buildLogDetail(log) {
    const result = log.toJSON ? log.toJSON() : { ...log }

    try {
      result.detail = result.detail ? JSON.parse(result.detail) : null
    } catch {
      result.detail = result.detail
    }
    try {
      result.beforeData = result.beforeData ? JSON.parse(result.beforeData) : null
    } catch {
      result.beforeData = result.beforeData
    }
    try {
      result.afterData = result.afterData ? JSON.parse(result.afterData) : null
    } catch {
      result.afterData = result.afterData
    }
    try {
      result.changedFields = result.changedFields ? JSON.parse(result.changedFields) : []
    } catch {
      result.changedFields = []
    }
    try {
      result.deviceInfo = result.deviceInfo ? JSON.parse(result.deviceInfo) : null
    } catch {
      result.deviceInfo = result.deviceInfo
    }

    if (result.beforeData && result.afterData && (!result.changedFields || result.changedFields.length === 0)) {
      const changed = []
      const before = result.beforeData
      const after = result.afterData
      const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
      allKeys.forEach(key => {
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
          changed.push(key)
        }
      })
      result.changedFields = changed
    }

    return result
  }

  async getList(params = {}) {
    const validation = this.validateQueryParams(params)
    if (!validation.valid) {
      const error = new Error(validation.errors.join('；'))
      error.code = 400
      error.warnings = validation.warnings
      throw error
    }

    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.userId) {
      where.userId = parseInt(params.userId)
    }

    if (params.username) {
      where.username = { [Op.like]: `%${params.username}%` }
    }

    if (params.module) {
      where.module = params.module
    }

    if (params.action) {
      where.action = params.action
    }

    if (params.result) {
      where.result = params.result
    }

    if (params.riskLevel) {
      where.riskLevel = params.riskLevel
    }

    if (params.isMalicious !== undefined && params.isMalicious !== null && params.isMalicious !== '') {
      where.isMalicious = params.isMalicious === 'true' || params.isMalicious === true
    }

    if (params.targetId) {
      where.targetId = parseInt(params.targetId)
    }

    if (params.targetType) {
      where.targetType = params.targetType
    }

    if (params.startDate && params.endDate) {
      const start = dayjs(params.startDate).startOf('day').toDate()
      const end = dayjs(params.endDate).endOf('day').toDate()
      where.createdAt = { [Op.between]: [start, end] }
    }

    if (params.keyword) {
      const keywordWhere = buildFuzzyWhere(params.keyword, ['username', 'module', 'action', 'target', 'ip'])
      Object.assign(where, keywordWhere)
    }

    const { count, rows } = await OperationLog.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    })

    const list = rows.map(row => this.buildLogDetail(row))

    return {
      list,
      total: count,
      page,
      pageSize,
      warnings: validation.warnings
    }
  }

  async getDetail(id) {
    const log = await OperationLog.findByPk(id)
    if (!log) {
      const error = new Error('日志不存在')
      error.code = 404
      throw error
    }

    const detail = this.buildLogDetail(log)

    if (detail.traceId) {
      const chainLogs = await OperationLog.findAll({
        where: { traceId: detail.traceId },
        order: [['createdAt', 'ASC'], ['step', 'ASC']]
      })
      detail.chainLogs = chainLogs.map(l => this.buildLogDetail(l))
    }

    if (detail.parentLogId) {
      const parentLog = await OperationLog.findByPk(detail.parentLogId)
      if (parentLog) {
        detail.parentLog = this.buildLogDetail(parentLog)
      }
    }

    const tamperValid = this.verifyLogIntegrity(log)
    detail.integrityVerified = tamperValid

    return detail
  }

  verifyLogIntegrity(log) {
    if (!log.tamperCheck) return true
    const content = `${log.id}|${log.userId}|${log.module}|${log.action}|${log.result}|${log.createdAt}`
    const hash = crypto.createHash('sha256').update(content).digest('hex')
    return hash === log.tamperCheck
  }

  async create(data) {
    if (data.beforeData && typeof data.beforeData === 'object') {
      data.beforeData = JSON.stringify(data.beforeData)
    }
    if (data.afterData && typeof data.afterData === 'object') {
      data.afterData = JSON.stringify(data.afterData)
    }
    if (data.changedFields && Array.isArray(data.changedFields)) {
      data.changedFields = JSON.stringify(data.changedFields)
    }
    if (data.detail && typeof data.detail === 'object') {
      data.detail = JSON.stringify(data.detail)
    }
    if (data.deviceInfo && typeof data.deviceInfo === 'object') {
      data.deviceInfo = JSON.stringify(data.deviceInfo)
    }

    if (!data.traceId) {
      data.traceId = `TRACE_${Date.now()}_${generateRandomString(8)}`
    }

    const log = await OperationLog.create(data)

    const content = `${log.id}|${log.userId}|${log.module}|${log.action}|${log.result}|${log.createdAt}`
    const hash = crypto.createHash('sha256').update(content).digest('hex')
    const evidenceHash = crypto.createHash('sha256').update(`${content}|${hash}|${Date.now()}`).digest('hex')
    await log.update({ tamperCheck: hash, evidenceHash })

    return log
  }

  async getStats(params = {}) {
    const where = {}
    if (params.startDate && params.endDate) {
      const start = dayjs(params.startDate).startOf('day').toDate()
      const end = dayjs(params.endDate).endOf('day').toDate()
      where.createdAt = { [Op.between]: [start, end] }
    }

    const moduleStats = await OperationLog.findAll({
      attributes: ['module', [fn('COUNT', '*'), 'count']],
      where,
      group: ['module']
    })

    const actionStats = await OperationLog.findAll({
      attributes: ['action', [fn('COUNT', '*'), 'count']],
      where,
      group: ['action']
    })

    const resultStats = await OperationLog.findAll({
      attributes: ['result', [fn('COUNT', '*'), 'count']],
      where,
      group: ['result']
    })

    const totalCount = await OperationLog.count({ where })

    const todayStart = dayjs().startOf('day').toDate()
    const todayCount = await OperationLog.count({
      where: { ...where, createdAt: { [Op.gte]: todayStart } }
    })

    const riskStats = await OperationLog.findAll({
      attributes: ['riskLevel', [fn('COUNT', '*'), 'count']],
      where,
      group: ['riskLevel']
    })

    const maliciousCount = await OperationLog.count({
      where: { ...where, isMalicious: true }
    })

    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = dayjs().subtract(i, 'day').startOf('day').toDate()
      const dayEnd = dayjs().subtract(i, 'day').endOf('day').toDate()
      const count = await OperationLog.count({
        where: { createdAt: { [Op.between]: [dayStart, dayEnd] } }
      })
      last7Days.push({
        date: dayjs(dayStart).format('YYYY-MM-DD'),
        count
      })
    }

    return {
      totalCount,
      todayCount,
      maliciousCount,
      byModule: moduleStats.map(s => ({ module: s.module, count: parseInt(s.getDataValue('count')) })),
      byAction: actionStats.map(s => ({ action: s.action, count: parseInt(s.getDataValue('count')) })),
      byResult: resultStats.map(s => ({ result: s.result, count: parseInt(s.getDataValue('count')) })),
      byRiskLevel: riskStats.map(s => ({ level: s.riskLevel, count: parseInt(s.getDataValue('count')) })),
      last7Days
    }
  }

  async getTrace(traceId) {
    const logs = await OperationLog.findAll({
      where: { traceId },
      order: [['createdAt', 'ASC'], ['step', 'ASC']]
    })

    if (logs.length === 0) {
      const error = new Error('未找到该追踪链路的日志')
      error.code = 404
      throw error
    }

    const detailedLogs = logs.map(l => this.buildLogDetail(l))

    const consistencyIssues = []
    detailedLogs.forEach(log => {
      const integrity = this.verifyLogIntegrity(log)
      if (!integrity) {
        consistencyIssues.push({
          logId: log.id,
          type: 'tamper_detected',
          severity: 'high',
          message: '日志完整性校验失败，可能被篡改'
        })
      }
      if (log.isMalicious) {
        consistencyIssues.push({
          logId: log.id,
          type: 'malicious_operation',
          severity: log.riskLevel === 'critical' ? 'critical' : 'high',
          message: `检测到恶意操作：${log.action}`
        })
      }
      if (log.verifyStatus === 'violation') {
        consistencyIssues.push({
          logId: log.id,
          type: 'violation_operation',
          severity: 'high',
          message: '该操作被判定为违规操作'
        })
      }
    })

    const firstLog = detailedLogs[0]
    const lastLog = detailedLogs[detailedLogs.length - 1]

    return {
      traceId,
      totalSteps: detailedLogs.length,
      startTime: firstLog.createdAt,
      endTime: lastLog.createdAt,
      totalDuration: detailedLogs.reduce((sum, l) => sum + (l.duration || 0), 0),
      operator: {
        userId: firstLog.userId,
        username: firstLog.username,
        userRole: firstLog.userRole,
        ip: firstLog.ip,
        ipLocation: firstLog.ipLocation
      },
      target: {
        targetId: firstLog.targetId,
        targetType: firstLog.targetType,
        target: firstLog.target,
        module: firstLog.module
      },
      logs: detailedLogs,
      consistency: {
        isConsistent: consistencyIssues.length === 0,
        issues: consistencyIssues,
        allVerified: detailedLogs.every(l => this.verifyLogIntegrity(l))
      },
      evidence: {
        evidenceHashes: detailedLogs.map(l => ({ logId: l.id, hash: l.evidenceHash })),
        chainHash: crypto.createHash('sha256').update(detailedLogs.map(l => l.evidenceHash).join('|')).digest('hex')
      }
    }
  }

  async getTraceByLogId(logId) {
    const log = await OperationLog.findByPk(logId)
    if (!log) {
      const error = new Error('日志不存在')
      error.code = 404
      throw error
    }
    if (!log.traceId) {
      const error = new Error('该日志无关联的追踪链路')
      error.code = 400
      throw error
    }
    return this.getTrace(log.traceId)
  }

  async validateExportParams(params = {}) {
    const errors = []

    if (!params.startDate || !params.endDate) {
      errors.push('请选择导出的时间范围')
    } else {
      const validation = this.validateQueryParams(params)
      if (!validation.valid) {
        errors.push(...validation.errors)
      }
    }

    if (params.exportFields && Array.isArray(params.exportFields)) {
      const allowedFields = [
        'id', 'traceId', 'userId', 'username', 'userRole', 'module', 'action',
        'target', 'targetId', 'targetType', 'detail', 'beforeData', 'afterData',
        'changedFields', 'ip', 'ipLocation', 'userAgent', 'deviceInfo', 'os',
        'browser', 'duration', 'result', 'failReason', 'isMalicious', 'riskLevel',
        'verifyStatus', 'createdAt'
      ]
      const invalidFields = params.exportFields.filter(f => !allowedFields.includes(f))
      if (invalidFields.length > 0) {
        errors.push(`不支持导出的字段：${invalidFields.join('、')}`)
      }
    }

    return { valid: errors.length === 0, errors }
  }

  async exportLogs(params = {}) {
    const validation = await this.validateExportParams(params)
    if (!validation.valid) {
      const error = new Error(validation.errors.join('；'))
      error.code = 400
      throw error
    }

    const where = {}

    if (params.username) {
      where.username = { [Op.like]: `%${params.username}%` }
    }
    if (params.module) {
      where.module = params.module
    }
    if (params.action) {
      where.action = params.action
    }
    if (params.result) {
      where.result = params.result
    }
    if (params.userId) {
      where.userId = parseInt(params.userId)
    }

    const start = dayjs(params.startDate).startOf('day').toDate()
    const end = dayjs(params.endDate).endOf('day').toDate()
    where.createdAt = { [Op.between]: [start, end] }

    where.detail = { [Op.ne]: null }

    const totalCount = await OperationLog.count({ where })

    const BATCH_SIZE = 500
    const totalBatches = Math.ceil(totalCount / BATCH_SIZE)
    const allLogs = []

    for (let batch = 0; batch < totalBatches; batch++) {
      const rows = await OperationLog.findAll({
        where,
        offset: batch * BATCH_SIZE,
        limit: BATCH_SIZE,
        order: [['createdAt', 'DESC']]
      })
      allLogs.push(...rows.map(r => this.buildLogDetail(r)))

      if (params.onProgress) {
        params.onProgress({
          current: batch + 1,
          total: totalBatches,
          processed: allLogs.length,
          totalCount,
          percentage: Math.round(((batch + 1) / totalBatches) * 100)
        })
      }
    }

    const exportFields = params.exportFields && params.exportFields.length > 0
      ? params.exportFields
      : ['id', 'username', 'module', 'action', 'target', 'result', 'ip', 'createdAt', 'detail']

    const exported = allLogs.map(log => {
      const item = {}
      exportFields.forEach(field => {
        if (log[field] !== undefined) {
          if (typeof log[field] === 'object' && log[field] !== null) {
            item[field] = JSON.stringify(log[field])
          } else {
            item[field] = log[field]
          }
        }
      })
      return item
    })

    return {
      total: totalCount,
      exportedCount: exported.length,
      filteredEmpty: totalCount - exported.length,
      fields: exportFields,
      data: exported,
      exportTime: new Date().toISOString()
    }
  }

  async getOperators(params = {}) {
    const where = {}
    if (params.keyword) {
      where.username = { [Op.like]: `%${params.keyword}%` }
    }

    const operators = await OperationLog.findAll({
      attributes: [
        [col('userId'), 'userId'],
        [col('username'), 'username'],
        [col('userRole'), 'userRole'],
        [fn('COUNT', '*'), 'operationCount']
      ],
      where,
      group: ['userId', 'username', 'userRole'],
      order: [[fn('COUNT', '*'), 'DESC']],
      limit: 100
    })

    return operators.map(o => ({
      userId: o.getDataValue('userId'),
      username: o.getDataValue('username'),
      userRole: o.getDataValue('userRole'),
      operationCount: parseInt(o.getDataValue('operationCount'))
    })).filter(o => o.username)
  }

  async getModuleList() {
    return VALID_MODULES.map(m => ({
      value: m,
      label: {
        resource: '资源管理',
        audit: '审核管理',
        user: '用户管理',
        violation: '违规管理',
        appeal: '申诉管理',
        system: '系统管理',
        template: '模板管理',
        notification: '消息通知',
        log: '日志管理',
        permission: '权限管理'
      }[m] || m
    }))
  }

  async getActionList() {
    return VALID_ACTIONS.map(a => ({
      value: a,
      label: {
        create: '创建',
        update: '更新',
        delete: '删除',
        approve: '通过',
        reject: '拒绝',
        handle: '处置',
        review: '复核',
        login: '登录',
        export: '导出',
        import: '导入',
        batch: '批量操作',
        restore: '恢复',
        discard: '废弃'
      }[a] || a
    }))
  }
}

module.exports = new LogService()
