const { Op } = require('sequelize')
const { ServerMonitor, User } = require('../models')
const { success, failure, page } = require('../utils/response')

const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SUPER_OPS: 'super_ops',
  OPS: 'ops',
  USER: 'user'
}

const ALERT_TYPE_OPTIONS = [
  { value: 'none', label: '无预警' },
  { value: 'cpu', label: 'CPU预警' },
  { value: 'memory', label: '内存预警' },
  { value: 'disk', label: '磁盘预警' },
  { value: 'network', label: '网络预警' },
  { value: 'api', label: '接口预警' },
  { value: 'system', label: '系统预警' }
]

const ALERT_LEVEL_OPTIONS = [
  { value: 'none', label: '无', type: 'info' },
  { value: 'info', label: '提示', type: 'info' },
  { value: 'warning', label: '警告', type: 'warning' },
  { value: 'critical', label: '严重', type: 'danger' }
]

const ENVIRONMENT_OPTIONS = [
  { value: 'production', label: '生产环境' },
  { value: 'staging', label: '预发布环境' },
  { value: 'testing', label: '测试环境' },
  { value: 'development', label: '开发环境' }
]

const API_LOAD_LEVEL_OPTIONS = [
  { value: 'low', label: '低负载', type: 'success' },
  { value: 'normal', label: '正常', type: 'success' },
  { value: 'medium', label: '中负载', type: 'warning' },
  { value: 'high', label: '高负载', type: 'warning' },
  { value: 'overload', label: '过载', type: 'danger' }
]

const RISK_LEVEL_OPTIONS = [
  { value: 'low', label: '低风险', type: 'success' },
  { value: 'medium', label: '中风险', type: 'warning' },
  { value: 'high', label: '高风险', type: 'warning' },
  { value: 'critical', label: '严重风险', type: 'danger' }
]

const checkPermission = (userRole) => {
  return {
    canViewMonitor: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPER_OPS].includes(userRole),
    canViewSensitive: [UserRole.SUPER_ADMIN, UserRole.SUPER_OPS].includes(userRole),
    canExport: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPER_OPS].includes(userRole),
    canTrace: [UserRole.SUPER_ADMIN, UserRole.SUPER_OPS].includes(userRole)
  }
}

const validateQueryParams = (params, userRole) => {
  const errors = []
  const warnings = []

  const { startDate, endDate, serverId, environment, alertType, alertLevel } = params

  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    if (diffDays > 7) {
      errors.push('监控数据查询时间跨度不能超过7天，请分段查询')
    }

    if (diffDays > 3) {
      warnings.push('查询时间跨度较大，数据加载可能较慢')
    }

    if (start > end) {
      errors.push('开始时间不能晚于结束时间')
    }
  }

  if (environment && !ENVIRONMENT_OPTIONS.some(opt => opt.value === environment)) {
    errors.push('无效的环境类型')
  }

  if (alertType && !ALERT_TYPE_OPTIONS.some(opt => opt.value === alertType)) {
    errors.push('无效的预警类型')
  }

  if (alertLevel && !ALERT_LEVEL_OPTIONS.some(opt => opt.value === alertLevel)) {
    errors.push('无效的预警级别')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

const checkApiConnectivity = async () => {
  try {
    const count = await ServerMonitor.count({ limit: 1 })
    return {
      connected: true,
      lastUpdate: count > 0 ? new Date().toISOString() : null,
      message: '监控数据接口正常'
    }
  } catch (err) {
    return {
      connected: false,
      lastUpdate: null,
      message: `监控数据接口异常: ${err.message}`
    }
  }
}

const buildMonitorDetail = (record) => {
  const result = record.get ? record.get({ plain: true }) : { ...record }

  result.cpuUsage = parseFloat(result.cpuUsage) || 0
  result.cpuLoad1 = parseFloat(result.cpuLoad1) || 0
  result.cpuLoad5 = parseFloat(result.cpuLoad5) || 0
  result.cpuLoad15 = parseFloat(result.cpuLoad15) || 0
  result.memoryUsage = parseFloat(result.memoryUsage) || 0
  result.diskUsage = parseFloat(result.diskUsage) || 0
  result.apiQps = parseFloat(result.apiQps) || 0
  result.loadMatchScore = parseFloat(result.loadMatchScore) || 0

  try {
    if (result.alertThreshold && typeof result.alertThreshold === 'string') {
      result.alertThreshold = JSON.parse(result.alertThreshold)
    }
  } catch (e) { /* 保持原样 */ }

  try {
    if (result.extraInfo && typeof result.extraInfo === 'string') {
      result.extraInfo = JSON.parse(result.extraInfo)
    }
  } catch (e) { /* 保持原样 */ }

  result.memoryTotalMB = Math.round((result.memoryTotal || 0) / (1024 * 1024))
  result.memoryUsedMB = Math.round((result.memoryUsed || 0) / (1024 * 1024))
  result.diskTotalGB = Math.round((result.diskTotal || 0) / (1024 * 1024 * 1024))
  result.diskUsedGB = Math.round((result.diskUsed || 0) / (1024 * 1024 * 1024))
  result.networkInKB = Math.round((result.networkIn || 0) / 1024)
  result.networkOutKB = Math.round((result.networkOut || 0) / 1024)

  return result
}

const getPermission = (userRole) => {
  return success(checkPermission(userRole))
}

const getList = async (params, userRole) => {
  const perm = checkPermission(userRole)
  if (!perm.canViewMonitor) {
    return failure(403, '权限不足，仅超级运维人员可查看服务器监控数据')
  }

  const validation = validateQueryParams(params, userRole)
  if (!validation.valid) {
    return failure(400, validation.errors[0])
  }

  const connectivity = await checkApiConnectivity()

  const { pageNum = 1, pageSize = 20, serverId, serverName, environment, alertType, alertLevel, hasAlert, startDate, endDate, monitorType } = params

  const where = {}

  if (serverId) where.serverId = serverId
  if (environment) where.environment = environment
  if (alertType) where.alertType = alertType
  if (alertLevel) where.alertLevel = alertLevel
  if (monitorType) where.monitorType = monitorType
  if (hasAlert !== undefined && hasAlert !== null && hasAlert !== '') {
    where.hasAlert = hasAlert === 'true' || hasAlert === true
  }

  if (serverName) {
    where[Op.or] = [
      { serverName: { [Op.like]: `%${serverName}%` } },
      { serverIp: { [Op.like]: `%${serverName}%` } }
    ]
  }

  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  }

  const { count, rows } = await ServerMonitor.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    offset: (pageNum - 1) * pageSize,
    limit: pageSize
  })

  const data = rows.map(buildMonitorDetail)

  return page(data, count, pageNum, pageSize, {
    connectivity,
    validation,
    warnings: validation.warnings
  })
}

const getRealtimeData = async (params, userRole) => {
  const perm = checkPermission(userRole)
  if (!perm.canViewMonitor) {
    return failure(403, '权限不足，仅超级运维人员可查看服务器监控数据')
  }

  const connectivity = await checkApiConnectivity()

  const serverIds = params.serverIds ? params.serverIds.split(',') : null

  const where = { monitorType: 'snapshot' }
  if (serverIds && serverIds.length > 0) {
    where.serverId = { [Op.in]: serverIds }
  }
  if (params.environment) {
    where.environment = params.environment
  }

  const latestRecords = await ServerMonitor.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: serverIds ? serverIds.length * 2 : 50
  })

  const serverMap = new Map()
  latestRecords.forEach(record => {
    if (!serverMap.has(record.serverId)) {
      serverMap.set(record.serverId, buildMonitorDetail(record))
    }
  })

  const data = Array.from(serverMap.values())

  return success({
    data,
    connectivity,
    timestamp: new Date().toISOString()
  })
}

const getHistoryData = async (params, userRole) => {
  const perm = checkPermission(userRole)
  if (!perm.canViewMonitor) {
    return failure(403, '权限不足，仅超级运维人员可查看服务器监控数据')
  }

  const validation = validateQueryParams(params, userRole)
  if (!validation.valid) {
    return failure(400, validation.errors[0])
  }

  const { serverId, startDate, endDate, granularity = '5min' } = params

  if (!serverId) {
    return failure(400, '请指定服务器ID')
  }

  const where = { serverId }
  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  }

  const records = await ServerMonitor.findAll({
    where,
    order: [['createdAt', 'ASC']],
    limit: 1000
  })

  const data = records.map(buildMonitorDetail)

  return success({
    data,
    granularity,
    total: data.length
  })
}

const getPeakData = async (params, userRole) => {
  const perm = checkPermission(userRole)
  if (!perm.canViewMonitor) {
    return failure(403, '权限不足，仅超级运维人员可查看服务器监控数据')
  }

  const validation = validateQueryParams(params, userRole)
  if (!validation.valid) {
    return failure(400, validation.errors[0])
  }

  const { serverId, startDate, endDate, peakType } = params

  const where = { isPeak: true }
  if (serverId) where.serverId = serverId
  if (peakType) where.peakType = peakType
  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  }

  const records = await ServerMonitor.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 100
  })

  const data = records.map(buildMonitorDetail)

  const peakStats = {
    cpu: data.filter(d => d.peakType === 'cpu').length,
    memory: data.filter(d => d.peakType === 'memory').length,
    disk: data.filter(d => d.peakType === 'disk').length,
    network: data.filter(d => d.peakType === 'network').length,
    api: data.filter(d => d.peakType === 'api').length
  }

  return success({
    data,
    peakStats,
    total: data.length
  })
}

const getStats = async (params, userRole) => {
  const perm = checkPermission(userRole)
  if (!perm.canViewMonitor) {
    return failure(403, '权限不足，仅超级运维人员可查看服务器监控数据')
  }

  const validation = validateQueryParams(params, userRole)
  if (!validation.valid) {
    return failure(400, validation.errors[0])
  }

  const { startDate, endDate, environment, serverId } = params

  const where = {}
  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  }
  if (environment) where.environment = environment
  if (serverId) where.serverId = serverId

  const records = await ServerMonitor.findAll({
    where,
    order: [['createdAt', 'ASC']],
    limit: 2000,
    attributes: [
      'id', 'serverId', 'serverName', 'cpuUsage', 'memoryUsage', 'diskUsage',
      'apiQps', 'apiLoadLevel', 'hasAlert', 'alertType', 'alertLevel',
      'riskLevel', 'loadMatchScore', 'businessVolume', 'createdAt'
    ]
  })

  if (records.length === 0) {
    return success({
      summary: { totalRecords: 0, avgCpu: 0, avgMemory: 0, avgDisk: 0, avgQps: 0, alertCount: 0 },
      alertsByType: {},
      alertsByLevel: {},
      riskDistribution: {},
      loadDistribution: {},
      trend: []
    })
  }

  const totalRecords = records.length
  const avgCpu = parseFloat((records.reduce((sum, r) => sum + parseFloat(r.cpuUsage || 0), 0) / totalRecords).toFixed(2))
  const avgMemory = parseFloat((records.reduce((sum, r) => sum + parseFloat(r.memoryUsage || 0), 0) / totalRecords).toFixed(2))
  const avgDisk = parseFloat((records.reduce((sum, r) => sum + parseFloat(r.diskUsage || 0), 0) / totalRecords).toFixed(2))
  const avgQps = parseFloat((records.reduce((sum, r) => sum + parseFloat(r.apiQps || 0), 0) / totalRecords).toFixed(2))
  const alertCount = records.filter(r => r.hasAlert).length

  const alertsByType = {}
  ALERT_TYPE_OPTIONS.forEach(opt => {
    alertsByType[opt.value] = records.filter(r => r.alertType === opt.value).length
  })

  const alertsByLevel = {}
  ALERT_LEVEL_OPTIONS.forEach(opt => {
    alertsByLevel[opt.value] = records.filter(r => r.alertLevel === opt.value).length
  })

  const riskDistribution = {}
  RISK_LEVEL_OPTIONS.forEach(opt => {
    riskDistribution[opt.value] = records.filter(r => r.riskLevel === opt.value).length
  })

  const loadDistribution = {}
  API_LOAD_LEVEL_OPTIONS.forEach(opt => {
    loadDistribution[opt.value] = records.filter(r => r.apiLoadLevel === opt.value).length
  })

  const trendData = {}
  records.forEach(r => {
    const hour = new Date(r.createdAt).toISOString().slice(0, 13)
    if (!trendData[hour]) {
      trendData[hour] = { time: hour, count: 0, cpuSum: 0, memorySum: 0, qpsSum: 0, alertCount: 0 }
    }
    trendData[hour].count++
    trendData[hour].cpuSum += parseFloat(r.cpuUsage || 0)
    trendData[hour].memorySum += parseFloat(r.memoryUsage || 0)
    trendData[hour].qpsSum += parseFloat(r.apiQps || 0)
    if (r.hasAlert) trendData[hour].alertCount++
  })

  const trend = Object.values(trendData).map(d => ({
    time: d.time,
    avgCpu: parseFloat((d.cpuSum / d.count).toFixed(2)),
    avgMemory: parseFloat((d.memorySum / d.count).toFixed(2)),
    avgQps: parseFloat((d.qpsSum / d.count).toFixed(2)),
    alertCount: d.alertCount
  })).sort((a, b) => a.time.localeCompare(b.time))

  return success({
    summary: {
      totalRecords,
      avgCpu,
      avgMemory,
      avgDisk,
      avgQps,
      alertCount
    },
    alertsByType,
    alertsByLevel,
    riskDistribution,
    loadDistribution,
    trend
  })
}

const getAlertDetail = async (id, userRole) => {
  const perm = checkPermission(userRole)
  if (!perm.canViewMonitor) {
    return failure(403, '权限不足，仅超级运维人员可查看服务器监控数据')
  }

  const record = await ServerMonitor.findByPk(id)
  if (!record) {
    return failure(404, '监控记录不存在')
  }

  if (!record.hasAlert) {
    return failure(400, '该记录无预警信息')
  }

  const detail = buildMonitorDetail(record)

  const start = new Date(record.createdAt)
  start.setHours(start.getHours() - 1)
  const end = new Date(record.createdAt)
  end.setHours(end.getHours() + 1)

  const relatedRecords = await ServerMonitor.findAll({
    where: {
      serverId: record.serverId,
      createdAt: { [Op.between]: [start, end] }
    },
    order: [['createdAt', 'ASC']],
    limit: 50
  })

  detail.anomalyPeriod = relatedRecords.map(buildMonitorDetail)

  return success(detail)
}

const exportData = async (params, userRole, onProgress) => {
  const perm = checkPermission(userRole)
  if (!perm.canExport) {
    return failure(403, '权限不足，仅超级运维人员可导出监控数据')
  }

  const validation = validateQueryParams(params, userRole)
  if (!validation.valid) {
    return failure(400, validation.errors[0])
  }

  const { startDate, endDate, serverId, includeAlerts = true, format = 'json' } = params

  const where = {}
  if (serverId) where.serverId = serverId
  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  }

  const totalCount = await ServerMonitor.count({ where })

  const batchSize = 500
  const batches = Math.ceil(totalCount / batchSize)
  const allData = []

  for (let i = 0; i < batches; i++) {
    const records = await ServerMonitor.findAll({
      where,
      order: [['createdAt', 'ASC']],
      offset: i * batchSize,
      limit: batchSize
    })

    const filtered = records.filter(r => {
      const hasValidData = (r.cpuUsage > 0 || r.memoryUsage > 0 || r.diskUsage > 0 || r.apiTotalRequests > 0)
      if (!includeAlerts && r.hasAlert) return false
      return hasValidData
    })

    allData.push(...filtered.map(buildMonitorDetail))

    if (onProgress) {
      onProgress(Math.round(((i + 1) / batches) * 100))
    }
  }

  const exportInfo = {
    exportTime: new Date().toISOString(),
    totalRecords: totalCount,
    validRecords: allData.length,
    emptyRecords: totalCount - allData.length,
    filters: { startDate, endDate, serverId, includeAlerts },
    format
  }

  return success({
    data: allData,
    exportInfo,
    fileName: `server_monitor_${Date.now()}.${format}`
  })
}

const getTraceability = async (params, userRole) => {
  const perm = checkPermission(userRole)
  if (!perm.canTrace) {
    return failure(403, '权限不足，仅超级运维人员可进行异常溯源分析')
  }

  const validation = validateQueryParams(params, userRole)
  if (!validation.valid) {
    return failure(400, validation.errors[0])
  }

  const { serverId, startDate, endDate, traceType } = params

  if (!serverId) {
    return failure(400, '请指定服务器ID进行溯源')
  }

  const where = { serverId }
  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  }
  if (traceType === 'alert') {
    where.hasAlert = true
  }

  const records = await ServerMonitor.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 200
  })

  if (records.length === 0) {
    return failure(404, '未找到该服务器的监控数据')
  }

  const data = records.map(buildMonitorDetail)

  const anomalyDetection = detectAnomalies(data)
  const loadMatching = validateLoadMatching(data)
  const riskPrediction = predictRisks(data)
  const optimizationSuggestions = generateOptimizationSuggestions(anomalyDetection, loadMatching, riskPrediction)

  return success({
    serverOverview: {
      serverId: records[0].serverId,
      serverName: records[0].serverName,
      serverIp: records[0].serverIp,
      environment: records[0].environment,
      region: records[0].region,
      totalRecords: records.length,
      analysisPeriod: startDate && endDate ? `${startDate} ~ ${endDate}` : '最近200条记录'
    },
    executionTimeline: data,
    resourceAnalysis: analyzeResourceUsage(data),
    anomalyDetection,
    loadMatching,
    riskPrediction,
    optimizationSuggestions
  })
}

const detectAnomalies = (records) => {
  const anomalies = []

  records.forEach((record, index) => {
    if (record.cpuUsage > 90) {
      anomalies.push({
        type: 'cpu_overload',
        severity: record.cpuUsage > 95 ? 'critical' : 'warning',
        time: record.createdAt,
        recordId: record.id,
        message: `CPU使用率过高: ${record.cpuUsage}%`,
        value: record.cpuUsage
      })
    }

    if (record.memoryUsage > 90) {
      anomalies.push({
        type: 'memory_overload',
        severity: record.memoryUsage > 95 ? 'critical' : 'warning',
        time: record.createdAt,
        recordId: record.id,
        message: `内存使用率过高: ${record.memoryUsage}%`,
        value: record.memoryUsage
      })
    }

    if (record.diskUsage > 90) {
      anomalies.push({
        type: 'disk_overload',
        severity: record.diskUsage > 95 ? 'critical' : 'warning',
        time: record.createdAt,
        recordId: record.id,
        message: `磁盘使用率过高: ${record.diskUsage}%`,
        value: record.diskUsage
      })
    }

    if (record.apiLoadLevel === 'overload') {
      anomalies.push({
        type: 'api_overload',
        severity: 'critical',
        time: record.createdAt,
        recordId: record.id,
        message: `接口过载，QPS: ${record.apiQps}，响应时间: ${record.apiAvgResponseTime}ms`,
        value: record.apiQps
      })
    }

    if (record.hasAlert && record.alertLevel === 'critical') {
      anomalies.push({
        type: 'system_crash',
        severity: 'critical',
        time: record.createdAt,
        recordId: record.id,
        message: `严重预警: ${record.alertMessage || record.alertType}`,
        value: record.alertType
      })
    }

    if (index > 0) {
      const prev = records[index - 1]
      if (prev.apiAvgResponseTime > 0 && record.apiAvgResponseTime > prev.apiAvgResponseTime * 3) {
        anomalies.push({
          type: 'api_timeout',
          severity: 'warning',
          time: record.createdAt,
          recordId: record.id,
          message: `接口响应时间突增: ${prev.apiAvgResponseTime}ms → ${record.apiAvgResponseTime}ms`,
          value: record.apiAvgResponseTime
        })
      }
    }
  })

  return {
    anomalies,
    totalAnomalies: anomalies.length,
    criticalCount: anomalies.filter(a => a.severity === 'critical').length,
    warningCount: anomalies.filter(a => a.severity === 'warning').length,
    byType: {
      cpu_overload: anomalies.filter(a => a.type === 'cpu_overload').length,
      memory_overload: anomalies.filter(a => a.type === 'memory_overload').length,
      disk_overload: anomalies.filter(a => a.type === 'disk_overload').length,
      api_overload: anomalies.filter(a => a.type === 'api_overload').length,
      api_timeout: anomalies.filter(a => a.type === 'api_timeout').length,
      system_crash: anomalies.filter(a => a.type === 'system_crash').length
    }
  }
}

const validateLoadMatching = (records) => {
  const validRecords = records.filter(r => r.businessVolume > 0)

  if (validRecords.length < 10) {
    return {
      valid: false,
      message: '数据量不足，无法进行负载匹配校验',
      avgMatchScore: 0,
      mismatchedPeriods: []
    }
  }

  let lowVolumeHighLoad = 0
  let highVolumeLowLoad = 0
  const mismatchedPeriods = []

  validRecords.forEach(r => {
    const avgLoad = (parseFloat(r.cpuUsage) + parseFloat(r.memoryUsage) + parseFloat(r.diskUsage)) / 3

    if (r.businessVolume < 100 && avgLoad > 70) {
      lowVolumeHighLoad++
      mismatchedPeriods.push({
        time: r.createdAt,
        type: 'low_volume_high_load',
        businessVolume: r.businessVolume,
        avgLoad: avgLoad.toFixed(2),
        message: '业务量低但服务器负载高，可能存在资源浪费或异常进程'
      })
    }

    if (r.businessVolume > 1000 && avgLoad < 20) {
      highVolumeLowLoad++
      mismatchedPeriods.push({
        time: r.createdAt,
        type: 'high_volume_low_load',
        businessVolume: r.businessVolume,
        avgLoad: avgLoad.toFixed(2),
        message: '业务量高但服务器负载低，资源配置可能过剩'
      })
    }
  })

  const avgMatchScore = parseFloat((validRecords.reduce((sum, r) => sum + parseFloat(r.loadMatchScore || 0), 0) / validRecords.length).toFixed(2))

  return {
    valid: true,
    avgMatchScore,
    lowVolumeHighLoadCount: lowVolumeHighLoad,
    highVolumeLowLoadCount: highVolumeLowLoad,
    totalMismatches: mismatchedPeriods.length,
    mismatchedPeriods: mismatchedPeriods.slice(0, 20)
  }
}

const predictRisks = (records) => {
  const recentRecords = records.slice(0, 50)

  if (recentRecords.length < 10) {
    return {
      risks: [],
      overallRisk: 'low',
      message: '数据量不足，无法进行风险预测'
    }
  }

  const risks = []

  const avgCpu = recentRecords.reduce((sum, r) => sum + parseFloat(r.cpuUsage || 0), 0) / recentRecords.length
  const cpuTrend = recentRecords.slice(0, 10).reduce((s, r) => s + parseFloat(r.cpuUsage || 0), 0) / 10 -
                   recentRecords.slice(-10).reduce((s, r) => s + parseFloat(r.cpuUsage || 0), 0) / 10

  if (avgCpu > 75 && cpuTrend < -5) {
    risks.push({
      type: 'cpu_risk',
      level: 'high',
      title: 'CPU负载持续上升风险',
      description: `近50条记录平均CPU使用率 ${avgCpu.toFixed(1)}%，呈上升趋势`,
      suggestion: '建议扩容或优化高CPU消耗进程'
    })
  }

  const avgMemory = recentRecords.reduce((sum, r) => sum + parseFloat(r.memoryUsage || 0), 0) / recentRecords.length
  if (avgMemory > 80) {
    risks.push({
      type: 'memory_risk',
      level: avgMemory > 90 ? 'critical' : 'high',
      title: '内存使用率过高风险',
      description: `平均内存使用率 ${avgMemory.toFixed(1)}%`,
      suggestion: '建议检查内存泄漏，考虑增加内存或优化内存使用'
    })
  }

  const avgDisk = recentRecords.reduce((sum, r) => sum + parseFloat(r.diskUsage || 0), 0) / recentRecords.length
  if (avgDisk > 85) {
    risks.push({
      type: 'disk_risk',
      level: avgDisk > 95 ? 'critical' : 'high',
      title: '磁盘空间不足风险',
      description: `平均磁盘使用率 ${avgDisk.toFixed(1)}%`,
      suggestion: '建议清理磁盘空间或扩容磁盘'
    })
  }

  const avgResponse = recentRecords.reduce((sum, r) => sum + (r.apiAvgResponseTime || 0), 0) / recentRecords.length
  if (avgResponse > 1000) {
    risks.push({
      type: 'api_performance_risk',
      level: 'medium',
      title: '接口响应慢风险',
      description: `平均响应时间 ${avgResponse.toFixed(0)}ms`,
      suggestion: '建议排查慢接口，进行性能优化'
    })
  }

  const alertRate = recentRecords.filter(r => r.hasAlert).length / recentRecords.length
  if (alertRate > 0.2) {
    risks.push({
      type: 'stability_risk',
      level: 'high',
      title: '系统稳定性风险',
      description: `预警率 ${(alertRate * 100).toFixed(1)}%，超过20%阈值`,
      suggestion: '建议全面排查系统稳定性问题'
    })
  }

  if (risks.length === 0) {
    risks.push({
      type: 'none',
      level: 'low',
      title: '运行状态良好',
      description: '未检测到明显风险',
      suggestion: '继续保持监控'
    })
  }

  const overallRisk = risks.some(r => r.level === 'critical') ? 'critical'
    : risks.some(r => r.level === 'high') ? 'high'
    : risks.some(r => r.level === 'medium') ? 'medium'
    : 'low'

  return {
    risks,
    overallRisk,
    predictionWindow: `${recentRecords.length} 条记录`
  }
}

const analyzeResourceUsage = (records) => {
  if (records.length === 0) return {}

  const cpuUsages = records.map(r => parseFloat(r.cpuUsage || 0))
  const memoryUsages = records.map(r => parseFloat(r.memoryUsage || 0))
  const diskUsages = records.map(r => parseFloat(r.diskUsage || 0))
  const qpsValues = records.map(r => parseFloat(r.apiQps || 0))
  const responseTimes = records.map(r => r.apiAvgResponseTime || 0).filter(t => t > 0)

  return {
    cpu: {
      avg: parseFloat((cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length).toFixed(2)),
      max: Math.max(...cpuUsages),
      min: Math.min(...cpuUsages),
      p95: getPercentile(cpuUsages, 95)
    },
    memory: {
      avg: parseFloat((memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length).toFixed(2)),
      max: Math.max(...memoryUsages),
      min: Math.min(...memoryUsages),
      p95: getPercentile(memoryUsages, 95)
    },
    disk: {
      avg: parseFloat((diskUsages.reduce((a, b) => a + b, 0) / diskUsages.length).toFixed(2)),
      max: Math.max(...diskUsages),
      min: Math.min(...diskUsages),
      p95: getPercentile(diskUsages, 95)
    },
    api: {
      avgQps: parseFloat((qpsValues.reduce((a, b) => a + b, 0) / qpsValues.length).toFixed(2)),
      maxQps: Math.max(...qpsValues),
      avgResponseTime: responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
      p95ResponseTime: responseTimes.length > 0 ? getPercentile(responseTimes, 95) : 0
    }
  }
}

const getPercentile = (arr, p) => {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return parseFloat(sorted[Math.max(0, Math.min(idx, sorted.length - 1))].toFixed(2))
}

const generateOptimizationSuggestions = (anomalyDetection, loadMatching, riskPrediction) => {
  const suggestions = []

  if (anomalyDetection.criticalCount > 0) {
    suggestions.push({
      priority: 'high',
      category: 'urgent',
      title: '紧急处理严重预警',
      description: `检测到 ${anomalyDetection.criticalCount} 个严重异常，需立即处理`,
      action: '立即查看严重预警记录，排查系统卡顿、崩溃、接口超时问题'
    })
  }

  if (anomalyDetection.byType.cpu_overload > 5) {
    suggestions.push({
      priority: 'high',
      category: 'resource',
      title: 'CPU资源优化',
      description: 'CPU过载频繁发生',
      action: '建议分析高CPU进程，考虑服务拆分、水平扩容或代码优化'
    })
  }

  if (anomalyDetection.byType.memory_overload > 5) {
    suggestions.push({
      priority: 'high',
      category: 'resource',
      title: '内存资源优化',
      description: '内存过载频繁发生',
      action: '建议排查内存泄漏问题，优化内存使用，考虑增加内存容量'
    })
  }

  if (anomalyDetection.byType.api_timeout > 3) {
    suggestions.push({
      priority: 'high',
      category: 'performance',
      title: '接口性能优化',
      description: '接口响应时间存在突增情况',
      action: '建议分析慢接口，优化数据库查询，增加缓存机制'
    })
  }

  if (loadMatching.lowVolumeHighLoadCount > 3) {
    suggestions.push({
      priority: 'medium',
      category: 'efficiency',
      title: '资源利用效率优化',
      description: '存在业务量低但负载高的时段',
      action: '建议排查异常进程、定时任务冲突、后台资源泄漏等问题'
    })
  }

  if (riskPrediction.risks.some(r => r.type === 'disk_risk')) {
    suggestions.push({
      priority: 'medium',
      category: 'resource',
      title: '磁盘容量规划',
      description: '磁盘使用率过高，存在空间不足风险',
      action: '建议制定磁盘清理策略，配置自动扩容告警，评估存储扩容需求'
    })
  }

  if (loadMatching.avgMatchScore < 70 && loadMatching.avgMatchScore > 0) {
    suggestions.push({
      priority: 'medium',
      category: 'capacity',
      title: '负载均衡优化',
      description: `负载匹配评分仅 ${loadMatching.avgMatchScore}/100`,
      action: '建议重新评估服务器配置与业务量的匹配度，优化资源分配'
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      priority: 'low',
      category: 'maintenance',
      title: '系统运行良好',
      description: '未检测到明显问题',
      action: '继续保持监控，定期进行运维巡检'
    })
  }

  return {
    suggestions,
    overallStatus: riskPrediction.overallRisk,
    summary: `共 ${suggestions.length} 条优化建议，风险等级: ${riskPrediction.overallRisk}`
  }
}

const getServerList = async (userRole) => {
  const perm = checkPermission(userRole)
  if (!perm.canViewMonitor) {
    return failure(403, '权限不足')
  }

  const records = await ServerMonitor.findAll({
    attributes: ['serverId', 'serverName', 'serverIp', 'environment', 'region'],
    group: ['serverId', 'serverName', 'serverIp', 'environment', 'region'],
    order: [['serverName', 'ASC']]
  })

  return success(records)
}

const getAlertTypeList = () => success(ALERT_TYPE_OPTIONS)
const getAlertLevelList = () => success(ALERT_LEVEL_OPTIONS)
const getEnvironmentList = () => success(ENVIRONMENT_OPTIONS)
const getApiLoadLevelList = () => success(API_LOAD_LEVEL_OPTIONS)
const getRiskLevelList = () => success(RISK_LEVEL_OPTIONS)

module.exports = {
  checkPermission,
  validateQueryParams,
  getPermission,
  getList,
  getRealtimeData,
  getHistoryData,
  getPeakData,
  getStats,
  getAlertDetail,
  exportData,
  getTraceability,
  getServerList,
  getAlertTypeList,
  getAlertLevelList,
  getEnvironmentList,
  getApiLoadLevelList,
  getRiskLevelList
}
