const { CronLog } = require('../models')
const { Op, fn, col, literal } = require('sequelize')
const { getPagination, buildFuzzyWhere } = require('../utils/common')
const dayjs = require('dayjs')

const MAX_DATE_RANGE_DAYS = 60
const SEGMENT_THRESHOLD_DAYS = 30

const TASK_TYPE_LABELS = {
  data_sync: '数据同步',
  data_cleanup: '数据清理',
  report_generate: '报告生成',
  backup: '备份',
  monitor: '监控',
  notification: '通知',
  cache_refresh: '缓存刷新',
  statistic: '统计',
  custom: '自定义'
}

const STATUS_LABELS = {
  pending: '待执行',
  running: '执行中',
  success: '成功',
  failed: '失败',
  timeout: '超时',
  skipped: '跳过',
  retrying: '重试中'
}

const TRIGGER_TYPE_LABELS = {
  cron: '定时触发',
  manual: '手动触发',
  api: '接口触发',
  dependency: '依赖触发',
  event: '事件触发'
}

const RETRY_STRATEGY_LABELS = {
  immediate: '立即重试',
  fixed: '固定间隔',
  interval: '递增间隔',
  exponential: '指数退避'
}

class CronLogService {
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
          errors.push(`查询时间跨度过大（超过${MAX_DATE_RANGE_DAYS}天），请分段查询`)
        } else if (diffDays > SEGMENT_THRESHOLD_DAYS) {
          warnings.push(`查询时间跨度${diffDays}天，数据量可能较大，建议分段查询`)
        }
      }
    } else if (params.startDate || params.endDate) {
      errors.push('请同时选择开始日期和结束日期')
    }

    if (params.taskType) {
      const validTypes = Object.keys(TASK_TYPE_LABELS)
      if (!validTypes.includes(params.taskType)) {
        errors.push('任务类型不合法')
      }
    }

    if (params.executeStatus) {
      const validStatuses = Object.keys(STATUS_LABELS)
      if (!validStatuses.includes(params.executeStatus)) {
        errors.push('执行状态不合法')
      }
    }

    if (params.executeStatus === 'success' && params.taskType) {
      warnings.push('当前筛选成功状态的任务，将联动校验任务配置有效性')
    }

    if (params.minDuration !== undefined && params.minDuration !== null) {
      if (isNaN(parseInt(params.minDuration)) || parseInt(params.minDuration) < 0) {
        errors.push('最小执行耗时格式不正确')
      }
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  buildLogDetail(log) {
    const result = log.toJSON ? log.toJSON() : { ...log }

    try { result.executeResult = result.executeResult ? JSON.parse(result.executeResult) : null } catch { }
    try { result.retryRecords = result.retryRecords ? JSON.parse(result.retryRecords) : [] } catch { result.retryRecords = [] }
    try { result.taskConfig = result.taskConfig ? JSON.parse(result.taskConfig) : null } catch { }
    try { result.diskIo = result.diskIo ? JSON.parse(result.diskIo) : null } catch { }
    try { result.networkIo = result.networkIo ? JSON.parse(result.networkIo) : null } catch { }
    try { result.outputData = result.outputData ? JSON.parse(result.outputData) : null } catch { }
    try { result.extraInfo = result.extraInfo ? JSON.parse(result.extraInfo) : null } catch { }

    result.taskTypeLabel = TASK_TYPE_LABELS[result.taskType] || result.taskType
    result.executeStatusLabel = STATUS_LABELS[result.executeStatus] || result.executeStatus
    result.triggerTypeLabel = TRIGGER_TYPE_LABELS[result.triggerType] || result.triggerType
    result.retryStrategyLabel = RETRY_STRATEGY_LABELS[result.retryStrategy] || result.retryStrategy

    if (result.isDuplicate || result.isOvertime || result.isMissed) {
      const anomalies = []
      if (result.isDuplicate) anomalies.push('重复执行')
      if (result.isOvertime) anomalies.push('超时执行')
      if (result.isMissed) anomalies.push('漏执行')
      result.anomalyDesc = anomalies.join('、')
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

    if (params.taskName) {
      where.taskName = { [Op.like]: `%${params.taskName}%` }
    }

    if (params.taskType) {
      where.taskType = params.taskType
    }

    if (params.taskGroup) {
      where.taskGroup = params.taskGroup
    }

    if (params.executeStatus) {
      where.executeStatus = params.executeStatus
    }

    if (params.triggerType) {
      where.triggerType = params.triggerType
    }

    if (params.isDuplicate !== undefined && params.isDuplicate !== null && params.isDuplicate !== '') {
      where.isDuplicate = params.isDuplicate === 'true' || params.isDuplicate === true
    }

    if (params.isMissed !== undefined && params.isMissed !== null && params.isMissed !== '') {
      where.isMissed = params.isMissed === 'true' || params.isMissed === true
    }

    if (params.isOvertime !== undefined && params.isOvertime !== null && params.isOvertime !== '') {
      where.isOvertime = params.isOvertime === 'true' || params.isOvertime === true
    }

    if (params.minDuration !== undefined && params.minDuration !== null && params.minDuration !== '') {
      where.duration = { [Op.gte]: parseInt(params.minDuration) }
    }

    if (params.startDate && params.endDate) {
      const start = dayjs(params.startDate).startOf('day').toDate()
      const end = dayjs(params.endDate).endOf('day').toDate()
      where.startedAt = { [Op.between]: [start, end] }
    }

    if (params.keyword) {
      const keywordWhere = buildFuzzyWhere(params.keyword, ['taskName', 'errorMessage', 'taskGroup'])
      Object.assign(where, keywordWhere)
    }

    if (params.executeStatus === 'success') {
      where.isTaskValid = true
    }

    const { count, rows } = await CronLog.findAndCountAll({
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
    const log = await CronLog.findByPk(id)
    if (!log) {
      const error = new Error('日志不存在')
      error.code = 404
      throw error
    }

    const detail = this.buildLogDetail(log)

    if (detail.executeStatus === 'failed' || detail.executeStatus === 'timeout') {
      detail.defaultRetryStrategy = {
        maxRetries: detail.maxRetries || 3,
        strategy: detail.retryStrategy || 'exponential',
        strategyLabel: RETRY_STRATEGY_LABELS[detail.retryStrategy] || '指数退避',
        intervals: this.calculateRetryIntervals(detail.retryStrategy || 'exponential', detail.maxRetries || 3)
      }
    }

    if (detail.taskName) {
      const recentLogs = await CronLog.findAll({
        where: { taskName: detail.taskName, id: { [Op.ne]: id } },
        order: [['createdAt', 'DESC']],
        limit: 5,
        raw: true
      })
      detail.recentExecutions = recentLogs.map(l => ({
        id: l.id,
        executeStatus: l.executeStatus,
        duration: l.duration,
        startedAt: l.startedAt,
        errorMessage: l.errorMessage
      }))
    }

    return detail
  }

  calculateRetryIntervals(strategy, maxRetries) {
    const intervals = []
    for (let i = 1; i <= maxRetries; i++) {
      switch (strategy) {
        case 'immediate': intervals.push(0); break
        case 'fixed': intervals.push(5000); break
        case 'interval': intervals.push(i * 5000); break
        case 'exponential': intervals.push(Math.min(60000, Math.pow(2, i) * 1000)); break
        default: intervals.push(Math.min(60000, Math.pow(2, i) * 1000))
      }
    }
    return intervals
  }

  async getStats(params = {}) {
    const where = {}

    if (params.startDate && params.endDate) {
      const start = dayjs(params.startDate).startOf('day').toDate()
      const end = dayjs(params.endDate).endOf('day').toDate()
      where.startedAt = { [Op.between]: [start, end] }
    }

    if (params.taskType) {
      where.taskType = params.taskType
    }

    if (params.taskGroup) {
      where.taskGroup = params.taskGroup
    }

    const totalCount = await CronLog.count({ where })
    const successCount = await CronLog.count({ where: { ...where, executeStatus: 'success' } })
    const failedCount = await CronLog.count({ where: { ...where, executeStatus: 'failed' } })
    const timeoutCount = await CronLog.count({ where: { ...where, executeStatus: 'timeout' } })
    const runningCount = await CronLog.count({ where: { ...where, executeStatus: 'running' } })

    const duplicateCount = await CronLog.count({ where: { ...where, isDuplicate: true } })
    const missedCount = await CronLog.count({ where: { ...where, isMissed: true } })
    const overtimeCount = await CronLog.count({ where: { ...where, isOvertime: true } })

    const typeStats = await CronLog.findAll({
      attributes: ['taskType', [fn('COUNT', '*'), 'count']],
      where,
      group: ['taskType']
    })

    const statusStats = await CronLog.findAll({
      attributes: ['executeStatus', [fn('COUNT', '*'), 'count']],
      where,
      group: ['executeStatus']
    })

    const todayStart = dayjs().startOf('day').toDate()
    const todayCount = await CronLog.count({ where: { ...where, startedAt: { [Op.gte]: todayStart } } })
    const todaySuccess = await CronLog.count({ where: { ...where, startedAt: { [Op.gte]: todayStart }, executeStatus: 'success' } })

    const avgDuration = await CronLog.findOne({
      attributes: [[fn('AVG', col('duration')), 'avgDuration']],
      where: { ...where, executeStatus: 'success' },
      raw: true
    })

    const maxDurationLog = await CronLog.findOne({
      where: { ...where, executeStatus: 'success' },
      order: [['duration', 'DESC']],
      raw: true
    })

    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = dayjs().subtract(i, 'day').startOf('day').toDate()
      const dayEnd = dayjs().subtract(i, 'day').endOf('day').toDate()
      const dayWhere = { ...where, startedAt: { [Op.between]: [dayStart, dayEnd] } }
      const dayTotal = await CronLog.count({ where: dayWhere })
      const daySuccess = await CronLog.count({ where: { ...dayWhere, executeStatus: 'success' } })
      const dayFailed = await CronLog.count({ where: { ...dayWhere, executeStatus: { [Op.in]: ['failed', 'timeout'] } } })
      last7Days.push({
        date: dayjs(dayStart).format('YYYY-MM-DD'),
        total: dayTotal,
        success: daySuccess,
        failed: dayFailed,
        successRate: dayTotal > 0 ? Math.round((daySuccess / dayTotal) * 100) : 0
      })
    }

    const topFailedTasks = await CronLog.findAll({
      attributes: ['taskName', [fn('COUNT', '*'), 'count']],
      where: { ...where, executeStatus: { [Op.in]: ['failed', 'timeout'] } },
      group: ['taskName'],
      order: [[fn('COUNT', '*'), 'DESC']],
      limit: 5,
      raw: true
    })

    return {
      totalCount,
      successCount,
      failedCount,
      timeoutCount,
      runningCount,
      anomalyCounts: { duplicate: duplicateCount, missed: missedCount, overtime: overtimeCount },
      successRate: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0,
      failureRate: totalCount > 0 ? Math.round(((failedCount + timeoutCount) / totalCount) * 100) : 0,
      todayCount,
      todaySuccessRate: todayCount > 0 ? Math.round((todaySuccess / todayCount) * 100) : 0,
      avgDuration: avgDuration ? Math.round(parseFloat(avgDuration.getDataValue('avgDuration')) || 0) : 0,
      maxDuration: maxDurationLog ? maxDurationLog.duration : 0,
      byType: typeStats.map(s => ({ type: s.taskType, label: TASK_TYPE_LABELS[s.taskType] || s.taskType, count: parseInt(s.getDataValue('count')) })),
      byStatus: statusStats.map(s => ({ status: s.executeStatus, label: STATUS_LABEL[s.executeStatus] || s.executeStatus, count: parseInt(s.getDataValue('count')) })),
      last7Days,
      topFailedTasks: topFailedTasks.map(t => ({ taskName: t.taskName, count: parseInt(t.getDataValue('count')) }))
    }
  }

  async getBatchStats(params = {}) {
    const where = {}

    if (params.taskType) {
      where.taskType = params.taskType
    }
    if (params.taskGroup) {
      where.taskGroup = params.taskGroup
    }

    const periods = params.period || 'daily'
    const days = periods === 'weekly' ? 28 : periods === 'monthly' ? 90 : 14

    const start = dayjs().subtract(days, 'day').startOf('day').toDate()
    where.startedAt = { [Op.gte]: start }

    const allLogs = await CronLog.findAll({ where, raw: true })

    const groupedData = {}
    allLogs.forEach(log => {
      let key
      const logDate = dayjs(log.startedAt)
      if (periods === 'weekly') {
        key = logDate.startOf('week').format('YYYY-MM-DD')
      } else if (periods === 'monthly') {
        key = logDate.startOf('month').format('YYYY-MM')
      } else {
        key = logDate.format('YYYY-MM-DD')
      }
      if (!groupedData[key]) {
        groupedData[key] = { total: 0, success: 0, failed: 0, timeout: 0, tasks: new Set() }
      }
      groupedData[key].total++
      if (log.executeStatus === 'success') groupedData[key].success++
      if (log.executeStatus === 'failed') groupedData[key].failed++
      if (log.executeStatus === 'timeout') groupedData[key].timeout++
      groupedData[key].tasks.add(log.taskName)
    })

    const chartData = Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        total: data.total,
        success: data.success,
        failed: data.failed,
        timeout: data.timeout,
        taskCount: data.tasks.size,
        successRate: data.total > 0 ? Math.round((data.success / data.total) * 100) : 0,
        failureRate: data.total > 0 ? Math.round(((data.failed + data.timeout) / data.total) * 100) : 0
      }))

    const normalTasks = allLogs.filter(l => l.executeStatus === 'success' && !l.isDuplicate && !l.isOvertime)
    const abnormalTasks = allLogs.filter(l => l.executeStatus !== 'success' || l.isDuplicate || l.isOvertime || l.isMissed)

    const taskBreakdown = {}
    allLogs.forEach(log => {
      if (!taskBreakdown[log.taskName]) {
        taskBreakdown[log.taskName] = { taskName: log.taskName, total: 0, success: 0, failed: 0, timeout: 0, avgDuration: 0, durations: [] }
      }
      taskBreakdown[log.taskName].total++
      if (log.executeStatus === 'success') taskBreakdown[log.taskName].success++
      if (log.executeStatus === 'failed') taskBreakdown[log.taskName].failed++
      if (log.executeStatus === 'timeout') taskBreakdown[log.taskName].timeout++
      taskBreakdown[log.taskName].durations.push(log.duration || 0)
    })

    Object.values(taskBreakdown).forEach(t => {
      t.avgDuration = t.durations.length > 0 ? Math.round(t.durations.reduce((a, b) => a + b, 0) / t.durations.length) : 0
      t.successRate = t.total > 0 ? Math.round((t.success / t.total) * 100) : 0
      delete t.durations
    })

    return {
      chartData,
      summary: {
        totalPeriods: chartData.length,
        overallSuccessRate: allLogs.length > 0 ? Math.round((normalTasks.length / allLogs.length) * 100) : 0,
        normalTaskCount: normalTasks.length,
        abnormalTaskCount: abnormalTasks.length,
        avgSuccessRate: chartData.length > 0 ? Math.round(chartData.reduce((a, b) => a + b.successRate, 0) / chartData.length) : 0
      },
      taskBreakdown: Object.values(taskBreakdown).sort((a, b) => b.total - a.total)
    }
  }

  async getTraceability(params = {}) {
    const where = {
      [Op.or]: [
        { isDuplicate: true },
        { isOvertime: true },
        { isMissed: true },
        { executeStatus: { [Op.in]: ['failed', 'timeout'] } },
        { isTaskValid: false }
      ]
    }

    if (params.startDate && params.endDate) {
      const start = dayjs(params.startDate).startOf('day').toDate()
      const end = dayjs(params.endDate).endOf('day').toDate()
      where.startedAt = { [Op.between]: [start, end] }
    } else {
      const start = dayjs().subtract(7, 'day').startOf('day').toDate()
      where.startedAt = { [Op.gte]: start }
    }

    if (params.taskType) {
      where.taskType = params.taskType
    }
    if (params.taskGroup) {
      where.taskGroup = params.taskGroup
    }
    if (params.anomalyType) {
      where.anomalyType = params.anomalyType
    }

    const abnormalLogs = await CronLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 500
    })

    const processedLogs = abnormalLogs.map(l => this.buildLogDetail(l))

    const stats = {
      totalAbnormal: processedLogs.length,
      byAnomalyType: {},
      byTask: {},
      byType: {},
      byHour: {},
      byDay: {}
    }

    processedLogs.forEach(log => {
      if (log.anomalyType) {
        stats.byAnomalyType[log.anomalyType] = (stats.byAnomalyType[log.anomalyType] || 0) + 1
      }
      stats.byTask[log.taskName] = (stats.byTask[log.taskName] || 0) + 1
      stats.byType[log.taskType] = (stats.byType[log.taskType] || 0) + 1

      if (log.startedAt) {
        const hour = dayjs(log.startedAt).hour()
        stats.byHour[hour] = (stats.byHour[hour] || 0) + 1
        const day = dayjs(log.startedAt).format('YYYY-MM-DD')
        stats.byDay[day] = (stats.byDay[day] || 0) + 1
      }
    })

    const resourceHighLogs = processedLogs.filter(l => l.cpuUsage > 80 || (l.memoryUsage && l.memoryUsage > 500 * 1024 * 1024))
    const configInvalidLogs = processedLogs.filter(l => !l.isTaskValid)

    const topAbnormalTasks = Object.entries(stats.byTask)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([taskName, count]) => ({ taskName, count }))

    const taskConfigAnalysis = []
    for (const log of processedLogs) {
      if (log.taskConfig) {
        const config = log.taskConfig
        taskConfigAnalysis.push({
          taskName: log.taskName,
          configValid: log.isTaskValid,
          invalidReason: log.invalidReason,
          cronExpression: log.cronExpression,
          timeoutThreshold: log.timeoutThreshold,
          maxRetries: log.maxRetries
        })
      }
    }

    const suggestions = []
    if (stats.byAnomalyType.duplicate > 0) {
      suggestions.push({
        priority: 'high',
        type: 'duplicate',
        title: '检测到重复执行任务',
        description: `发现 ${stats.byAnomalyType.duplicate} 次重复执行，建议检查任务调度配置，添加分布式锁防止并发执行`,
        count: stats.byAnomalyType.duplicate
      })
    }
    if (stats.byAnomalyType.overtime > 0) {
      suggestions.push({
        priority: 'high',
        type: 'overtime',
        title: '检测到超时执行任务',
        description: `发现 ${stats.byAnomalyType.overtime} 次超时执行，建议优化任务逻辑或增加超时阈值`,
        count: stats.byAnomalyType.overtime
      })
    }
    if (stats.byAnomalyType.missed > 0) {
      suggestions.push({
        priority: 'medium',
        type: 'missed',
        title: '检测到漏执行任务',
        description: `发现 ${stats.byAnomalyType.missed} 次漏执行，建议检查调度器健康状态和系统资源`,
        count: stats.byAnomalyType.missed
      })
    }
    if (configInvalidLogs.length > 0) {
      suggestions.push({
        priority: 'medium',
        type: 'config_invalid',
        title: '检测到配置无效任务',
        description: `发现 ${configInvalidLogs.length} 次配置无效执行，建议检查Cron表达式和任务参数`,
        count: configInvalidLogs.length
      })
    }
    if (resourceHighLogs.length > 0) {
      suggestions.push({
        priority: 'low',
        type: 'resource_high',
        title: '检测到资源占用异常',
        description: `发现 ${resourceHighLogs.length} 次高资源占用执行，建议优化任务逻辑或限制资源使用`,
        count: resourceHighLogs.length
      })
    }

    return {
      abnormalLogs: processedLogs,
      statistics: {
        totalAbnormal: stats.totalAbnormal,
        byAnomalyType: Object.entries(stats.byAnomalyType).map(([type, count]) => ({
          type,
          label: { duplicate: '重复执行', overtime: '超时执行', missed: '漏执行', config_invalid: '配置无效', resource_high: '资源占用异常' }[type] || type,
          count
        })),
        byTask: topAbnormalTasks,
        byType: Object.entries(stats.byType).map(([type, count]) => ({ type, label: TASK_TYPE_LABELS[type] || type, count })),
        byHour: Object.entries(stats.byHour).map(([hour, count]) => ({ hour: parseInt(hour), count })),
        byDay: Object.entries(stats.byDay).map(([day, count]) => ({ day, count }))
      },
      resourceAnalysis: {
        highResourceCount: resourceHighLogs.length,
        avgCpuUsage: resourceHighLogs.length > 0 ? Math.round(resourceHighLogs.reduce((a, l) => a + (parseFloat(l.cpuUsage) || 0), 0) / resourceHighLogs.length) : 0,
        avgMemoryUsage: resourceHighLogs.length > 0 ? Math.round(resourceHighLogs.reduce((a, l) => a + (l.memoryUsage || 0), 0) / resourceHighLogs.length) : 0
      },
      configAnalysis: taskConfigAnalysis.slice(0, 20),
      optimizationSuggestions: suggestions
    }
  }

  async create(data) {
    if (data.executeResult && typeof data.executeResult === 'object') {
      data.executeResult = JSON.stringify(data.executeResult)
    }
    if (data.retryRecords && typeof data.retryRecords === 'object') {
      data.retryRecords = JSON.stringify(data.retryRecords)
    }
    if (data.taskConfig && typeof data.taskConfig === 'object') {
      data.taskConfig = JSON.stringify(data.taskConfig)
    }
    if (data.diskIo && typeof data.diskIo === 'object') {
      data.diskIo = JSON.stringify(data.diskIo)
    }
    if (data.networkIo && typeof data.networkIo === 'object') {
      data.networkIo = JSON.stringify(data.networkIo)
    }
    if (data.outputData && typeof data.outputData === 'object') {
      data.outputData = JSON.stringify(data.outputData)
    }
    if (data.extraInfo && typeof data.extraInfo === 'object') {
      data.extraInfo = JSON.stringify(data.extraInfo)
    }

    if (data.duration && data.timeoutThreshold && data.duration > data.timeoutThreshold) {
      data.isOvertime = true
      if (!data.anomalyType) data.anomalyType = 'overtime'
    }

    const log = await CronLog.create(data)
    return log
  }

  async getTaskTypeList() {
    return Object.entries(TASK_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  }

  async getStatusList() {
    return Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
  }

  async getTriggerTypeList() {
    return Object.entries(TRIGGER_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  }

  async getTaskNameList(params = {}) {
    const where = {}
    if (params.taskType) where.taskType = params.taskType
    if (params.taskGroup) where.taskGroup = params.taskGroup

    const results = await CronLog.findAll({
      attributes: [[fn('DISTINCT', col('taskName')), 'taskName']],
      where,
      raw: true
    })
    return results.map(r => ({ value: r.taskName, label: r.taskName }))
  }

  async getTaskGroupList() {
    const results = await CronLog.findAll({
      attributes: [[fn('DISTINCT', col('taskGroup')), 'taskGroup']],
      where: { taskGroup: { [Op.ne]: null } },
      raw: true
    })
    return results.filter(r => r.taskGroup).map(r => ({ value: r.taskGroup, label: r.taskGroup }))
  }
}

module.exports = new CronLogService()
