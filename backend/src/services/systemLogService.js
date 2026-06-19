const { SystemLog } = require('../models')
const { Op, fn, col, literal } = require('sequelize')
const { getPagination, buildFuzzyWhere, generateRandomString } = require('../utils/common')
const dayjs = require('dayjs')
const path = require('path')
const fs = require('fs')

const MAX_DATE_RANGE_DAYS = 30
const ADMIN_ROLES = ['super_admin', 'admin']
const OP_ROLES = ['super_admin', 'admin', 'operator']

const LOG_TYPE_LABELS = {
  system: '系统运行',
  api: '接口访问',
  error: '错误异常',
  performance: '性能监控',
  security: '安全事件',
  cron: '定时任务'
}

const LOG_LEVEL_LABELS = {
  debug: '调试',
  info: '正常',
  warning: '警告',
  error: '错误',
  critical: '严重'
}

const MODULE_LABELS = {
  auth: '认证模块',
  user: '用户模块',
  resource: '资源模块',
  audit: '审核模块',
  system: '系统模块',
  permission: '权限模块',
  api: 'API接口',
  database: '数据库',
  cache: '缓存模块',
  file: '文件模块',
  notification: '通知模块'
}

class SystemLogService {
  checkPermission(userRole, logType) {
    if (!userRole) return { allowed: false, reason: '未登录' }
    
    if (ADMIN_ROLES.includes(userRole)) {
      return { allowed: true }
    }
    
    if (OP_ROLES.includes(userRole)) {
      if (logType === 'error' || logType === 'api') {
        return { allowed: false, reason: '普通运维人员仅可查看正常运行日志，无法查看系统报错和接口访问日志' }
      }
      return { allowed: true }
    }
    
    return { allowed: false, reason: '没有权限访问系统日志' }
  }

  validateQueryParams(params = {}, userRole) {
    const errors = []
    const warnings = []

    const permCheck = this.checkPermission(userRole, params.logType)
    if (!permCheck.allowed) {
      errors.push(permCheck.reason)
    }

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
          errors.push(`系统日志查询时间区间不能超过${MAX_DATE_RANGE_DAYS}天`)
        }
      }
    } else if (params.startDate || params.endDate) {
      errors.push('请同时选择开始日期和结束日期')
    }

    if (params.logType) {
      const validTypes = Object.keys(LOG_TYPE_LABELS)
      if (!validTypes.includes(params.logType)) {
        errors.push('日志类型不合法')
      }
    }

    if (params.logLevel) {
      const validLevels = Object.keys(LOG_LEVEL_LABELS)
      if (!validLevels.includes(params.logLevel)) {
        errors.push('日志级别不合法')
      }
    }

    if (params.durationMin !== undefined && params.durationMin !== null) {
      if (isNaN(parseInt(params.durationMin)) || parseInt(params.durationMin) < 0) {
        errors.push('最小响应时间格式不正确')
      }
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  buildLogDetail(log) {
    const result = log.toJSON ? log.toJSON() : { ...log }

    try {
      result.requestParams = result.requestParams ? JSON.parse(result.requestParams) : null
    } catch { result.requestParams = result.requestParams }
    try {
      result.requestBody = result.requestBody ? JSON.parse(result.requestBody) : null
    } catch { result.requestBody = result.requestBody }
    try {
      result.responseData = result.responseData ? JSON.parse(result.responseData) : null
    } catch { result.responseData = result.responseData }
    try {
      result.extraInfo = result.extraInfo ? JSON.parse(result.extraInfo) : null
    } catch { result.extraInfo = result.extraInfo }

    result.logTypeLabel = LOG_TYPE_LABELS[result.logType] || result.logType
    result.logLevelLabel = LOG_LEVEL_LABELS[result.logLevel] || result.logLevel
    result.moduleLabel = MODULE_LABELS[result.module] || result.module

    return result
  }

  async getList(params = {}, userRole) {
    const validation = this.validateQueryParams(params, userRole)
    if (!validation.valid) {
      const error = new Error(validation.errors.join('；'))
      error.code = 400
      error.warnings = validation.warnings
      throw error
    }

    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.logType) {
      where.logType = params.logType
    } else {
      const permCheck = this.checkPermission(userRole, null)
      if (permCheck.allowed && !ADMIN_ROLES.includes(userRole)) {
        where.logType = { [Op.notIn]: ['error', 'api'] }
      }
    }

    if (params.logLevel) {
      where.logLevel = params.logLevel
    }

    if (params.module) {
      where.module = params.module
    }

    if (params.responseStatus) {
      where.responseStatus = parseInt(params.responseStatus)
    }

    if (params.durationMin !== undefined && params.durationMin !== null && params.durationMin !== '') {
      where.duration = { [Op.gte]: parseInt(params.durationMin) }
    }

    if (params.isHighRisk !== undefined && params.isHighRisk !== null && params.isHighRisk !== '') {
      where.isHighRisk = params.isHighRisk === 'true' || params.isHighRisk === true
    }

    if (params.startDate && params.endDate) {
      const start = dayjs(params.startDate).startOf('day').toDate()
      const end = dayjs(params.endDate).endOf('day').toDate()
      where.createdAt = { [Op.between]: [start, end] }
    }

    if (params.keyword) {
      const keywordWhere = buildFuzzyWhere(params.keyword, ['title', 'content', 'requestUrl', 'errorName', 'errorCode', 'stackTrace'])
      Object.assign(where, keywordWhere)
    }

    const { count, rows } = await SystemLog.findAndCountAll({
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

  async getStats(params = {}, userRole) {
    const where = {}

    const permCheck = this.checkPermission(userRole, null)
    if (permCheck.allowed && !ADMIN_ROLES.includes(userRole)) {
      where.logType = { [Op.notIn]: ['error', 'api'] }
    }

    if (params.startDate && params.endDate) {
      const start = dayjs(params.startDate).startOf('day').toDate()
      const end = dayjs(params.endDate).endOf('day').toDate()
      where.createdAt = { [Op.between]: [start, end] }
    }

    const typeStats = await SystemLog.findAll({
      attributes: ['logType', [fn('COUNT', '*'), 'count']],
      where,
      group: ['logType']
    })

    const levelStats = await SystemLog.findAll({
      attributes: ['logLevel', [fn('COUNT', '*'), 'count']],
      where,
      group: ['logLevel']
    })

    const totalCount = await SystemLog.count({ where })

    const infoCount = await SystemLog.count({ ...where, where: { ...where, logLevel: 'info' } })
    const warningCount = await SystemLog.count({ ...where, where: { ...where, logLevel: 'warning' } })
    const errorCount = await SystemLog.count({ ...where, where: { ...where, logLevel: 'error' } })
    const criticalCount = await SystemLog.count({ ...where, where: { ...where, logLevel: 'critical' } })

    const todayStart = dayjs().startOf('day').toDate()
    const todayCount = await SystemLog.count({ ...where, where: { ...where, createdAt: { [Op.gte]: todayStart } } })

    const highRiskCount = await SystemLog.count({ ...where, where: { ...where, isHighRisk: true } })

    const slowApiCount = await SystemLog.count({
      where: { ...where, logType: 'api', duration: { [Op.gte]: 3000 } }
    })

    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = dayjs().subtract(i, 'day').startOf('day').toDate()
      const dayEnd = dayjs().subtract(i, 'day').endOf('day').toDate()
      const dayWhere = { ...where, createdAt: { [Op.between]: [dayStart, dayEnd] } }
      const count = await SystemLog.count({ where: dayWhere })
      const errCount = await SystemLog.count({ where: { ...dayWhere, logLevel: { [Op.in]: ['error', 'critical'] } } })
      last7Days.push({
        date: dayjs(dayStart).format('YYYY-MM-DD'),
        count,
        errorCount: errCount
      })
    }

    const topErrorModules = await SystemLog.findAll({
      attributes: ['module', [fn('COUNT', '*'), 'count']],
      where: { ...where, logLevel: { [Op.in]: ['error', 'critical'] } },
      group: ['module'],
      order: [[fn('COUNT', '*'), 'DESC']],
      limit: 5
    })

    const peakHours = await SystemLog.findAll({
      attributes: [
        [fn('HOUR', col('createdAt')), 'hour'],
        [fn('COUNT', '*'), 'count']
      ],
      where,
      group: [fn('HOUR', col('createdAt'))],
      order: [[fn('COUNT', '*'), 'DESC']],
      limit: 5
    })

    return {
      totalCount,
      todayCount,
      highRiskCount,
      slowApiCount,
      byType: typeStats.map(s => ({ type: s.logType, label: LOG_TYPE_LABELS[s.logType] || s.logType, count: parseInt(s.getDataValue('count')) })),
      byLevel: levelStats.map(s => ({ level: s.logLevel, label: LOG_LEVEL_LABELS[s.logLevel] || s.logLevel, count: parseInt(s.getDataValue('count')) })),
      levelCounts: {
        info: infoCount,
        warning: warningCount,
        error: errorCount,
        critical: criticalCount
      },
      levelPercentages: {
        info: totalCount > 0 ? Math.round((infoCount / totalCount) * 100) : 0,
        warning: totalCount > 0 ? Math.round((warningCount / totalCount) * 100) : 0,
        error: totalCount > 0 ? Math.round((errorCount / totalCount) * 100) : 0,
        critical: totalCount > 0 ? Math.round((criticalCount / totalCount) * 100) : 0
      },
      last7Days,
      topErrorModules: topErrorModules.map(s => ({
        module: s.module,
        moduleLabel: MODULE_LABELS[s.module] || s.module,
        count: parseInt(s.getDataValue('count'))
      })),
      peakHours: peakHours.map(s => ({
        hour: parseInt(s.getDataValue('hour')),
        count: parseInt(s.getDataValue('count'))
      }))
    }
  }

  async getDetail(id, userRole) {
    const log = await SystemLog.findByPk(id)
    if (!log) {
      const error = new Error('日志不存在')
      error.code = 404
      throw error
    }

    const permCheck = this.checkPermission(userRole, log.logType)
    if (!permCheck.allowed) {
      const error = new Error(permCheck.reason)
      error.code = 403
      throw error
    }

    return this.buildLogDetail(log)
  }

  async create(data) {
    if (data.requestParams && typeof data.requestParams === 'object') {
      data.requestParams = JSON.stringify(data.requestParams)
    }
    if (data.requestBody && typeof data.requestBody === 'object') {
      data.requestBody = JSON.stringify(data.requestBody)
    }
    if (data.responseData && typeof data.responseData === 'object') {
      data.responseData = JSON.stringify(data.responseData)
    }
    if (data.extraInfo && typeof data.extraInfo === 'object') {
      data.extraInfo = JSON.stringify(data.extraInfo)
    }

    if (!data.traceId) {
      data.traceId = `SYS_${Date.now()}_${generateRandomString(8)}`
    }

    if (data.logLevel === 'error' || data.logLevel === 'critical' || data.isHighRisk) {
      data.isHighRisk = true
      data.retentionDays = 365
    }

    if (data.retentionDays) {
      data.expireAt = dayjs().add(data.retentionDays, 'day').toDate()
    }

    const log = await SystemLog.create(data)
    return log
  }

  async backupLogs(params = {}, userRole) {
    if (!ADMIN_ROLES.includes(userRole)) {
      const error = new Error('仅管理员可执行备份操作')
      error.code = 403
      throw error
    }

    if (!params.startDate || !params.endDate) {
      const error = new Error('请选择备份的时间范围')
      error.code = 400
      throw error
    }

    const start = dayjs(params.startDate).startOf('day').toDate()
    const end = dayjs(params.endDate).endOf('day').toDate()

    const where = {
      createdAt: { [Op.between]: [start, end] },
      isRetained: false
    }

    if (params.logType) {
      where.logType = params.logType
    }
    if (params.logLevel) {
      where.logLevel = params.logLevel
    }
    if (params.module) {
      where.module = params.module
    }

    const totalCount = await SystemLog.count({ where })
    if (totalCount === 0) {
      return { total: 0, backedUp: 0, message: '没有需要备份的日志' }
    }

    const BATCH_SIZE = 1000
    const totalBatches = Math.ceil(totalCount / BATCH_SIZE)
    const allLogs = []

    for (let batch = 0; batch < totalBatches; batch++) {
      const rows = await SystemLog.findAll({
        where,
        offset: batch * BATCH_SIZE,
        limit: BATCH_SIZE,
        order: [['createdAt', 'ASC']],
        raw: true
      })
      allLogs.push(...rows)
    }

    const backupDir = path.join(__dirname, '../../backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const backupFile = `system_logs_${dayjs(params.startDate).format('YYYYMMDD')}_${dayjs(params.endDate).format('YYYYMMDD')}_${Date.now()}.json`
    const backupPath = path.join(backupDir, backupFile)

    const backupData = {
      backupTime: new Date().toISOString(),
      backupRange: { start: params.startDate, end: params.endDate },
      totalCount,
      data: allLogs
    }

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8')

    await SystemLog.update(
      { isRetained: true, backupFile, backupAt: new Date() },
      { where }
    )

    return {
      total: totalCount,
      backedUp: allLogs.length,
      backupFile,
      backupPath,
      message: `成功备份 ${allLogs.length} 条日志`
    }
  }

  async cleanupLogs(params = {}, userRole) {
    if (!ADMIN_ROLES.includes(userRole)) {
      const error = new Error('仅管理员可执行清理操作')
      error.code = 403
      throw error
    }

    if (!params.days && (!params.startDate || !params.endDate)) {
      const error = new Error('请指定清理的天数或时间范围')
      error.code = 400
      throw error
    }

    const where = {
      isHighRisk: false,
      logLevel: { [Op.notIn]: ['error', 'critical'] }
    }

    if (params.days) {
      const cutoffDate = dayjs().subtract(parseInt(params.days), 'day').toDate()
      where.createdAt = { [Op.lt]: cutoffDate }
    } else if (params.startDate && params.endDate) {
      const start = dayjs(params.startDate).startOf('day').toDate()
      const end = dayjs(params.endDate).endOf('day').toDate()
      where.createdAt = { [Op.between]: [start, end] }
    }

    if (params.logType) {
      where.logType = params.logType
    }
    if (params.module) {
      where.module = params.module
    }

    where.isRetained = false

    const totalCount = await SystemLog.count({ where })
    if (totalCount === 0) {
      return { total: 0, cleaned: 0, protectedCount: 0, message: '没有需要清理的日志' }
    }

    const protectedWhere = {
      ...where,
      [Op.or]: [
        { isHighRisk: true },
        { logLevel: { [Op.in]: ['error', 'critical'] } }
      ]
    }
    const protectedCount = await SystemLog.count({ where: protectedWhere })

    const deletedCount = await SystemLog.destroy({ where })

    return {
      total: totalCount,
      cleaned: deletedCount,
      protectedCount,
      message: `成功清理 ${deletedCount} 条日志，自动保留 ${protectedCount} 条错误/高危日志`
    }
  }

  async getTraceability(params = {}, userRole) {
    if (!ADMIN_ROLES.includes(userRole)) {
      const error = new Error('仅管理员可查看系统异常溯源')
      error.code = 403
      throw error
    }

    const where = {
      logLevel: { [Op.in]: ['error', 'critical', 'warning'] }
    }

    if (params.startDate && params.endDate) {
      const start = dayjs(params.startDate).startOf('day').toDate()
      const end = dayjs(params.endDate).endOf('day').toDate()
      where.createdAt = { [Op.between]: [start, end] }
    } else {
      const start = dayjs().subtract(7, 'day').startOf('day').toDate()
      where.createdAt = { [Op.gte]: start }
    }

    if (params.module) {
      where.module = params.module
    }

    if (params.logType) {
      where.logType = params.logType
    }

    const abnormalLogs = await SystemLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 500
    })

    const processedLogs = abnormalLogs.map(l => this.buildLogDetail(l))

    const stats = {
      totalAbnormal: processedLogs.length,
      byType: {},
      byModule: {},
      byHour: {},
      byDay: {}
    }

    processedLogs.forEach(log => {
      stats.byType[log.logType] = (stats.byType[log.logType] || 0) + 1
      stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1
      
      const hour = dayjs(log.createdAt).hour()
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1
      
      const day = dayjs(log.createdAt).format('YYYY-MM-DD')
      stats.byDay[day] = (stats.byDay[day] || 0) + 1
    })

    const slowApis = processedLogs
      .filter(l => l.logType === 'api' && l.duration >= 3000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20)
      .map(l => ({
        url: l.requestUrl,
        method: l.requestMethod,
        duration: l.duration,
        count: 1,
        lastOccur: l.createdAt
      }))

    const errorTypes = {}
    processedLogs
      .filter(l => l.logLevel === 'error' || l.logLevel === 'critical')
      .forEach(l => {
        const key = l.errorName || l.title
        if (!errorTypes[key]) {
          errorTypes[key] = {
            name: key,
            errorCode: l.errorCode,
            module: l.module,
            count: 0,
            firstOccur: l.createdAt,
            lastOccur: l.createdAt,
            samples: []
          }
        }
        errorTypes[key].count++
        if (new Date(l.createdAt) < new Date(errorTypes[key].firstOccur)) {
          errorTypes[key].firstOccur = l.createdAt
        }
        if (new Date(l.createdAt) > new Date(errorTypes[key].lastOccur)) {
          errorTypes[key].lastOccur = l.createdAt
        }
        if (errorTypes[key].samples.length < 5) {
          errorTypes[key].samples.push({
            id: l.id,
            stackTrace: l.stackTrace,
            createdAt: l.createdAt
          })
        }
      })

    const stabilityScore = await this.calculateStabilityScore(params, userRole)

    const optimizationReport = this.generateOptimizationReport(processedLogs, stats, slowApis, errorTypes)

    return {
      abnormalLogs: processedLogs,
      statistics: {
        totalAbnormal: stats.totalAbnormal,
        byType: Object.entries(stats.byType).map(([type, count]) => ({ type, label: LOG_TYPE_LABELS[type] || type, count })),
        byModule: Object.entries(stats.byModule).map(([module, count]) => ({ module, label: MODULE_LABELS[module] || module, count })),
        byHour: Object.entries(stats.byHour).map(([hour, count]) => ({ hour: parseInt(hour), count })),
        byDay: Object.entries(stats.byDay).map(([day, count]) => ({ day, count })),
        slowApis,
        errorTypes: Object.values(errorTypes).sort((a, b) => b.count - a.count)
      },
      stabilityScore,
      optimizationReport
    }
  }

  async calculateStabilityScore(params = {}, userRole) {
    const where = {}
    if (params.startDate && params.endDate) {
      const start = dayjs(params.startDate).startOf('day').toDate()
      const end = dayjs(params.endDate).endOf('day').toDate()
      where.createdAt = { [Op.between]: [start, end] }
    } else {
      const start = dayjs().subtract(7, 'day').startOf('day').toDate()
      where.createdAt = { [Op.gte]: start }
    }

    const totalLogs = await SystemLog.count({ where })
    const errorLogs = await SystemLog.count({ where: { ...where, logLevel: { [Op.in]: ['error', 'critical'] } } })
    const warningLogs = await SystemLog.count({ where: { ...where, logLevel: 'warning' } })
    const slowApiLogs = await SystemLog.count({ where: { ...where, logType: 'api', duration: { [Op.gte]: 3000 } } })
    const highRiskLogs = await SystemLog.count({ where: { ...where, isHighRisk: true } })

    let score = 100
    if (totalLogs > 0) {
      score -= Math.min(30, (errorLogs / totalLogs) * 100 * 3)
      score -= Math.min(20, (warningLogs / totalLogs) * 100 * 0.5)
      score -= Math.min(20, (slowApiLogs / Math.max(totalLogs, 1)) * 100 * 2)
      score -= Math.min(30, (highRiskLogs / Math.max(totalLogs, 1)) * 100 * 5)
    }

    score = Math.max(0, Math.round(score))

    let level = 'excellent'
    if (score < 60) level = 'poor'
    else if (score < 80) level = 'fair'
    else if (score < 90) level = 'good'

    return {
      score,
      level,
      levelLabel: { excellent: '优秀', good: '良好', fair: '一般', poor: '较差' }[level],
      totalLogs,
      errorLogs,
      warningLogs,
      slowApiLogs,
      highRiskLogs
    }
  }

  generateOptimizationReport(logs, stats, slowApis, errorTypes) {
    const suggestions = []
    const issues = []

    const criticalErrors = Object.values(errorTypes).filter(e => e.count >= 5)
    if (criticalErrors.length > 0) {
      issues.push({
        severity: 'high',
        type: 'frequent_errors',
        description: `检测到 ${criticalErrors.length} 类高频错误`,
        details: criticalErrors.map(e => `${e.name} 发生 ${e.count} 次`)
      })
      suggestions.push({
        priority: 'high',
        title: '修复高频错误',
        description: '优先处理发生5次以上的错误，检查相关代码逻辑',
        affected: criticalErrors.length + '类错误'
      })
    }

    if (slowApis.length >= 5) {
      issues.push({
        severity: 'medium',
        type: 'slow_apis',
        description: `检测到 ${slowApis.length} 个慢接口(响应>3s)`,
        details: slowApis.slice(0, 5).map(s => `${s.method} ${s.url} (${s.duration}ms)`)
      })
      suggestions.push({
        priority: 'high',
        title: '优化慢接口性能',
        description: '对响应时间超过3秒的接口进行性能优化，考虑增加缓存、优化SQL查询',
        affected: slowApis.length + '个接口'
      })
    }

    const peakHour = stats.byHour.sort((a, b) => b.count - a.count)[0]
    if (peakHour && peakHour.count > 100) {
      issues.push({
        severity: 'low',
        type: 'peak_traffic',
        description: `访问高峰时段 ${peakHour.hour}:00-${peakHour.hour + 1}:00，请求量 ${peakHour.count} 次`,
        details: []
      })
      suggestions.push({
        priority: 'medium',
        title: '高峰时段流量优化',
        description: `在 ${peakHour.hour}:00 高峰期考虑增加限流措施或扩容`,
        affected: `每小时${peakHour.count}次请求`
      })
    }

    const moduleErrors = stats.byModule.sort((a, b) => b.count - a.count)[0]
    if (moduleErrors && moduleErrors.count > 20) {
      suggestions.push({
        priority: 'medium',
        title: '重点模块监控',
        description: `模块"${moduleErrors.label}"异常最多(${moduleErrors.count}次)，建议加强监控`,
        affected: moduleErrors.label
      })
    }

    return {
      generatedAt: new Date().toISOString(),
      period: '最近7天',
      totalIssues: issues.length,
      issues,
      suggestions: suggestions.sort((a, b) => {
        const p = { high: 0, medium: 1, low: 2 }
        return p[a.priority] - p[b.priority]
      }),
      summary: issues.length === 0
        ? '系统运行稳定，未发现明显异常'
        : `发现 ${issues.length} 个潜在问题，建议优先处理 ${suggestions.filter(s => s.priority === 'high').length} 项高优先级优化`
    }
  }

  async getTypeList() {
    return Object.entries(LOG_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  }

  async getLevelList() {
    return Object.entries(LOG_LEVEL_LABELS).map(([value, label]) => ({ value, label }))
  }

  async getModuleList() {
    return Object.entries(MODULE_LABELS).map(([value, label]) => ({ value, label }))
  }

  async getUserLogViewPermission(userRole) {
    return {
      canViewError: ADMIN_ROLES.includes(userRole),
      canViewApi: ADMIN_ROLES.includes(userRole),
      canViewSystem: OP_ROLES.includes(userRole),
      canBackup: ADMIN_ROLES.includes(userRole),
      canCleanup: ADMIN_ROLES.includes(userRole),
      canViewTraceability: ADMIN_ROLES.includes(userRole)
    }
  }
}

module.exports = new SystemLogService()
