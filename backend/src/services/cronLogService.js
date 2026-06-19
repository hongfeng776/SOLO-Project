const { Op } = require('sequelize')
const { CronLog } = require('../models')
const { success, failure, page } = require('../utils/response')
const crypto = require('crypto')

const TASK_TYPE_OPTIONS = [
  { value: 'data_sync', label: '数据同步' },
  { value: 'backup', label: '数据备份' },
  { value: 'cleanup', label: '数据清理' },
  { value: 'report', label: '报表生成' },
  { value: 'notification', label: '通知推送' },
  { value: 'statistics', label: '统计计算' },
  { value: 'health_check', label: '健康检查' },
  { value: 'other', label: '其他任务' }
]

const STATUS_OPTIONS = [
  { value: 'pending', label: '等待中', type: 'info' },
  { value: 'running', label: '执行中', type: 'primary' },
  { value: 'success', label: '成功', type: 'success' },
  { value: 'failed', label: '失败', type: 'danger' },
  { value: 'timeout', label: '超时', type: 'warning' },
  { value: 'skipped', label: '已跳过', type: 'info' },
  { value: 'killed', label: '已终止', type: 'danger' }
]

const TRIGGER_TYPE_OPTIONS = [
  { value: 'scheduled', label: '定时触发' },
  { value: 'manual', label: '手动触发' },
  { value: 'retry', label: '重试触发' },
  { value: 'api', label: '接口触发' }
]

const ANOMALY_TYPE_OPTIONS = [
  { value: 'none', label: '无异常' },
  { value: 'duplicate', label: '重复执行' },
  { value: 'timeout', label: '执行超时' },
  { value: 'missed', label: '漏执行' },
  { value: 'resource_exceeded', label: '资源超限' },
  { value: 'config_error', label: '配置错误' }
]

const RETRY_STRATEGY_OPTIONS = [
  { value: 'exponential', label: '指数退避' },
  { value: 'fixed', label: '固定间隔' },
  { value: 'linear', label: '线性递增' },
  { value: 'none', label: '不重试' }
]

const validateQueryParams = (params) => {
  const errors = []
  const warnings = []

  const { startDate, endDate, taskType, status, taskId, taskName, triggerType, anomalyType } = params

  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    if (diffDays > 30) {
      errors.push('查询时间跨度不能超过30天，请分段查询')
    }

    if (diffDays > 15) {
      warnings.push('查询时间跨度较大，可能影响查询性能，建议缩小时间范围')
    }

    if (start > end) {
      errors.push('开始时间不能晚于结束时间')
    }
  }

  if (taskType && !TASK_TYPE_OPTIONS.some(opt => opt.value === taskType)) {
    errors.push('无效的任务类型')
  }

  if (status && !STATUS_OPTIONS.some(opt => opt.value === status)) {
    errors.push('无效的执行状态')
  }

  if (triggerType && !TRIGGER_TYPE_OPTIONS.some(opt => opt.value === triggerType)) {
    errors.push('无效的触发类型')
  }

  if (anomalyType && !ANOMALY_TYPE_OPTIONS.some(opt => opt.value === anomalyType)) {
    errors.push('无效的异常类型')
  }

  if (status === 'success' && anomalyType && anomalyType !== 'none') {
    warnings.push('成功状态的任务通常无异常，筛选结果可能为空')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validTaskConfig: taskType ? TASK_TYPE_OPTIONS.some(opt => opt.value === taskType) : true
  }
}

const buildLogDetail = (log) => {
  const result = log.get ? log.get({ plain: true }) : { ...log }

  try {
    if (result.configParams && typeof result.configParams === 'string') {
      result.configParams = JSON.parse(result.configParams)
    }
  } catch (e) { /* 保持原样 */ }

  try {
    if (result.resultData && typeof result.resultData === 'string') {
      result.resultData = JSON.parse(result.resultData)
    }
  } catch (e) { /* 保持原样 */ }

  try {
    if (result.retryHistory && typeof result.retryHistory === 'string') {
      result.retryHistory = JSON.parse(result.retryHistory)
    }
  } catch (e) { /* 保持原样 */ }

  try {
    if (result.extraInfo && typeof result.extraInfo === 'string') {
      result.extraInfo = JSON.parse(result.extraInfo)
    }
  } catch (e) { /* 保持原样 */ }

  if (result.memoryUsage !== undefined && result.memoryUsage !== null) {
    result.memoryUsageMB = Math.round(result.memoryUsage / (1024 * 1024))
  }

  return result
}

const validateTaskConfig = async (taskId, taskType) => {
  if (!taskId) return { valid: true, message: '' }

  const recentLogs = await CronLog.findAll({
    where: { taskId },
    order: [['createdAt', 'DESC']],
    limit: 10
  })

  if (recentLogs.length === 0) {
    return { valid: false, message: '未找到该任务的执行记录，可能为无效任务ID' }
  }

  if (taskType && recentLogs.some(log => log.taskType !== taskType)) {
    return { valid: false, message: '任务类型与历史记录不匹配，请检查筛选条件' }
  }

  const lastLog = recentLogs[0]
  const now = Date.now()
  const lastRun = new Date(lastLog.createdAt).getTime()
  const daysSinceLastRun = Math.floor((now - lastRun) / (1000 * 60 * 60 * 24))

  if (daysSinceLastRun > 7 && lastLog.status !== 'running') {
    return { valid: true, warning: '该任务已超过7天未执行，可能已停用' }
  }

  return { valid: true, message: '' }
}

const getList = async (params) => {
  const validation = validateQueryParams(params)
  if (!validation.valid) {
    return failure(400, validation.errors[0])
  }

  const taskValidation = await validateTaskConfig(params.taskId, params.taskType)
  if (!taskValidation.valid) {
    return success([], { total: 0, taskValidation, validation })
  }

  const { pageNum = 1, pageSize = 20, taskId, taskName, taskType, status, triggerType, anomalyType, startDate, endDate, keyword } = params

  const where = {}

  if (taskId) where.taskId = taskId
  if (taskType) where.taskType = taskType
  if (status) where.status = status
  if (triggerType) where.triggerType = triggerType
  if (anomalyType) where.anomalyType = anomalyType

  if (taskName) {
    where.taskName = { [Op.like]: `%${taskName}%` }
  }

  if (keyword) {
    where[Op.or] = [
      { taskName: { [Op.like]: `%${keyword}%` } },
      { errorMessage: { [Op.like]: `%${keyword}%` } },
      { output: { [Op.like]: `%${keyword}%` } }
    ]
  }

  if (startDate && endDate) {
    where.scheduledAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  }

  const { count, rows } = await CronLog.findAndCountAll({
    where,
    order: [['scheduledAt', 'DESC']],
    offset: (pageNum - 1) * pageSize,
    limit: pageSize
  })

  const data = rows.map(buildLogDetail)

  return page(data, count, pageNum, pageSize, {
    validation,
    taskValidation,
    warnings: validation.warnings.concat(taskValidation.warning ? [taskValidation.warning] : [])
  })
}

const getStats = async (params) => {
  const validation = validateQueryParams(params)
  if (!validation.valid) {
    return failure(400, validation.errors[0])
  }

  const { period = 'daily', startDate, endDate, taskType } = params

  const where = {}
  if (startDate && endDate) {
    where.scheduledAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  }
  if (taskType) where.taskType = taskType

  const allLogs = await CronLog.findAll({
    where,
    order: [['scheduledAt', 'ASC']],
    attributes: ['id', 'status', 'taskType', 'scheduledAt', 'duration', 'isTimeout', 'isDuplicate', 'isMissed', 'anomalyType', 'anomalyDetected', 'retryCount']
  })

  const total = allLogs.length
  const successCount = allLogs.filter(l => l.status === 'success').length
  const failedCount = allLogs.filter(l => l.status === 'failed').length
  const timeoutCount = allLogs.filter(l => l.isTimeout).length
  const anomalyCount = allLogs.filter(l => l.anomalyDetected).length
  const avgDuration = total > 0 ? Math.round(allLogs.reduce((sum, l) => sum + (l.duration || 0), 0) / total) : 0

  const successRate = total > 0 ? parseFloat(((successCount / total) * 100).toFixed(2)) : 0
  const failureRate = total > 0 ? parseFloat(((failedCount / total) * 100).toFixed(2)) : 0

  const byTaskType = {}
  TASK_TYPE_OPTIONS.forEach(opt => {
    const typeLogs = allLogs.filter(l => l.taskType === opt.value)
    byTaskType[opt.value] = {
      label: opt.label,
      total: typeLogs.length,
      success: typeLogs.filter(l => l.status === 'success').length,
      failed: typeLogs.filter(l => l.status === 'failed').length,
      successRate: typeLogs.length > 0 ? parseFloat(((typeLogs.filter(l => l.status === 'success').length / typeLogs.length) * 100).toFixed(2)) : 0
    }
  })

  const periodFormat = {
    daily: (date) => date.toISOString().split('T')[0],
    weekly: (date) => {
      const d = new Date(date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(d.setDate(diff)).toISOString().split('T')[0]
    },
    monthly: (date) => date.toISOString().slice(0, 7)
  }

  const trendData = {}
  allLogs.forEach(log => {
    const key = periodFormat[period]?.(new Date(log.scheduledAt)) || periodFormat.daily(new Date(log.scheduledAt))
    if (!trendData[key]) {
      trendData[key] = { period: key, total: 0, success: 0, failed: 0, timeout: 0, anomaly: 0 }
    }
    trendData[key].total++
    if (log.status === 'success') trendData[key].success++
    if (log.status === 'failed') trendData[key].failed++
    if (log.isTimeout) trendData[key].timeout++
    if (log.anomalyDetected) trendData[key].anomaly++
  })

  const trend = Object.values(trendData).sort((a, b) => a.period.localeCompare(b.period))

  const anomalyStats = {
    duplicate: allLogs.filter(l => l.anomalyType === 'duplicate').length,
    timeout: allLogs.filter(l => l.anomalyType === 'timeout').length,
    missed: allLogs.filter(l => l.anomalyType === 'missed').length,
    resourceExceeded: allLogs.filter(l => l.anomalyType === 'resource_exceeded').length,
    configError: allLogs.filter(l => l.anomalyType === 'config_error').length
  }

  const retryStats = {
    withRetry: allLogs.filter(l => l.retryCount > 0).length,
    maxRetryReached: allLogs.filter(l => l.retryCount >= 3 && l.status === 'failed').length,
    avgRetryCount: total > 0 ? parseFloat((allLogs.reduce((sum, l) => sum + l.retryCount, 0) / total).toFixed(2)) : 0
  }

  return success({
    summary: {
      total,
      successCount,
      failedCount,
      timeoutCount,
      anomalyCount,
      successRate,
      failureRate,
      avgDuration
    },
    byTaskType,
    trend,
    anomalyStats,
    retryStats,
    period
  })
}

const getDetail = async (id) => {
  const log = await CronLog.findByPk(id, {
    include: [
      { model: CronLog, as: 'retryLogs', order: [['createdAt', 'ASC']] },
      { model: CronLog, as: 'parentLog' }
    ]
  })

  if (!log) {
    return failure(404, '日志不存在')
  }

  const detail = buildLogDetail(log)

  if (detail.status === 'failed' || detail.status === 'timeout') {
    detail.defaultRetryStrategy = {
      strategy: detail.retryStrategy,
      maxRetries: detail.maxRetries,
      interval: detail.retryInterval,
      description: getRetryStrategyDescription(detail.retryStrategy, detail.retryInterval, detail.maxRetries)
    }

    if (detail.retryCount < detail.maxRetries) {
      detail.nextRetryTime = calculateNextRetryTime(detail)
    }
  }

  return success(detail)
}

const getRetryStrategyDescription = (strategy, interval, maxRetries) => {
  const descriptions = {
    exponential: `指数退避策略：首 retry 间隔 ${interval / 1000} 秒，之后每次翻倍，最多重试 ${maxRetries} 次`,
    fixed: `固定间隔策略：每 ${interval / 1000} 秒重试一次，最多重试 ${maxRetries} 次`,
    linear: `线性递增策略：首 retry 间隔 ${interval / 1000} 秒，之后每次增加 ${interval / 1000} 秒，最多重试 ${maxRetries} 次`,
    none: '不进行自动重试，需手动触发'
  }
  return descriptions[strategy] || descriptions.fixed
}

const calculateNextRetryTime = (log) => {
  if (!log.finishedAt) return null

  const baseTime = new Date(log.finishedAt).getTime()
  const retryCount = log.retryCount || 0

  let delay = log.retryInterval || 60000

  if (log.retryStrategy === 'exponential') {
    delay = delay * Math.pow(2, retryCount)
  } else if (log.retryStrategy === 'linear') {
    delay = delay * (retryCount + 1)
  }

  return new Date(baseTime + delay).toISOString()
}

const create = async (data) => {
  const log = await CronLog.create(data)
  return success(log)
}

const getTraceability = async (params) => {
  const validation = validateQueryParams(params)
  if (!validation.valid) {
    return failure(400, validation.errors[0])
  }

  const { taskId, startDate, endDate } = params

  if (!taskId) {
    return failure(400, '请指定任务ID进行溯源')
  }

  const where = { taskId }
  if (startDate && endDate) {
    where.scheduledAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  }

  const logs = await CronLog.findAll({
    where,
    order: [['scheduledAt', 'DESC']],
    limit: 100,
    include: [{ model: CronLog, as: 'retryLogs', order: [['createdAt', 'ASC']] }]
  })

  if (logs.length === 0) {
    return failure(404, '未找到该任务的执行记录')
  }

  const recentLogs = logs.slice(0, 30)
  const analysis = analyzeTaskExecutions(recentLogs)
  const configIssues = validateTaskConfiguration(logs[0])
  const anomalies = detectAnomalies(recentLogs)
  const optimization = generateOptimizationReport(analysis, configIssues, anomalies)

  return success({
    taskOverview: {
      taskId,
      taskName: logs[0].taskName,
      taskType: logs[0].taskType,
      taskGroup: logs[0].taskGroup,
      cronExpression: logs[0].cronExpression,
      totalExecutions: logs.length,
      recentExecutions: recentLogs.length,
      configParams: buildLogDetail(logs[0]).configParams
    },
    executionFlow: recentLogs.map(buildLogDetail),
    resourceUsage: analyzeResourceUsage(recentLogs),
    anomalies,
    configIssues,
    analysis,
    optimization
  })
}

const analyzeTaskExecutions = (logs) => {
  const total = logs.length
  const successCount = logs.filter(l => l.status === 'success').length
  const failedCount = logs.filter(l => l.status === 'failed').length
  const timeoutCount = logs.filter(l => l.isTimeout).length

  const durations = logs.filter(l => l.duration > 0).map(l => l.duration)
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
  const maxDuration = durations.length > 0 ? Math.max(...durations) : 0
  const minDuration = durations.length > 0 ? Math.min(...durations) : 0

  const byHour = {}
  logs.forEach(log => {
    const hour = new Date(log.scheduledAt).getHours()
    if (!byHour[hour]) byHour[hour] = { hour, count: 0, failed: 0 }
    byHour[hour].count++
    if (log.status === 'failed') byHour[hour].failed++
  })

  const peakHours = Object.values(byHour)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const stabilityScore = calculateStabilityScore(logs, successCount, total, timeoutCount)

  return {
    total,
    successCount,
    failedCount,
    timeoutCount,
    successRate: total > 0 ? parseFloat(((successCount / total) * 100).toFixed(2)) : 0,
    failureRate: total > 0 ? parseFloat(((failedCount / total) * 100).toFixed(2)) : 0,
    avgDuration,
    maxDuration,
    minDuration,
    peakHours,
    stabilityScore
  }
}

const calculateStabilityScore = (logs, successCount, total, timeoutCount) => {
  if (total === 0) return 0

  let score = 100

  const successRate = successCount / total
  if (successRate < 0.95) score -= (0.95 - successRate) * 200
  if (successRate < 0.8) score -= (0.8 - successRate) * 300

  const timeoutRate = timeoutCount / total
  if (timeoutRate > 0.1) score -= (timeoutRate - 0.1) * 200

  const anomalyRate = logs.filter(l => l.anomalyDetected).length / total
  if (anomalyRate > 0.05) score -= (anomalyRate - 0.05) * 300

  const durations = logs.filter(l => l.duration > 0).map(l => l.duration)
  if (durations.length > 5) {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    const variance = durations.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / durations.length
    const cv = Math.sqrt(variance) / avg
    if (cv > 0.5) score -= cv * 100
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

const validateTaskConfiguration = (log) => {
  const issues = []

  if (!log.cronExpression) {
    issues.push({ severity: 'warning', message: '未配置Cron表达式，任务调度可能不规范' })
  }

  if (log.timeoutThreshold > 3600000 * 6) {
    issues.push({ severity: 'warning', message: '超时阈值超过6小时，建议设置合理的超时时间' })
  }

  if (log.maxRetries > 5) {
    issues.push({ severity: 'warning', message: '最大重试次数超过5次，可能导致资源浪费' })
  }

  if (log.retryStrategy === 'none' && log.status === 'failed') {
    issues.push({ severity: 'info', message: '当前任务未配置重试策略，失败后需要手动处理' })
  }

  if (log.timeoutThreshold && log.retryInterval && log.retryInterval < log.timeoutThreshold / 2) {
    issues.push({ severity: 'warning', message: '重试间隔小于超时时间的一半，可能导致重复执行' })
  }

  return issues
}

const detectAnomalies = (logs) => {
  const anomalies = []

  logs.forEach((log, index) => {
    if (log.isDuplicate) {
      anomalies.push({
        type: 'duplicate',
        severity: 'warning',
        logId: log.id,
        scheduledAt: log.scheduledAt,
        message: '检测到重复执行，建议检查任务锁机制'
      })
    }

    if (log.isTimeout) {
      anomalies.push({
        type: 'timeout',
        severity: 'error',
        logId: log.id,
        scheduledAt: log.scheduledAt,
        message: `执行超时，耗时 ${log.duration}ms 超过阈值 ${log.timeoutThreshold}ms`
      })
    }

    if (log.isMissed) {
      anomalies.push({
        type: 'missed',
        severity: 'error',
        logId: log.id,
        scheduledAt: log.scheduledAt,
        message: '检测到漏执行，建议检查调度器状态'
      })
    }

    if (index > 0) {
      const prevTime = new Date(logs[index - 1].scheduledAt).getTime()
      const currTime = new Date(log.scheduledAt).getTime()
      const interval = currTime - prevTime

      if (log.cronExpression && interval < 60000) {
        anomalies.push({
          type: 'too_frequent',
          severity: 'warning',
          logId: log.id,
          scheduledAt: log.scheduledAt,
          message: `执行间隔过短（${interval / 1000}秒），可能存在调度异常`
        })
      }
    }

    if (log.cpuUsage > 80 || log.memoryUsagePercent > 80) {
      anomalies.push({
        type: 'resource_exceeded',
        severity: 'warning',
        logId: log.id,
        scheduledAt: log.scheduledAt,
        message: `资源使用过高 - CPU: ${log.cpuUsage}%, 内存: ${log.memoryUsagePercent}%`
      })
    }
  })

  return anomalies
}

const analyzeResourceUsage = (logs) => {
  const cpuUsages = logs.filter(l => l.cpuUsage !== null && l.cpuUsage !== undefined).map(l => parseFloat(l.cpuUsage))
  const memoryUsages = logs.filter(l => l.memoryUsagePercent !== null && l.memoryUsagePercent !== undefined).map(l => parseFloat(l.memoryUsagePercent))

  return {
    cpu: {
      avg: cpuUsages.length > 0 ? parseFloat((cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length).toFixed(2)) : 0,
      max: cpuUsages.length > 0 ? Math.max(...cpuUsages) : 0,
      min: cpuUsages.length > 0 ? Math.min(...cpuUsages) : 0
    },
    memory: {
      avg: memoryUsages.length > 0 ? parseFloat((memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length).toFixed(2)) : 0,
      max: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      min: memoryUsages.length > 0 ? Math.min(...memoryUsages) : 0
    }
  }
}

const generateOptimizationReport = (analysis, configIssues, anomalies) => {
  const suggestions = []

  if (analysis.successRate < 90) {
    suggestions.push({
      priority: 'high',
      category: 'reliability',
      title: '提升任务成功率',
      description: `当前成功率仅 ${analysis.successRate}%，低于90%的健康阈值`,
      action: '建议检查任务逻辑、增加错误处理、优化重试策略'
    })
  }

  if (analysis.stabilityScore < 70) {
    suggestions.push({
      priority: 'high',
      category: 'stability',
      title: '提升任务稳定性',
      description: `稳定性评分 ${analysis.stabilityScore}/100，存在较大波动`,
      action: '建议优化资源配置、增加监控告警、设置合理的超时时间'
    })
  }

  if (anomalies.filter(a => a.type === 'duplicate').length > 0) {
    suggestions.push({
      priority: 'high',
      category: 'concurrency',
      title: '解决重复执行问题',
      description: '检测到重复执行异常',
      action: '建议实现分布式锁、增加任务幂等性校验、检查调度器配置'
    })
  }

  if (anomalies.filter(a => a.type === 'timeout').length > 0) {
    suggestions.push({
      priority: 'medium',
      category: 'performance',
      title: '优化任务执行性能',
      description: '存在超时执行的任务',
      action: '建议优化任务逻辑、分批处理数据、增加并行处理能力'
    })
  }

  if (configIssues.length > 0) {
    suggestions.push({
      priority: 'medium',
      category: 'configuration',
      title: '优化任务配置',
      description: `发现 ${configIssues.length} 个配置问题`,
      action: '建议审查并优化Cron表达式、超时时间、重试策略等配置'
    })
  }

  if (analysis.avgDuration > 300000) {
    suggestions.push({
      priority: 'low',
      category: 'performance',
      title: '缩短任务执行时间',
      description: `平均执行时间 ${analysis.avgDuration / 1000} 秒，超过5分钟`,
      action: '建议优化算法、增加缓存、考虑异步处理'
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      priority: 'low',
      category: 'maintenance',
      title: '任务运行状态良好',
      description: '当前任务各项指标均在健康范围内',
      action: '继续保持监控，定期检查任务执行情况'
    })
  }

  return {
    overallStatus: analysis.stabilityScore >= 80 ? 'good' : analysis.stabilityScore >= 60 ? 'warning' : 'poor',
    suggestions,
    summary: `稳定性评分 ${analysis.stabilityScore}/100，成功率 ${analysis.successRate}%，共 ${anomalies.length} 个异常待处理`
  }
}

const getTaskList = async () => {
  const logs = await CronLog.findAll({
    attributes: ['taskId', 'taskName', 'taskType', 'taskGroup'],
    group: ['taskId', 'taskName', 'taskType', 'taskGroup'],
    order: [['taskName', 'ASC']]
  })

  return success(logs.map(l => ({
    taskId: l.taskId,
    taskName: l.taskName,
    taskType: l.taskType,
    taskGroup: l.taskGroup
  })))
}

const getTypeList = () => success(TASK_TYPE_OPTIONS)
const getStatusList = () => success(STATUS_OPTIONS)
const getTriggerTypeList = () => success(TRIGGER_TYPE_OPTIONS)
const getAnomalyTypeList = () => success(ANOMALY_TYPE_OPTIONS)
const getRetryStrategyList = () => success(RETRY_STRATEGY_OPTIONS)

module.exports = {
  validateQueryParams,
  getList,
  getStats,
  getDetail,
  create,
  getTraceability,
  getTaskList,
  getTypeList,
  getStatusList,
  getTriggerTypeList,
  getAnomalyTypeList,
  getRetryStrategyList
}
