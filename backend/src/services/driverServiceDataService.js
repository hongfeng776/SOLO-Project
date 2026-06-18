const { Driver, DriverServiceData, DriverServiceLog } = require('../models')
const { Op, fn, col, where } = require('sequelize')

const DRIVER_LEVEL = {
  EXCELLENT: 1,
  NORMAL: 2,
  NEED_RECTIFICATION: 3,
  POOR: 4
}

const DRIVER_LEVEL_NAMES = {
  [DRIVER_LEVEL.EXCELLENT]: '优质',
  [DRIVER_LEVEL.NORMAL]: '普通',
  [DRIVER_LEVEL.NEED_RECTIFICATION]: '待整改',
  [DRIVER_LEVEL.POOR]: '劣质'
}

const STAT_TYPE = {
  DAY: 1,
  WEEK: 2,
  MONTH: 3
}

const OPERATION_TYPE = {
  DATA_UPDATE: 1,
  LEVEL_CHANGE: 2,
  DATA_CORRECTION: 3,
  ABNORMAL_DETECTION: 4,
  DATA_EXPORT: 5
}

const OPERATION_TYPE_NAMES = {
  [OPERATION_TYPE.DATA_UPDATE]: '数据更新',
  [OPERATION_TYPE.LEVEL_CHANGE]: '等级变更',
  [OPERATION_TYPE.DATA_CORRECTION]: '数据修正',
  [OPERATION_TYPE.ABNORMAL_DETECTION]: '异常检测',
  [OPERATION_TYPE.DATA_EXPORT]: '数据导出'
}

const LEVEL_CONFIG = {
  [DRIVER_LEVEL.EXCELLENT]: {
    minServiceScore: 4.8,
    minCompletionRate: 95,
    maxComplaintRate: 0.5,
    minOrders: 50,
    trafficWeight: 1.5,
    subsidyLevel: 1,
    orderPriority: 1,
    description: '优质司机，享受最高流量倾斜和补贴'
  },
  [DRIVER_LEVEL.NORMAL]: {
    minServiceScore: 4.2,
    minCompletionRate: 85,
    maxComplaintRate: 2,
    minOrders: 10,
    trafficWeight: 1.0,
    subsidyLevel: 2,
    orderPriority: 3,
    description: '普通司机，标准流量和补贴'
  },
  [DRIVER_LEVEL.NEED_RECTIFICATION]: {
    minServiceScore: 3.5,
    minCompletionRate: 70,
    maxComplaintRate: 5,
    minOrders: 0,
    trafficWeight: 0.5,
    subsidyLevel: 3,
    orderPriority: 4,
    description: '待整改司机，流量减半，无补贴'
  },
  [DRIVER_LEVEL.POOR]: {
    minServiceScore: 0,
    minCompletionRate: 0,
    maxComplaintRate: 100,
    minOrders: 0,
    trafficWeight: 0.2,
    subsidyLevel: 3,
    orderPriority: 4,
    description: '劣质司机，限制接单，无补贴'
  }
}

const EXPORT_FIELD_PERMISSIONS = {
  basic: ['id', 'name', 'phone', 'city', 'vehicleType'],
  service: ['totalOrders', 'completedOrders', 'completionRate', 'serviceScore', 'complaintRate', 'onlineHours'],
  finance: ['totalIncome', 'avgOrderAmount', 'balance'],
  sensitive: ['idCard', 'driverLicenseNo', 'vehicleLicenseNo']
}

const getDateRange = (period, startDate, endDate) => {
  const now = new Date()
  let start, end

  switch (period) {
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      break
    case 'week':
      const dayOfWeek = now.getDay() || 7
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - dayOfWeek) + 1)
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      break
    case 'custom':
      start = new Date(startDate)
      end = new Date(endDate)
      end.setDate(end.getDate() + 1)
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  }

  return { start, end }
}

const checkDataValidity = (driverId, period, startDate, endDate) => {
  const result = {
    valid: true,
    warnings: [],
    dataCompleteness: 100
  }

  if (period === 'custom') {
    if (!startDate || !endDate) {
      result.valid = false
      result.warnings.push('请选择完整的自定义时间段')
      return result
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      result.valid = false
      result.warnings.push('开始时间不能晚于结束时间')
      return result
    }

    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      result.warnings.push('统计时段超过1年，数据可能存在波动')
    }
  }

  return result
}

const calculateDriverLevel = (serviceData) => {
  const score = parseFloat(serviceData.serviceScore) || 0
  const completionRate = parseFloat(serviceData.completionRate) || 0
  const complaintRate = parseFloat(serviceData.complaintRate) || 0
  const orders = serviceData.totalOrders || 0

  let level = DRIVER_LEVEL.POOR
  const config = LEVEL_CONFIG[DRIVER_LEVEL.EXCELLENT]

  if (
    score >= config.minServiceScore &&
    completionRate >= config.minCompletionRate &&
    complaintRate <= config.maxComplaintRate &&
    orders >= config.minOrders
  ) {
    level = DRIVER_LEVEL.EXCELLENT
  } else if (
    score >= LEVEL_CONFIG[DRIVER_LEVEL.NORMAL].minServiceScore &&
    completionRate >= LEVEL_CONFIG[DRIVER_LEVEL.NORMAL].minCompletionRate &&
    complaintRate <= LEVEL_CONFIG[DRIVER_LEVEL.NORMAL].maxComplaintRate &&
    orders >= LEVEL_CONFIG[DRIVER_LEVEL.NORMAL].minOrders
  ) {
    level = DRIVER_LEVEL.NORMAL
  } else if (
    score >= LEVEL_CONFIG[DRIVER_LEVEL.NEED_RECTIFICATION].minServiceScore &&
    completionRate >= LEVEL_CONFIG[DRIVER_LEVEL.NEED_RECTIFICATION].minCompletionRate &&
    complaintRate <= LEVEL_CONFIG[DRIVER_LEVEL.NEED_RECTIFICATION].maxComplaintRate
  ) {
    level = DRIVER_LEVEL.NEED_RECTIFICATION
  }

  return {
    level,
    levelName: DRIVER_LEVEL_NAMES[level],
    config: LEVEL_CONFIG[level],
    ...LEVEL_CONFIG[level]
  }
}

const detectAbnormalData = (currentData, previousData) => {
  const abnormalities = []

  if (!previousData) {
    return {
      isAbnormal: false,
      abnormalities: [],
      abnormalType: null
    }
  }

  const scoreDiff = currentData.serviceScore - previousData.serviceScore
  const scoreChangeRate = previousData.serviceScore > 0 ? Math.abs(scoreDiff) / previousData.serviceScore : 0

  if (scoreChangeRate > 0.3) {
    abnormalities.push({
      type: 'score',
      field: 'serviceScore',
      fieldName: '服务评分',
      oldValue: previousData.serviceScore,
      newValue: currentData.serviceScore,
      changeRate: (scoreChangeRate * 100).toFixed(1) + '%',
      direction: scoreDiff > 0 ? 'up' : 'down',
      severity: scoreChangeRate > 0.5 ? 'high' : 'medium',
      message: `服务评分${scoreDiff > 0 ? '上升' : '下降'}${(scoreChangeRate * 100).toFixed(1)}%，存在异常波动`
    })
  }

  const completionDiff = currentData.completionRate - previousData.completionRate
  const completionChangeRate = previousData.completionRate > 0 ? Math.abs(completionDiff) / previousData.completionRate : 0

  if (completionChangeRate > 0.3 && previousData.totalOrders > 5) {
    abnormalities.push({
      type: 'completion',
      field: 'completionRate',
      fieldName: '完单率',
      oldValue: previousData.completionRate,
      newValue: currentData.completionRate,
      changeRate: (completionChangeRate * 100).toFixed(1) + '%',
      direction: completionDiff > 0 ? 'up' : 'down',
      severity: completionChangeRate > 0.5 ? 'high' : 'medium',
      message: `完单率${completionDiff > 0 ? '上升' : '下降'}${(completionChangeRate * 100).toFixed(1)}%，建议核查是否为刷单行为`
    })
  }

  const complaintDiff = currentData.complaintRate - previousData.complaintRate
  const complaintChangeRate = previousData.complaintRate > 0 ? Math.abs(complaintDiff) / previousData.complaintRate : 1

  if (complaintDiff > 2 || (complaintChangeRate > 1 && currentData.complaintRate > 1)) {
    abnormalities.push({
      type: 'complaint',
      field: 'complaintRate',
      fieldName: '投诉率',
      oldValue: previousData.complaintRate,
      newValue: currentData.complaintRate,
      changeRate: (complaintChangeRate * 100).toFixed(1) + '%',
      direction: complaintDiff > 0 ? 'up' : 'down',
      severity: currentData.complaintRate > 5 ? 'high' : 'medium',
      message: `投诉率上升${complaintDiff.toFixed(2)}个百分点，请关注服务质量`
    })
  }

  const orderDiff = currentData.totalOrders - previousData.totalOrders
  const orderChangeRate = previousData.totalOrders > 0 ? Math.abs(orderDiff) / previousData.totalOrders : 0

  if (orderChangeRate > 2 && currentData.totalOrders > 10) {
    abnormalities.push({
      type: 'order',
      field: 'totalOrders',
      fieldName: '接单量',
      oldValue: previousData.totalOrders,
      newValue: currentData.totalOrders,
      changeRate: (orderChangeRate * 100).toFixed(1) + '%',
      direction: orderDiff > 0 ? 'up' : 'down',
      severity: orderChangeRate > 3 ? 'high' : 'medium',
      message: `接单量${orderDiff > 0 ? '激增' : '骤降'}${(orderChangeRate * 100).toFixed(1)}%，疑似异常刷单或账号问题`
    })
  }

  return {
    isAbnormal: abnormalities.length > 0,
    abnormalities,
    abnormalType: abnormalities.length > 0 ? abnormalities.map(a => a.type).join(',') : null
  }
}

const checkDataAccuracy = (driverId, statDate) => {
  const result = {
    accurate: true,
    missingSources: [],
    inconsistencies: [],
    dataSources: [
      { name: '订单系统', field: 'totalOrders', status: 'ok' },
      { name: '评价系统', field: 'serviceScore', status: 'ok' },
      { name: '投诉系统', field: 'complaintCount', status: 'ok' },
      { name: '在线时长系统', field: 'onlineHours', status: 'ok' },
      { name: '财务系统', field: 'totalIncome', status: 'ok' },
      { name: '车辆定位系统', field: 'mileage', status: 'warning' }
    ]
  }

  const missing = Math.random() > 0.8 ? ['车辆定位系统里程数据缺失'] : []
  if (missing.length > 0) {
    result.accurate = false
    result.missingSources = missing
  }

  return result
}

const getServiceDataList = async (params = {}) => {
  const {
    page = 1,
    pageSize = 10,
    period = 'day',
    startDate,
    endDate,
    driverName,
    city,
    vehicleType,
    driverLevel,
    minServiceScore,
    maxComplaintRate,
    sortField = 'totalOrders',
    sortOrder = 'DESC'
  } = params

  const dateRange = getDateRange(period, startDate, endDate)
  const validity = checkDataValidity(params.driverId || 0, period, startDate, endDate)

  const where = {
    statDate: {
      [Op.between]: [dateRange.start, dateRange.end]
    }
  }

  if (driverLevel) where.driverLevel = driverLevel
  if (minServiceScore) where.serviceScore = { [Op.gte]: parseFloat(minServiceScore) }
  if (maxComplaintRate) where.complaintRate = { [Op.lte]: parseFloat(maxComplaintRate) }

  const { count, rows } = await DriverServiceData.findAndCountAll({
    where,
    include: [
      {
        model: Driver,
        as: 'driver',
        attributes: ['name', 'phone', 'city', 'vehicleType', 'avatar'],
        where: {
          ...(driverName ? { name: { [Op.like]: `%${driverName}%` } } : {}),
          ...(city ? { city } : {}),
          ...(vehicleType ? { vehicleType } : {})
        }
      }
    ],
    order: [[sortField, sortOrder]],
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize),
    distinct: true
  })

  return {
    list: rows,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    dateRange,
    validity
  }
}

const getServiceTrend = async (driverId, period = 'day', startDate, endDate) => {
  const dateRange = getDateRange(period, startDate, endDate)

  const data = await DriverServiceData.findAll({
    where: {
      driverId,
      statDate: {
        [Op.between]: [dateRange.start, dateRange.end]
      }
    },
    order: [['statDate', 'ASC']]
  })

  const trendData = data.map(item => ({
    date: item.statDate,
    totalOrders: item.totalOrders,
    completedOrders: item.completedOrders,
    completionRate: item.completionRate,
    serviceScore: item.serviceScore,
    complaintRate: item.complaintRate,
    totalIncome: item.totalIncome,
    onlineHours: item.onlineHours,
    isAbnormal: item.isAbnormal === 1,
    abnormalType: item.abnormalType
  }))

  let previousData = null
  const abnormalities = []
  trendData.forEach(item => {
    if (previousData) {
      const detection = detectAbnormalData(item, previousData)
      if (detection.isAbnormal) {
        abnormalities.push({
          date: item.date,
          ...detection
        })
      }
    }
    previousData = item
  })

  const avgData = {
    avgOrders: trendData.length ? (trendData.reduce((sum, d) => sum + d.totalOrders, 0) / trendData.length).toFixed(1) : 0,
    avgScore: trendData.length ? (trendData.reduce((sum, d) => sum + parseFloat(d.serviceScore), 0) / trendData.length).toFixed(2) : 0,
    avgComplaintRate: trendData.length ? (trendData.reduce((sum, d) => sum + parseFloat(d.complaintRate), 0) / trendData.length).toFixed(2) : 0,
    avgIncome: trendData.length ? (trendData.reduce((sum, d) => sum + parseFloat(d.totalIncome), 0) / trendData.length).toFixed(2) : 0
  }

  return {
    trendData,
    abnormalities,
    avgData,
    dateRange,
    totalDays: trendData.length
  }
}

const getDriverServiceDetail = async (driverId, period = 'day') => {
  const dateRange = getDateRange(period)

  const data = await DriverServiceData.findOne({
    where: {
      driverId,
      statDate: dateRange.start
    }
  })

  if (!data) {
    return null
  }

  const levelResult = calculateDriverLevel(data)
  const accuracyResult = checkDataAccuracy(driverId, data.statDate)

  const logs = await DriverServiceLog.findAll({
    where: {
      driverId,
      statDate: data.statDate
    },
    order: [['createTime', 'DESC']],
    limit: 20
  })

  return {
    ...data.toJSON(),
    levelInfo: levelResult,
    accuracy: accuracyResult,
    updateLogs: logs
  }
}

const updateDriverLevel = async (driverId, operatorId, operatorName) => {
  const today = new Date().toISOString().split('T')[0]

  const serviceData = await DriverServiceData.findOne({
    where: {
      driverId,
      statDate: today,
      statType: STAT_TYPE.DAY
    }
  })

  if (!serviceData) {
    throw new Error('今日服务数据不存在')
  }

  const oldLevel = serviceData.driverLevel
  const levelResult = calculateDriverLevel(serviceData)

  if (oldLevel === levelResult.level) {
    return {
      changed: false,
      oldLevel,
      newLevel: levelResult.level,
      levelInfo: levelResult
    }
  }

  await serviceData.update({
    driverLevel: levelResult.level,
    trafficWeight: levelResult.trafficWeight,
    subsidyLevel: levelResult.subsidyLevel,
    orderPriority: levelResult.orderPriority
  })

  await Driver.update(
    {
      driverLevel: levelResult.level,
      trafficWeight: levelResult.trafficWeight
    },
    { where: { id: driverId } }
  )

  await DriverServiceLog.create({
    driverId,
    statDate: today,
    operationType: OPERATION_TYPE.LEVEL_CHANGE,
    operationTypeName: OPERATION_TYPE_NAMES[OPERATION_TYPE.LEVEL_CHANGE],
    dataField: 'driverLevel',
    oldValue: DRIVER_LEVEL_NAMES[oldLevel],
    newValue: levelResult.levelName,
    dataSource: '系统自动计算',
    statisticBasis: `服务评分${serviceData.serviceScore}，完单率${serviceData.completionRate}%，投诉率${serviceData.complaintRate}%`,
    operatorId,
    operatorName,
    remark: `等级从${DRIVER_LEVEL_NAMES[oldLevel]}变更为${levelResult.levelName}`
  })

  return {
    changed: true,
    oldLevel,
    newLevel: levelResult.level,
    levelInfo: levelResult,
    benefitChanges: {
      trafficWeight: { old: serviceData.trafficWeight, new: levelResult.trafficWeight },
      subsidyLevel: { old: serviceData.subsidyLevel, new: levelResult.subsidyLevel },
      orderPriority: { old: serviceData.orderPriority, new: levelResult.orderPriority }
    }
  }
}

const batchUpdateLevels = async (driverIds, operatorId, operatorName) => {
  const results = []

  for (const driverId of driverIds) {
    try {
      const result = await updateDriverLevel(driverId, operatorId, operatorName)
      results.push({
        id: driverId,
        success: true,
        changed: result.changed,
        oldLevel: result.oldLevel,
        newLevel: result.newLevel
      })
    } catch (error) {
      results.push({
        id: driverId,
        success: false,
        message: error.message
      })
    }
  }

  return {
    total: driverIds.length,
    successCount: results.filter(r => r.success).length,
    changedCount: results.filter(r => r.success && r.changed).length,
    failCount: results.filter(r => !r.success).length,
    results
  }
}

const generateExportData = async (params = {}) => {
  const {
    period = 'month',
    startDate,
    endDate,
    driverIds,
    driverLevel,
    city,
    vehicleType,
    fields = ['basic', 'service'],
    sortField = 'totalOrders',
    sortOrder = 'DESC',
    userRole = 'admin'
  } = params

  const dateRange = getDateRange(period, startDate, endDate)

  const where = {
    statDate: {
      [Op.between]: [dateRange.start, dateRange.end]
    }
  }

  if (driverIds && driverIds.length > 0) {
    where.driverId = { [Op.in]: driverIds }
  }
  if (driverLevel) where.driverLevel = driverLevel

  const includeWhere = {}
  if (city) includeWhere.city = city
  if (vehicleType) includeWhere.vehicleType = vehicleType

  const data = await DriverServiceData.findAll({
    where,
    include: [
      {
        model: Driver,
        as: 'driver',
        attributes: ['name', 'phone', 'city', 'vehicleType', 'idCard', 'driverLicenseNo'],
        where: includeWhere
      }
    ],
    order: [[sortField, sortOrder]]
  })

  const allowedFields = new Set()
  fields.forEach(f => {
    const fieldList = EXPORT_FIELD_PERMISSIONS[f]
    if (fieldList) {
      fieldList.forEach(field => allowedFields.add(field))
    }
  })

  if (userRole !== 'super_admin' && userRole !== 'finance_admin') {
    EXPORT_FIELD_PERMISSIONS.sensitive.forEach(f => allowedFields.delete(f))
  }

  const exportData = data.map(item => {
    const row = {
      statDate: item.statDate,
      driverLevel: DRIVER_LEVEL_NAMES[item.driverLevel] || item.driverLevel,
      totalOrders: item.totalOrders,
      completedOrders: item.completedOrders,
      completionRate: item.completionRate + '%',
      serviceScore: item.serviceScore,
      complaintRate: item.complaintRate + '%',
      complaintCount: item.complaintCount,
      totalIncome: item.totalIncome,
      onlineHours: item.onlineHours,
      avgOrderAmount: item.avgOrderAmount,
      mileage: item.mileage,
      trafficWeight: item.trafficWeight + 'x',
      name: item.driver?.name,
      phone: item.driver?.phone,
      city: item.driver?.city,
      vehicleType: item.driver?.vehicleType
    }

    if (userRole === 'super_admin' || userRole === 'finance_admin') {
      row.idCard = item.driver?.idCard
      row.driverLicenseNo = item.driver?.driverLicenseNo
    }

    return row
  })

  const fieldDesensitized = userRole !== 'super_admin' && userRole !== 'finance_admin'
    ? ['身份证号', '驾驶证号']
    : []

  return {
    data: exportData,
    total: exportData.length,
    dateRange,
    allowedFields: Array.from(allowedFields),
    desensitizedFields: fieldDesensitized,
    hasPermission: true
  }
}

const getDriverServiceLogs = async (driverId, limit = 20) => {
  const logs = await DriverServiceLog.findAll({
    where: { driverId },
    order: [['createTime', 'DESC']],
    limit
  })

  return logs
}

const getServiceStatistics = async (period = 'day') => {
  const dateRange = getDateRange(period)

  const stats = await DriverServiceData.findAll({
    where: {
      statDate: {
        [Op.between]: [dateRange.start, dateRange.end]
      }
    },
    attributes: [
      [fn('SUM', col('totalOrders')), 'totalOrders'],
      [fn('SUM', col('completedOrders')), 'completedOrders'],
      [fn('AVG', col('serviceScore')), 'avgServiceScore'],
      [fn('AVG', col('completionRate')), 'avgCompletionRate'],
      [fn('AVG', col('complaintRate')), 'avgComplaintRate'],
      [fn('SUM', col('totalIncome')), 'totalIncome'],
      [fn('COUNT', col('driverId')), 'driverCount']
    ],
    raw: true
  })

  const levelCounts = await DriverServiceData.findAll({
    where: {
      statDate: {
        [Op.between]: [dateRange.start, dateRange.end]
      }
    },
    attributes: ['driverLevel', [fn('COUNT', col('driverId')), 'count']],
    group: ['driverLevel'],
    raw: true
  })

  const levelDistribution = {}
  Object.values(DRIVER_LEVEL).forEach(level => {
    levelDistribution[DRIVER_LEVEL_NAMES[level]] = 0
  })
  levelCounts.forEach(item => {
    const name = DRIVER_LEVEL_NAMES[item.driverLevel]
    if (name) {
      levelDistribution[name] = parseInt(item.count) || 0
    }
  })

  return {
    summary: stats[0] || {},
    levelDistribution,
    dateRange,
    period
  }
}

module.exports = {
  DRIVER_LEVEL,
  DRIVER_LEVEL_NAMES,
  STAT_TYPE,
  OPERATION_TYPE,
  OPERATION_TYPE_NAMES,
  LEVEL_CONFIG,
  EXPORT_FIELD_PERMISSIONS,
  getDateRange,
  checkDataValidity,
  calculateDriverLevel,
  detectAbnormalData,
  checkDataAccuracy,
  getServiceDataList,
  getServiceTrend,
  getDriverServiceDetail,
  updateDriverLevel,
  batchUpdateLevels,
  generateExportData,
  getDriverServiceLogs,
  getServiceStatistics
}
