const { Driver, DriverStatusLog } = require('../models')
const { Op } = require('sequelize')

const ACCOUNT_STATUS = {
  NORMAL: 0,
  RESTRICTED: 1,
  TEMP_BAN: 2,
  PERMANENT_BAN: 3
}

const ACCOUNT_STATUS_NAMES = {
  [ACCOUNT_STATUS.NORMAL]: '正常',
  [ACCOUNT_STATUS.RESTRICTED]: '限制接单',
  [ACCOUNT_STATUS.TEMP_BAN]: '临时封禁',
  [ACCOUNT_STATUS.PERMANENT_BAN]: '永久封禁'
}

const RISK_LEVEL = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3
}

const OPERATION_TYPE = {
  STATUS_CHANGE: 1,
  BATCH_STATUS_CHANGE: 2,
  AUTO_JUDGE: 3,
  ABNORMAL_INTERCEPT: 4,
  UNBAN: 5
}

const OPERATION_TYPE_NAMES = {
  [OPERATION_TYPE.STATUS_CHANGE]: '状态修改',
  [OPERATION_TYPE.BATCH_STATUS_CHANGE]: '批量状态修改',
  [OPERATION_TYPE.AUTO_JUDGE]: '自动判定',
  [OPERATION_TYPE.ABNORMAL_INTERCEPT]: '异常拦截',
  [OPERATION_TYPE.UNBAN]: '解封操作'
}

const STATUS_PERMISSION_RULES = {
  [ACCOUNT_STATUS.NORMAL]: {
    canAcceptOrder: true,
    canWithdraw: true,
    canGoOnline: true,
    trafficWeight: 1.0
  },
  [ACCOUNT_STATUS.RESTRICTED]: {
    canAcceptOrder: false,
    canWithdraw: true,
    canGoOnline: true,
    trafficWeight: 0.3
  },
  [ACCOUNT_STATUS.TEMP_BAN]: {
    canAcceptOrder: false,
    canWithdraw: false,
    canGoOnline: false,
    trafficWeight: 0
  },
  [ACCOUNT_STATUS.PERMANENT_BAN]: {
    canAcceptOrder: false,
    canWithdraw: false,
    canGoOnline: false,
    trafficWeight: 0
  }
}

const RISK_TRAFFIC_WEIGHT = {
  [RISK_LEVEL.LOW]: 1.2,
  [RISK_LEVEL.MEDIUM]: 1.0,
  [RISK_LEVEL.HIGH]: 0.5
}

const preCheckStatusChange = async (driver, newStatus) => {
  const result = {
    passed: true,
    violations: [],
    warnings: [],
    violationCount: 0,
    complaintRate: driver.complaintRate || 0,
    serviceScore: driver.serviceScore || 5
  }

  if (driver.violationCount >= 10) {
    result.violations.push({
      type: 'violation_count',
      message: `违规次数${driver.violationCount}次，已达10次上限`,
      severity: 'high'
    })
  }

  if (driver.violationCount >= 5 && driver.violationCount < 10) {
    result.warnings.push({
      type: 'violation_count',
      message: `违规次数${driver.violationCount}次，已达预警阈值`
    })
  }

  if (parseFloat(driver.complaintRate) >= 5) {
    result.violations.push({
      type: 'complaint_rate',
      message: `投诉率${driver.complaintRate}%，超过5%阈值`,
      severity: 'high'
    })
  }

  if (parseFloat(driver.complaintRate) >= 3 && parseFloat(driver.complaintRate) < 5) {
    result.warnings.push({
      type: 'complaint_rate',
      message: `投诉率${driver.complaintRate}%，已达预警阈值`
    })
  }

  if (parseFloat(driver.serviceScore) < 3.5) {
    result.violations.push({
      type: 'service_score',
      message: `服务评分${driver.serviceScore}，低于3.5分阈值`,
      severity: 'high'
    })
  }

  if (parseFloat(driver.serviceScore) >= 3.5 && parseFloat(driver.serviceScore) < 4.0) {
    result.warnings.push({
      type: 'service_score',
      message: `服务评分${driver.serviceScore}，已达预警阈值`
    })
  }

  if (driver.status === ACCOUNT_STATUS.PERMANENT_BAN && newStatus !== ACCOUNT_STATUS.PERMANENT_BAN) {
    result.violations.push({
      type: 'permanent_ban_unlock',
      message: '永久封禁账号禁止解封，需走特殊审批流程',
      severity: 'high'
    })
  }

  if (newStatus === ACCOUNT_STATUS.RESTRICTED || newStatus === ACCOUNT_STATUS.TEMP_BAN) {
    if (result.violations.length === 0 && result.warnings.length === 0) {
      result.warnings.push({
        type: 'no_violation_warning',
        message: '当前司机无明显违规记录，请注意确认封禁理由'
      })
    }
  }

  result.violationCount = result.violations.length
  if (result.violations.length > 0) {
    result.passed = false
  }

  return result
}

const checkAbnormalOperation = (driver, newStatus, operatorRole) => {
  const result = {
    isAbnormal: false,
    reasons: []
  }

  if (driver.status === ACCOUNT_STATUS.PERMANENT_BAN && newStatus === ACCOUNT_STATUS.NORMAL) {
    if (operatorRole !== 'super_admin') {
      result.isAbnormal = true
      result.reasons.push('无权限解封永久封禁账号，仅超级管理员可操作')
    }
  }

  if (driver.status === ACCOUNT_STATUS.TEMP_BAN && newStatus === ACCOUNT_STATUS.NORMAL) {
    if (driver.statusBanEndTime && new Date(driver.statusBanEndTime) > new Date()) {
      result.reasons.push('临时封禁未到期，提前解封已记录')
    }
  }

  if (newStatus === ACCOUNT_STATUS.TEMP_BAN && (!driver.statusBanEndTime || new Date(driver.statusBanEndTime) <= new Date())) {
    result.reasons.push('临时封禁未设置有效结束时间')
  }

  return result
}

const calculateRiskLevel = (driver) => {
  let score = 0

  if (driver.violationCount >= 10) score += 40
  else if (driver.violationCount >= 5) score += 20
  else if (driver.violationCount >= 3) score += 10

  if (parseFloat(driver.complaintRate) >= 5) score += 30
  else if (parseFloat(driver.complaintRate) >= 3) score += 15
  else if (parseFloat(driver.complaintRate) >= 1) score += 5

  if (parseFloat(driver.serviceScore) < 3.5) score += 30
  else if (parseFloat(driver.serviceScore) < 4.0) score += 15
  else if (parseFloat(driver.serviceScore) < 4.5) score += 5

  if (driver.status === ACCOUNT_STATUS.TEMP_BAN) score += 20
  if (driver.status === ACCOUNT_STATUS.PERMANENT_BAN) score += 50
  if (driver.status === ACCOUNT_STATUS.RESTRICTED) score += 10

  let riskLevel = RISK_LEVEL.LOW
  if (score >= 50) riskLevel = RISK_LEVEL.HIGH
  else if (score >= 20) riskLevel = RISK_LEVEL.MEDIUM

  return {
    riskLevel,
    riskScore: score,
    description: score >= 50 ? '高风险' : score >= 20 ? '中风险' : '低风险'
  }
}

const updatePermissionsByStatus = async (driver, newStatus) => {
  const rules = STATUS_PERMISSION_RULES[newStatus]
  const riskResult = calculateRiskLevel(driver)

  let trafficWeight = rules.trafficWeight
  if (newStatus === ACCOUNT_STATUS.NORMAL) {
    trafficWeight = RISK_TRAFFIC_WEIGHT[riskResult.riskLevel]
  }

  const updateData = {
    canAcceptOrder: rules.canAcceptOrder ? 1 : 0,
    canWithdraw: rules.canWithdraw ? 1 : 0,
    canGoOnline: rules.canGoOnline ? 1 : 0,
    trafficWeight: trafficWeight,
    accountRiskLevel: riskResult.riskLevel
  }

  return {
    ...updateData,
    permissionChanges: {
      canAcceptOrder: { old: driver.canAcceptOrder, new: updateData.canAcceptOrder },
      canWithdraw: { old: driver.canWithdraw, new: updateData.canWithdraw },
      canGoOnline: { old: driver.canGoOnline, new: updateData.canGoOnline },
      trafficWeight: { old: driver.trafficWeight, new: updateData.trafficWeight }
    },
    riskResult
  }
}

const changeDriverStatus = async (driverId, newStatus, options = {}) => {
  const {
    changeReason = '',
    banEndTime = null,
    operatorId = null,
    operatorName = '',
    operatorRole = 'admin'
  } = options

  const driver = await Driver.findByPk(driverId)
  if (!driver) {
    throw new Error('司机不存在')
  }

  const preCheckResult = await preCheckStatusChange(driver, newStatus)
  const abnormalCheck = checkAbnormalOperation(driver, newStatus, operatorRole)

  if (abnormalCheck.isAbnormal) {
    await DriverStatusLog.create({
      driverId,
      operationType: OPERATION_TYPE.ABNORMAL_INTERCEPT,
      operationTypeName: OPERATION_TYPE_NAMES[OPERATION_TYPE.ABNORMAL_INTERCEPT],
      oldStatus: driver.status,
      newStatus: newStatus,
      oldRiskLevel: driver.accountRiskLevel,
      changeReason: changeReason,
      preCheckResult: preCheckResult,
      isAbnormal: 1,
      abnormalReason: abnormalCheck.reasons.join('; '),
      operatorId,
      operatorName,
      operatorRole
    })

    throw new Error(abnormalCheck.reasons.join('; '))
  }

  const permissionData = await updatePermissionsByStatus(driver, newStatus)

  const updateData = {
    status: newStatus,
    statusBanReason: changeReason,
    statusBanStartTime: (newStatus === ACCOUNT_STATUS.TEMP_BAN || newStatus === ACCOUNT_STATUS.PERMANENT_BAN) ? new Date() : null,
    statusBanEndTime: newStatus === ACCOUNT_STATUS.TEMP_BAN ? banEndTime : null,
    accountRiskLevel: permissionData.riskResult.riskLevel,
    canAcceptOrder: permissionData.canAcceptOrder,
    canWithdraw: permissionData.canWithdraw,
    canGoOnline: permissionData.canGoOnline,
    trafficWeight: permissionData.trafficWeight,
    abnormalStatusAlert: abnormalCheck.reasons.length > 0 ? 1 : 0,
    abnormalStatusReason: abnormalCheck.reasons.join('; ') || null
  }

  await driver.update(updateData)

  let operationType = OPERATION_TYPE.STATUS_CHANGE
  if (newStatus === ACCOUNT_STATUS.NORMAL && driver.status !== ACCOUNT_STATUS.NORMAL) {
    operationType = OPERATION_TYPE.UNBAN
  }

  await DriverStatusLog.create({
    driverId,
    operationType,
    operationTypeName: OPERATION_TYPE_NAMES[operationType],
    oldStatus: driver.status,
    newStatus,
    oldRiskLevel: driver.accountRiskLevel,
    newRiskLevel: permissionData.riskResult.riskLevel,
    changeReason,
    preCheckResult: preCheckResult,
    permissionChanges: permissionData.permissionChanges,
    effectiveTime: new Date(),
    expireTime: newStatus === ACCOUNT_STATUS.TEMP_BAN ? banEndTime : null,
    isAbnormal: abnormalCheck.reasons.length > 0 ? 1 : 0,
    abnormalReason: abnormalCheck.reasons.join('; ') || null,
    operatorId,
    operatorName,
    operatorRole
  })

  return {
    driver: await Driver.findByPk(driverId),
    preCheckResult,
    abnormalCheck,
    permissionChanges: permissionData.permissionChanges
  }
}

const batchChangeStatus = async (driverIds, newStatus, options = {}) => {
  const {
    changeReason = '',
    banEndTime = null,
    operatorId = null,
    operatorName = '',
    operatorRole = 'admin',
    checkPermission = true
  } = options

  const results = []
  const drivers = await Driver.findAll({
    where: { id: { [Op.in]: driverIds } }
  })

  for (const driver of drivers) {
    try {
      if (checkPermission && driver.status === ACCOUNT_STATUS.PERMANENT_BAN && newStatus === ACCOUNT_STATUS.NORMAL) {
        results.push({
          id: driver.id,
          name: driver.name,
          success: false,
          message: '永久封禁账号禁止批量恢复，需单独走审批流程'
        })
        continue
      }

      const result = await changeDriverStatus(driver.id, newStatus, {
        changeReason,
        banEndTime,
        operatorId,
        operatorName,
        operatorRole
      })

      results.push({
        id: driver.id,
        name: driver.name,
        success: true,
        message: `${ACCOUNT_STATUS_NAMES[newStatus]}成功`
      })
    } catch (error) {
      results.push({
        id: driver.id,
        name: driver.name,
        success: false,
        message: error.message
      })
    }
  }

  return {
    total: driverIds.length,
    successCount: results.filter(r => r.success).length,
    failCount: results.filter(r => !r.success).length,
    results
  }
}

const batchRemindRectification = async (driverIds, options = {}) => {
  const { operatorId = null, operatorName = '' } = options

  const results = []
  const drivers = await Driver.findAll({
    where: { id: { [Op.in]: driverIds } }
  })

  for (const driver of drivers) {
    try {
      const riskResult = calculateRiskLevel(driver)

      await DriverStatusLog.create({
        driverId: driver.id,
        operationType: OPERATION_TYPE.AUTO_JUDGE,
        operationTypeName: '整改提醒',
        oldStatus: driver.status,
        newStatus: driver.status,
        oldRiskLevel: driver.accountRiskLevel,
        newRiskLevel: riskResult.riskLevel,
        changeReason: `整改提醒：违规${driver.violationCount}次，投诉率${driver.complaintRate}%，服务评分${driver.serviceScore}`,
        preCheckResult: {
          violationCount: driver.violationCount,
          complaintRate: driver.complaintRate,
          serviceScore: driver.serviceScore
        },
        operatorId,
        operatorName
      })

      results.push({
        id: driver.id,
        name: driver.name,
        success: true,
        message: '整改提醒已发送'
      })
    } catch (error) {
      results.push({
        id: driver.id,
        name: driver.name,
        success: false,
        message: error.message
      })
    }
  }

  return {
    total: driverIds.length,
    successCount: results.filter(r => r.success).length,
    failCount: results.filter(r => !r.success).length,
    results
  }
}

const getDriverStatusLogs = async (driverId) => {
  const logs = await DriverStatusLog.findAll({
    where: { driverId },
    order: [['createTime', 'DESC']]
  })

  return logs
}

const getStatusDashboard = async () => {
  const [
    normalCount,
    restrictedCount,
    tempBanCount,
    permanentBanCount,
    lowRiskCount,
    mediumRiskCount,
    highRiskCount,
    lowScoreCount,
    highComplaintCount,
    highViolationCount,
    todayChangeCount
  ] = await Promise.all([
    Driver.count({ where: { status: ACCOUNT_STATUS.NORMAL } }),
    Driver.count({ where: { status: ACCOUNT_STATUS.RESTRICTED } }),
    Driver.count({ where: { status: ACCOUNT_STATUS.TEMP_BAN } }),
    Driver.count({ where: { status: ACCOUNT_STATUS.PERMANENT_BAN } }),
    Driver.count({ where: { accountRiskLevel: RISK_LEVEL.LOW } }),
    Driver.count({ where: { accountRiskLevel: RISK_LEVEL.MEDIUM } }),
    Driver.count({ where: { accountRiskLevel: RISK_LEVEL.HIGH } }),
    Driver.count({ where: { serviceScore: { [Op.lt]: 4.0 } } }),
    Driver.count({ where: { complaintRate: { [Op.gte]: 3 } } }),
    Driver.count({ where: { violationCount: { [Op.gte]: 3 } } }),
    DriverStatusLog.count({
      where: {
        createTime: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ])

  return {
    statusDistribution: {
      normal: normalCount,
      restricted: restrictedCount,
      tempBan: tempBanCount,
      permanentBan: permanentBanCount
    },
    riskDistribution: {
      low: lowRiskCount,
      medium: mediumRiskCount,
      high: highRiskCount
    },
    problemDrivers: {
      lowScore: lowScoreCount,
      highComplaint: highComplaintCount,
      highViolation: highViolationCount
    },
    todayChangeCount,
    total: normalCount + restrictedCount + tempBanCount + permanentBanCount
  }
}

const preCheckBatchOperation = async (driverIds, newStatus) => {
  const drivers = await Driver.findAll({
    where: { id: { [Op.in]: driverIds } }
  })

  const result = {
    canProceed: true,
    warningMessages: [],
    blockedDrivers: [],
    statistics: {
      total: drivers.length,
      normal: 0,
      restricted: 0,
      tempBan: 0,
      permanentBan: 0,
      highRisk: 0
    }
  }

  for (const driver of drivers) {
    if (driver.status === ACCOUNT_STATUS.NORMAL) result.statistics.normal++
    else if (driver.status === ACCOUNT_STATUS.RESTRICTED) result.statistics.restricted++
    else if (driver.status === ACCOUNT_STATUS.TEMP_BAN) result.statistics.tempBan++
    else if (driver.status === ACCOUNT_STATUS.PERMANENT_BAN) {
      result.statistics.permanentBan++
      if (newStatus === ACCOUNT_STATUS.NORMAL) {
        result.blockedDrivers.push({
          id: driver.id,
          name: driver.name,
          reason: '永久封禁账号禁止批量恢复'
        })
      }
    }

    if (driver.accountRiskLevel === RISK_LEVEL.HIGH) {
      result.statistics.highRisk++
    }
  }

  if (result.blockedDrivers.length > 0) {
    result.canProceed = false
    result.warningMessages.push(`${result.blockedDrivers.length}个永久封禁账号将被跳过`)
  }

  if (result.statistics.highRisk > 0) {
    result.warningMessages.push(`包含${result.statistics.highRisk}个高风险账号，请谨慎操作`)
  }

  return result
}

const autoJudgeRiskLevel = async (driverId) => {
  const driver = await Driver.findByPk(driverId)
  if (!driver) {
    throw new Error('司机不存在')
  }

  const oldRiskLevel = driver.accountRiskLevel
  const riskResult = calculateRiskLevel(driver)

  if (oldRiskLevel !== riskResult.riskLevel) {
    const permissionData = await updatePermissionsByStatus(driver, driver.status)

    await driver.update({
      accountRiskLevel: riskResult.riskLevel,
      trafficWeight: permissionData.trafficWeight
    })

    await DriverStatusLog.create({
      driverId,
      operationType: OPERATION_TYPE.AUTO_JUDGE,
      operationTypeName: OPERATION_TYPE_NAMES[OPERATION_TYPE.AUTO_JUDGE],
      oldStatus: driver.status,
      newStatus: driver.status,
      oldRiskLevel,
      newRiskLevel: riskResult.riskLevel,
      changeReason: `自动判定风险等级变更：${oldRiskLevel === 1 ? '低风险' : oldRiskLevel === 2 ? '中风险' : '高风险'} → ${riskResult.description}`,
      permissionChanges: permissionData.permissionChanges,
      effectiveTime: new Date()
    })
  }

  return {
    driverId,
    oldRiskLevel,
    newRiskLevel: riskResult.riskLevel,
    riskScore: riskResult.riskScore,
    description: riskResult.description
  }
}

module.exports = {
  ACCOUNT_STATUS,
  ACCOUNT_STATUS_NAMES,
  RISK_LEVEL,
  OPERATION_TYPE,
  OPERATION_TYPE_NAMES,
  STATUS_PERMISSION_RULES,
  RISK_TRAFFIC_WEIGHT,
  preCheckStatusChange,
  checkAbnormalOperation,
  calculateRiskLevel,
  updatePermissionsByStatus,
  changeDriverStatus,
  batchChangeStatus,
  batchRemindRectification,
  getDriverStatusLogs,
  getStatusDashboard,
  preCheckBatchOperation,
  autoJudgeRiskLevel
}
