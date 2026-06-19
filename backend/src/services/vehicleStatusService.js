const { Op } = require('sequelize')
const { VehicleMaintenance, VehicleViolation, VehicleStatusLog } = require('../models')

const OPERATION_STATUS = {
  NORMAL: 1,
  MAINTENANCE: 2,
  DOCUMENT_EXPIRED: 3,
  VIOLATION_BANNED: 4
}

const validateStatusChange = async (vehicle, newOperationStatus, operatorId, operatorName) => {
  const result = {
    valid: true,
    checks: {
      maintenance: { passed: true, details: [] },
      documents: { passed: true, details: [] },
      violations: { passed: true, details: [] },
      banned: { passed: true, details: [] },
      mutualExclusion: { passed: true, details: [] }
    },
    errors: [],
    warnings: []
  }

  const pendingMaintenance = await VehicleMaintenance.findAll({
    where: {
      vehicleId: vehicle.id,
      maintenanceStatus: { [Op.in]: [0, 1] }
    }
  })

  const activeViolations = await VehicleViolation.findAll({
    where: {
      vehicleId: vehicle.id,
      violationStatus: { [Op.in]: [0, 1] },
      penaltyType: { [Op.in]: [3, 4, 5] }
    }
  })

  const now = new Date()
  const docChecks = {
    drivingLicense: { name: '行驶证', expired: false },
    inspection: { name: '年检', expired: false },
    insurance: { name: '保险', expired: false }
  }

  if (vehicle.drivingLicenseDate && new Date(vehicle.drivingLicenseDate) < now) {
    docChecks.drivingLicense.expired = true
  }
  if (vehicle.inspectionDate && new Date(vehicle.inspectionDate) < now) {
    docChecks.inspection.expired = true
  }
  if (vehicle.insuranceDate && new Date(vehicle.insuranceDate) < now) {
    docChecks.insurance.expired = true
  }

  if (newOperationStatus === OPERATION_STATUS.NORMAL) {
    if (pendingMaintenance.length > 0) {
      result.checks.maintenance.passed = false
      result.checks.maintenance.details.push({
        type: 'pending_maintenance',
        message: `存在${pendingMaintenance.length}条待处理/检修中的维护记录`,
        count: pendingMaintenance.length
      })
      result.errors.push('存在未完成的维护记录，无法恢复为正常运营')
      result.valid = false
    }

    Object.entries(docChecks).forEach(([key, doc]) => {
      if (doc.expired) {
        result.checks.documents.passed = false
        result.checks.documents.details.push({
          type: `${key}_expired`,
          message: `${doc.name}已过期`
        })
      }
    })
    if (!result.checks.documents.passed) {
      result.errors.push('存在过期证件，无法恢复为正常运营')
      result.valid = false
    }

    if (activeViolations.length > 0) {
      result.checks.violations.passed = false
      result.checks.violations.details.push({
        type: 'active_violations',
        message: `存在${activeViolations.length}条未处理的违规处罚记录`,
        count: activeViolations.length
      })
      result.errors.push('存在未处理的违规处罚，无法恢复为正常运营')
      result.valid = false
    }
  }

  if (vehicle.bannedType === 2) {
    result.checks.banned.passed = false
    result.checks.banned.details.push({
      type: 'permanently_banned',
      message: '车辆已被永久封禁，禁止任何恢复操作'
    })
    result.errors.push('车辆已被永久封禁，禁止恢复运营状态')
    result.valid = false
  } else if (vehicle.bannedType === 1 && vehicle.bannedExpireDate && new Date(vehicle.bannedExpireDate) > now) {
    result.checks.banned.passed = false
    result.checks.banned.details.push({
      type: 'temporarily_banned',
      message: '车辆临时封禁尚未到期'
    })
    result.warnings.push('车辆临时封禁尚未到期')
  }

  const mutual = result.checks.mutualExclusion
  if (newOperationStatus === OPERATION_STATUS.NORMAL) {
    const conditions = []
    if (vehicle.auditStatus !== 1) {
      conditions.push('审核状态未通过')
    }
    if (vehicle.isLocked !== 0) {
      conditions.push('车辆已锁定')
    }
    if (pendingMaintenance.length > 0) {
      conditions.push('存在待处理维护记录')
    }
    if (activeViolations.length > 0) {
      conditions.push('存在未处理违规处罚')
    }
    if (Object.values(docChecks).some(d => d.expired)) {
      conditions.push('存在过期证件')
    }
    if (conditions.length > 0) {
      mutual.passed = false
      mutual.details.push({
        type: 'normal_prerequisites_not_met',
        message: `正常运营前置条件未满足：${conditions.join('、')}`,
        unmetConditions: conditions
      })
    }
  } else if (newOperationStatus === OPERATION_STATUS.MAINTENANCE) {
    if (vehicle.isLocked !== 0) {
      mutual.passed = false
      mutual.details.push({
        type: 'vehicle_locked',
        message: '车辆已锁定，无法设置为停运检修'
      })
      result.errors.push('车辆已锁定，无法设置为停运检修')
      result.valid = false
    }
    if (pendingMaintenance.length === 0) {
      mutual.details.push({
        type: 'no_maintenance_record',
        message: '无待处理维护记录，请确认停运检修原因'
      })
      result.warnings.push('当前无待处理维护记录，设置为停运检修需提供合理原因')
    }
  } else if (newOperationStatus === OPERATION_STATUS.DOCUMENT_EXPIRED) {
    mutual.passed = false
    mutual.details.push({
      type: 'system_only',
      message: '证件过期状态仅可由系统自动设置'
    })
    result.errors.push('证件过期状态仅可由系统根据证件到期情况自动设置，禁止手动操作')
    result.valid = false
  } else if (newOperationStatus === OPERATION_STATUS.VIOLATION_BANNED) {
    if (activeViolations.length === 0) {
      mutual.passed = false
      mutual.details.push({
        type: 'no_active_violation',
        message: '无有效的违规处罚记录'
      })
      result.errors.push('无有效的违规处罚记录，无法设置为违规封禁')
      result.valid = false
    }
  }

  return result
}

const determineMaintenanceWarning = (vehicle) => {
  const mileage = parseFloat(vehicle.mileage) || 0
  const lastMileage = parseFloat(vehicle.lastMaintenanceMileage) || 0
  const cycle = parseInt(vehicle.maintenanceCycle) || 50000

  const mileageSinceLast = mileage - lastMileage
  const remainingKm = cycle - mileageSinceLast

  const now = new Date()
  let remainingDays = null
  if (vehicle.nextMaintenanceDate) {
    const nextDate = new Date(vehicle.nextMaintenanceDate)
    remainingDays = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24))
  }

  let level = 0
  let message = ''

  const kmBasedLevel = remainingKm > 5000 ? 0 : remainingKm > 2000 ? 1 : remainingKm > 500 ? 2 : 3
  const dayBasedLevel = remainingDays === null ? 0 : remainingDays > 30 ? 0 : remainingDays > 15 ? 1 : remainingDays > 7 ? 2 : 3

  level = Math.max(kmBasedLevel, dayBasedLevel)

  const levelMessages = {
    0: '无预警，车辆检修状态正常',
    1: '临近检修周期，请安排检修计划',
    2: '紧急预警，请尽快安排车辆检修',
    3: '已超过检修周期，请立即安排检修'
  }
  message = levelMessages[level]

  return {
    level,
    remainingKm: Math.round(remainingKm),
    remainingDays,
    message
  }
}

const autoDetermineOperationStatus = async (vehicle) => {
  const result = {
    status: OPERATION_STATUS.NORMAL,
    reasons: [],
    warnings: []
  }

  const now = new Date()
  const expiredDocs = []
  if (vehicle.drivingLicenseDate && new Date(vehicle.drivingLicenseDate) < now) {
    expiredDocs.push('行驶证')
  }
  if (vehicle.inspectionDate && new Date(vehicle.inspectionDate) < now) {
    expiredDocs.push('年检')
  }
  if (vehicle.insuranceDate && new Date(vehicle.insuranceDate) < now) {
    expiredDocs.push('保险')
  }

  if (expiredDocs.length > 0) {
    result.status = OPERATION_STATUS.DOCUMENT_EXPIRED
    result.reasons.push(`证件已过期：${expiredDocs.join('、')}`)
    return result
  }

  const banViolations = await VehicleViolation.findAll({
    where: {
      vehicleId: vehicle.id,
      violationStatus: { [Op.in]: [0, 1] },
      penaltyType: { [Op.in]: [3, 4, 5] }
    }
  })

  if (banViolations.length > 0) {
    const hasActiveBan = banViolations.some(v => {
      if (v.penaltyType === 5) return true
      if (v.penaltyEndDate && new Date(v.penaltyEndDate) > now) return true
      return false
    })
    if (hasActiveBan) {
      result.status = OPERATION_STATUS.VIOLATION_BANNED
      result.reasons.push(`存在${banViolations.length}条违规处罚中含封禁处罚，车辆需封禁`)
      return result
    }
    result.warnings.push(`存在${banViolations.length}条未处理违规处罚，请及时处理`)
  }

  const pendingMaintenance = await VehicleMaintenance.findAll({
    where: {
      vehicleId: vehicle.id,
      maintenanceStatus: { [Op.in]: [0, 1] }
    }
  })

  if (pendingMaintenance.length > 0) {
    result.status = OPERATION_STATUS.MAINTENANCE
    result.reasons.push(`存在${pendingMaintenance.length}条待处理/检修中的维护记录`)
    return result
  }

  result.reasons.push('所有条件正常，车辆可正常运营')
  return result
}

const checkAbnormalStatus = async (vehicle, newStatus, oldStatus) => {
  const result = {
    isAnomaly: false,
    anomalyType: null,
    alertLevel: 0,
    alertMessage: ''
  }

  if (newStatus === oldStatus) {
    return result
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentChanges = await VehicleStatusLog.count({
    where: {
      vehicleId: vehicle.id,
      createdAt: { [Op.gte]: twentyFourHoursAgo }
    }
  })

  if (recentChanges >= 3) {
    result.isAnomaly = true
    result.anomalyType = 'status_fluctuation'
    result.alertLevel = 2
    result.alertMessage = `车辆状态在24小时内已变更${recentChanges}次，存在状态波动异常`
    return result
  }

  if (newStatus === OPERATION_STATUS.NORMAL) {
    const activeViolations = await VehicleViolation.findAll({
      where: {
        vehicleId: vehicle.id,
        violationStatus: { [Op.in]: [0, 1] },
        penaltyType: { [Op.in]: [3, 4, 5] }
      }
    })

    if (activeViolations.length > 0) {
      result.isAnomaly = true
      result.anomalyType = 'violation_online'
      result.alertLevel = 3
      result.alertMessage = `车辆存在${activeViolations.length}条未处理违规处罚，恢复运营存在风险`
      return result
    }

    const maintenanceWarning = determineMaintenanceWarning(vehicle)
    if (maintenanceWarning.level >= 3) {
      result.isAnomaly = true
      result.anomalyType = 'sick_operation'
      result.alertLevel = 2
      result.alertMessage = '车辆已超过检修周期，恢复运营存在安全隐患'
      return result
    }
  }

  return result
}

const syncCapacityAndSchedule = (vehicle, oldOperationStatus, newOperationStatus) => {
  const result = {
    capacityImpact: {
      city: vehicle.city || null,
      capacityType: vehicle.capacityType || null,
      delta: 0
    },
    scheduleImpact: {
      removed: false,
      affected: 0
    }
  }

  const operationalStatuses = [OPERATION_STATUS.NORMAL]
  const wasOperational = operationalStatuses.includes(oldOperationStatus)
  const isOperational = operationalStatuses.includes(newOperationStatus)

  if (wasOperational && !isOperational) {
    result.capacityImpact.delta = -1
    result.scheduleImpact.removed = true
    result.scheduleImpact.affected = 1
  } else if (!wasOperational && isOperational) {
    result.capacityImpact.delta = 1
    result.scheduleImpact.removed = false
    result.scheduleImpact.affected = 1
  }

  return result
}

module.exports = {
  validateStatusChange,
  determineMaintenanceWarning,
  autoDetermineOperationStatus,
  checkAbnormalStatus,
  syncCapacityAndSchedule
}
