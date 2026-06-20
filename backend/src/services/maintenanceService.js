const { Op } = require('sequelize')
const { VehicleMaintenance, VehicleStatusLog } = require('../models')

const OPERATION_STATUS = {
  NORMAL: 1,
  MAINTENANCE: 2,
  DOCUMENT_EXPIRED: 3,
  VIOLATION_BANNED: 4
}

const MAINTENANCE_TYPE_NAMES = {
  1: '常规保养',
  2: '年检',
  3: '大修',
  4: '事故维修',
  5: '更换零件'
}

const PRIORITY_MAP = {
  1: '紧急',
  2: '一般',
  3: '低优先'
}

const MILEAGE_THRESHOLD_KM = 1000

const VALID_STATUS_TRANSITIONS = {
  0: [1, 3],
  1: [2, 3],
  2: [],
  3: []
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
  const kmBasedLevel = remainingKm > 5000 ? 0 : remainingKm > 2000 ? 1 : remainingKm > 500 ? 2 : 3
  const dayBasedLevel = remainingDays === null ? 0 : remainingDays > 30 ? 0 : remainingDays > 15 ? 1 : remainingDays > 7 ? 2 : 3

  level = Math.max(kmBasedLevel, dayBasedLevel)

  return { level, remainingKm: Math.round(remainingKm), remainingDays }
}

const autoDetermineOperationStatus = async (vehicle) => {
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
    return OPERATION_STATUS.DOCUMENT_EXPIRED
  }

  const pendingMaintenance = await VehicleMaintenance.findAll({
    where: {
      vehicleId: vehicle.id,
      maintenanceStatus: { [Op.in]: [0, 1] }
    }
  })

  if (pendingMaintenance.length > 0) {
    return OPERATION_STATUS.MAINTENANCE
  }

  return OPERATION_STATUS.NORMAL
}

const validateMaintenanceCreation = async (vehicle, maintenanceData) => {
  const result = {
    valid: true,
    checks: {
      operationStatus: { passed: true, details: [] },
      lastMaintenanceTime: { passed: true, details: [] },
      mileageThreshold: { passed: true, details: [] }
    },
    errors: [],
    warnings: []
  }

  if (vehicle.operationStatus === OPERATION_STATUS.MAINTENANCE) {
    const existingPending = await VehicleMaintenance.findAll({
      where: {
        vehicleId: vehicle.id,
        maintenanceStatus: { [Op.in]: [0, 1] }
      }
    })
    if (existingPending.length > 0) {
      result.checks.operationStatus.passed = false
      result.checks.operationStatus.details.push({
        type: 'existing_pending_maintenance',
        message: `车辆已停运检修，存在${existingPending.length}条待处理/检修中的维护记录`,
        count: existingPending.length
      })
      result.errors.push('车辆已处于停运检修状态且存在未完成维护记录，请勿重复创建')
      result.valid = false
    }
  }

  if (vehicle.lastMaintenanceDate) {
    const lastDate = new Date(vehicle.lastMaintenanceDate)
    const now = new Date()
    const daysSinceLast = Math.ceil((now - lastDate) / (1000 * 60 * 60 * 24))
    if (daysSinceLast < 7) {
      result.checks.lastMaintenanceTime.passed = false
      result.checks.lastMaintenanceTime.details.push({
        type: 'recent_maintenance',
        message: `上次维护距今仅${daysSinceLast}天（7天内）`,
        daysSinceLast
      })
      result.warnings.push(`上次维护距今仅${daysSinceLast}天，请确认是否需要重复维护`)
    }
  }

  const maintenanceType = maintenanceData.maintenanceType
  if (maintenanceType !== 4) {
    const mileage = parseFloat(vehicle.mileage) || 0
    const lastMaintenanceMileage = parseFloat(vehicle.lastMaintenanceMileage) || 0
    const mileageSinceLast = mileage - lastMaintenanceMileage

    if (mileageSinceLast < MILEAGE_THRESHOLD_KM) {
      result.checks.mileageThreshold.passed = false
      result.checks.mileageThreshold.details.push({
        type: 'low_mileage_since_last',
        message: `距上次维护仅行驶${Math.round(mileageSinceLast)}km，低于${MILEAGE_THRESHOLD_KM}km阈值`,
        mileageSinceLast: Math.round(mileageSinceLast),
        threshold: MILEAGE_THRESHOLD_KM
      })
      result.errors.push(`距上次维护仅行驶${Math.round(mileageSinceLast)}km，低于${MILEAGE_THRESHOLD_KM}km阈值，不允许重复维护（事故维修除外）`)
      result.valid = false
    }
  }

  return result
}

const calculateMaintenancePriority = async (vehicle) => {
  const mileage = parseFloat(vehicle.mileage) || 0
  const lastMaintenanceMileage = parseFloat(vehicle.lastMaintenanceMileage) || 0
  const maintenanceCycle = parseInt(vehicle.maintenanceCycle) || 50000

  const mileageSinceLast = mileage - lastMaintenanceMileage
  const mileageProgress = maintenanceCycle > 0 ? (mileageSinceLast / maintenanceCycle) * 100 : 0

  let mileageScore
  if (mileageProgress > 100) mileageScore = 100
  else if (mileageProgress >= 80) mileageScore = 80
  else if (mileageProgress >= 60) mileageScore = 60
  else mileageScore = 30

  let ageScore = 20
  if (vehicle.manufactureDate) {
    const manufactureDate = new Date(vehicle.manufactureDate)
    const now = new Date()
    const ageYears = (now - manufactureDate) / (1000 * 60 * 60 * 24 * 365)
    if (ageYears > 8) ageScore = 100
    else if (ageYears > 5) ageScore = 70
    else if (ageYears > 3) ageScore = 40
    else ageScore = 20
  }

  let faultScore = 10
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const recentCount = await VehicleMaintenance.count({
      where: {
        vehicleId: vehicle.id,
        createTime: { [Op.gte]: sixMonthsAgo }
      }
    })
    if (recentCount > 5) faultScore = 100
    else if (recentCount >= 3) faultScore = 70
    else if (recentCount >= 1) faultScore = 40
    else faultScore = 10
  } catch (err) {
    faultScore = 10
  }

  let warningScore = 10
  const warningLevel = vehicle.maintenanceWarningLevel || 0
  if (warningLevel === 3) warningScore = 100
  else if (warningLevel === 2) warningScore = 70
  else if (warningLevel === 1) warningScore = 40
  else warningScore = 10

  const totalScore = Math.round(
    mileageScore * 0.3 +
    ageScore * 0.25 +
    faultScore * 0.25 +
    warningScore * 0.2
  )

  let priority
  if (totalScore >= 80) priority = 1
  else if (totalScore >= 50) priority = 2
  else priority = 3

  return {
    priority,
    priorityName: PRIORITY_MAP[priority],
    score: totalScore,
    breakdown: {
      mileage: { score: mileageScore, weight: 0.3, progress: Math.round(mileageProgress) },
      age: { score: ageScore, weight: 0.25 },
      faultFrequency: { score: faultScore, weight: 0.25 },
      warningLevel: { score: warningScore, weight: 0.2 }
    }
  }
}

const generateLedgerNo = async (vehicleId, maintenanceType) => {
  const now = new Date()
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('')

  const prefix = `MT-${dateStr}-${vehicleId}-${maintenanceType}`

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const todayCount = await VehicleMaintenance.count({
    where: {
      createTime: { [Op.gte]: todayStart, [Op.lt]: todayEnd }
    }
  })

  const sequential = String(todayCount + 1).padStart(3, '0')
  return `${prefix}-${sequential}`
}

const syncVehicleMaintenanceStatus = async (vehicle, maintenanceRecord, action) => {
  const result = {
    vehicleUpdated: false,
    operationStatusChanged: false,
    capacityRestored: false
  }

  const { Vehicle } = require('../models')
  const oldOperationStatus = vehicle.operationStatus

  if (action === 'create') {
    if (vehicle.operationStatus !== OPERATION_STATUS.MAINTENANCE) {
      await Vehicle.update(
        { operationStatus: OPERATION_STATUS.MAINTENANCE },
        { where: { id: vehicle.id } }
      )
      result.vehicleUpdated = true
      result.operationStatusChanged = true
    }
  } else if (action === 'start') {
    if (vehicle.operationStatus !== OPERATION_STATUS.MAINTENANCE) {
      await Vehicle.update(
        { operationStatus: OPERATION_STATUS.MAINTENANCE },
        { where: { id: vehicle.id } }
      )
      result.vehicleUpdated = true
      result.operationStatusChanged = true
    }
  } else if (action === 'complete') {
    const updateFields = {
      lastMaintenanceMileage: maintenanceRecord.mileageAtMaintenance || vehicle.mileage,
      lastMaintenanceDate: maintenanceRecord.endDate || new Date()
    }

    if (maintenanceRecord.nextMaintenanceDate) {
      updateFields.nextMaintenanceDate = maintenanceRecord.nextMaintenanceDate
    }
    if (maintenanceRecord.nextMaintenanceMileage) {
      updateFields.nextMaintenanceMileage = maintenanceRecord.nextMaintenanceMileage
    }

    const warning = determineMaintenanceWarning({
      ...vehicle.dataValues,
      ...updateFields
    })
    updateFields.maintenanceWarningLevel = warning.level

    await Vehicle.update(updateFields, { where: { id: vehicle.id } })

    const otherPending = await VehicleMaintenance.findAll({
      where: {
        vehicleId: vehicle.id,
        maintenanceStatus: { [Op.in]: [0, 1] },
        id: { [Op.ne]: maintenanceRecord.id }
      }
    })

    if (otherPending.length === 0) {
      const newStatus = await autoDetermineOperationStatus({
        ...vehicle.dataValues,
        ...updateFields
      })
      if (newStatus !== OPERATION_STATUS.MAINTENANCE) {
        await Vehicle.update(
          { operationStatus: newStatus },
          { where: { id: vehicle.id } }
        )
        result.operationStatusChanged = true
        if (newStatus === OPERATION_STATUS.NORMAL) {
          result.capacityRestored = true
        }
      }
    }

    result.vehicleUpdated = true
  } else if (action === 'cancel') {
    const otherPending = await VehicleMaintenance.findAll({
      where: {
        vehicleId: vehicle.id,
        maintenanceStatus: { [Op.in]: [0, 1] },
        id: { [Op.ne]: maintenanceRecord.id }
      }
    })

    if (otherPending.length === 0 && vehicle.operationStatus === OPERATION_STATUS.MAINTENANCE) {
      const newStatus = await autoDetermineOperationStatus(vehicle)
      await Vehicle.update(
        { operationStatus: newStatus },
        { where: { id: vehicle.id } }
      )
      result.operationStatusChanged = true
      if (newStatus === OPERATION_STATUS.NORMAL) {
        result.capacityRestored = true
      }
    }

    result.vehicleUpdated = true
  }

  if (result.operationStatusChanged) {
    await VehicleStatusLog.create({
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      changeType: 2,
      oldOperationStatus: oldOperationStatus,
      newOperationStatus: action === 'create' || action === 'start'
        ? OPERATION_STATUS.MAINTENANCE
        : (result.capacityRestored ? OPERATION_STATUS.NORMAL : vehicle.operationStatus),
      triggerType: 1,
      triggerReason: `维护记录${action === 'create' ? '创建' : action === 'start' ? '开始' : action === 'complete' ? '完成' : '取消'}`,
      maintenanceCheck: { maintenanceId: maintenanceRecord.id, action }
    })
  }

  return result
}

const detectMaintenanceAnomaly = async (vehicle, maintenanceRecord) => {
  const result = {
    isAnomaly: false,
    anomalyType: null,
    anomalyDescription: '',
    confidence: 0
  }

  const lastRecords = await VehicleMaintenance.findAll({
    where: {
      vehicleId: vehicle.id,
      maintenanceStatus: 2,
      id: { [Op.ne]: maintenanceRecord.id }
    },
    order: [['endTime', 'DESC']],
    limit: 5
  })

  if (lastRecords.length > 0) {
    const lastRecord = lastRecords[0]
    const lastMileage = parseFloat(lastRecord.mileageAtMaintenance) || 0
    const currentMileage = parseFloat(maintenanceRecord.mileageAtMaintenance) || 0

    if (currentMileage < lastMileage) {
      result.isAnomaly = true
      result.anomalyType = 'fake_maintenance'
      result.anomalyDescription = `里程数异常下降：上次记录${lastMileage}km，本次记录${currentMileage}km`
      result.confidence = 90
      return result
    }
  }

  if (lastRecords.length > 0) {
    const stationSet = new Set()
    lastRecords.forEach(r => {
      if (r.maintenanceStation) stationSet.add(r.maintenanceStation)
    })

    if (stationSet.size > 0 && maintenanceRecord.maintenanceStation && !stationSet.has(maintenanceRecord.maintenanceStation)) {
      const knownStations = Array.from(stationSet).join('、')
      if (result.confidence < 60) {
        result.isAnomaly = true
        result.anomalyType = 'fake_maintenance'
        result.anomalyDescription = `检修站点异常：历史站点为${knownStations}，本次为${maintenanceRecord.maintenanceStation}`
        result.confidence = 60
      }
    }
  }

  const TYPE_COST_RANGES = {
    1: { min: 200, max: 3000 },
    2: { min: 100, max: 1500 },
    3: { min: 5000, max: 50000 },
    4: { min: 3000, max: 80000 },
    5: { min: 100, max: 10000 }
  }

  const maintenanceType = maintenanceRecord.maintenanceType
  const cost = parseFloat(maintenanceRecord.maintenanceCost) || 0
  const costRange = TYPE_COST_RANGES[maintenanceType]

  if (costRange && cost > 0 && cost < costRange.min * 0.3) {
    if (result.confidence < 55) {
      result.isAnomaly = true
      result.anomalyType = 'fake_maintenance'
      result.anomalyDescription = result.anomalyDescription
        ? `${result.anomalyDescription}；费用异常偏低：${cost}元（${MAINTENANCE_TYPE_NAMES[maintenanceType]}正常范围${costRange.min}-${costRange.max}元）`
        : `费用异常偏低：${cost}元（${MAINTENANCE_TYPE_NAMES[maintenanceType]}正常范围${costRange.min}-${costRange.max}元）`
      result.confidence = Math.max(result.confidence, 55)
    }
  }

  if (vehicle.nextMaintenanceDate) {
    const nextDate = new Date(vehicle.nextMaintenanceDate)
    const recordDate = maintenanceRecord.startDate
      ? new Date(maintenanceRecord.startDate)
      : new Date()

    if (recordDate > nextDate) {
      const overdueDays = Math.ceil((recordDate - nextDate) / (1000 * 60 * 60 * 24))
      const cycle = parseInt(vehicle.maintenanceCycle) || 50000
      const mileage = parseFloat(vehicle.mileage) || 0
      const lastMileage = parseFloat(vehicle.lastMaintenanceMileage) || 0
      const mileageSinceLast = mileage - lastMileage

      if (mileageSinceLast > cycle * 1.5) {
        if (!result.isAnomaly) {
          result.isAnomaly = true
          result.anomalyType = 'missed_inspection'
          result.anomalyDescription = `已超过计划检修日期${overdueDays}天，且超出里程阈值${Math.round(mileageSinceLast - cycle)}km未检修`
          result.confidence = 85
        }
      } else if (overdueDays > 30) {
        if (!result.isAnomaly || result.anomalyType === 'fake_maintenance') {
          result.isAnomaly = true
          result.anomalyType = 'missed_inspection'
          result.anomalyDescription = result.anomalyDescription
            ? `${result.anomalyDescription}；且已超过计划检修日期${overdueDays}天`
            : `已超过计划检修日期${overdueDays}天`
          result.confidence = Math.max(result.confidence, 70)
        }
      }
    }
  }

  const mileage = parseFloat(vehicle.mileage) || 0
  const lastMileage = parseFloat(vehicle.lastMaintenanceMileage) || 0
  const mileageSinceLast = mileage - lastMileage
  const cycle = parseInt(vehicle.maintenanceCycle) || 50000

  if (mileageSinceLast > cycle * 2) {
    if (!result.isAnomaly) {
      result.isAnomaly = true
      result.anomalyType = 'missed_inspection'
      result.anomalyDescription = `车辆已超出检修里程${Math.round(mileageSinceLast - cycle)}km，存在漏检风险`
      result.confidence = 80
    }
  }

  if (maintenanceRecord.maintenanceType === 1) {
    const warningLevel = vehicle.maintenanceWarningLevel || 0
    if (warningLevel === 3) {
      if (!result.isAnomaly) {
        result.isAnomaly = true
        result.anomalyType = 'wrong_inspection'
        result.anomalyDescription = '车辆已超过检修周期，常规保养不足以解决问题，建议安排大修'
        result.confidence = 65
      }
    }
  }

  if (maintenanceRecord.maintenanceType === 2 && mileageSinceLast < cycle * 0.3) {
    if (!result.isAnomaly) {
      result.isAnomaly = true
      result.anomalyType = 'wrong_inspection'
      result.anomalyDescription = `车辆里程仅${Math.round(mileageSinceLast)}km，无需年检`
      result.confidence = 50
    }
  }

  return result
}

const batchScheduleMaintenance = async (vehicles, scheduleData) => {
  const result = {
    total: vehicles.length,
    success: 0,
    failed: 0,
    results: []
  }

  for (const vehicle of vehicles) {
    try {
      const validation = await validateMaintenanceCreation(vehicle, scheduleData)
      if (!validation.valid) {
        result.results.push({
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        })
        result.failed++
        continue
      }

      const priorityResult = await calculateMaintenancePriority(vehicle)

      const ledgerNo = await generateLedgerNo(vehicle.id, scheduleData.maintenanceType)

      const maintenanceRecord = await VehicleMaintenance.create({
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        maintenanceType: scheduleData.maintenanceType,
        maintenanceStatus: 0,
        mileageAtMaintenance: vehicle.mileage,
        maintenanceItems: scheduleData.maintenanceItems || null,
        maintenanceCost: scheduleData.maintenanceCost || null,
        maintenanceStation: scheduleData.maintenanceStation || null,
        startDate: scheduleData.scheduledDate || null,
        nextMaintenanceDate: scheduleData.nextMaintenanceDate || null,
        nextMaintenanceMileage: scheduleData.nextMaintenanceMileage || null,
        remark: scheduleData.remark || null,
        operatorId: scheduleData.operatorId || null,
        operatorName: scheduleData.operatorName || null
      })

      await syncVehicleMaintenanceStatus(vehicle, maintenanceRecord, 'create')

      result.results.push({
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        success: true,
        maintenanceId: maintenanceRecord.id,
        ledgerNo,
        priority: priorityResult.priority,
        priorityName: priorityResult.priorityName,
        warnings: validation.warnings
      })
      result.success++
    } catch (err) {
      result.results.push({
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        success: false,
        errors: [err.message]
      })
      result.failed++
    }
  }

  return result
}

const batchUpdateMaintenanceStatus = async (maintenanceIds, newStatus, operatorInfo) => {
  const result = {
    total: maintenanceIds.length,
    success: 0,
    failed: 0,
    results: []
  }

  const { Vehicle } = require('../models')

  for (const id of maintenanceIds) {
    try {
      const record = await VehicleMaintenance.findByPk(id)
      if (!record) {
        result.results.push({
          maintenanceId: id,
          success: false,
          errors: ['维护记录不存在']
        })
        result.failed++
        continue
      }

      const currentStatus = record.maintenanceStatus
      const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || []

      if (!allowedTransitions.includes(newStatus)) {
        result.results.push({
          maintenanceId: id,
          success: false,
          errors: [`不允许从状态${currentStatus}转换到状态${newStatus}`]
        })
        result.failed++
        continue
      }

      await record.update({ maintenanceStatus: newStatus })

      const vehicle = await Vehicle.findByPk(record.vehicleId)
      if (!vehicle) {
        result.results.push({
          maintenanceId: id,
          success: true,
          warnings: ['关联车辆不存在，无法同步车辆状态']
        })
        result.success++
        continue
      }

      let action
      if (newStatus === 1) action = 'start'
      else if (newStatus === 2) action = 'complete'
      else if (newStatus === 3) action = 'cancel'
      else action = 'create'

      const syncResult = await syncVehicleMaintenanceStatus(vehicle, record, action)

      result.results.push({
        maintenanceId: id,
        success: true,
        vehicleSync: syncResult
      })
      result.success++
    } catch (err) {
      result.results.push({
        maintenanceId: id,
        success: false,
        errors: [err.message]
      })
      result.failed++
    }
  }

  return result
}

const batchStatisticsMaintenanceCost = async (vehicleIds, dateRange) => {
  const whereClause = {
    vehicleId: { [Op.in]: vehicleIds },
    maintenanceStatus: 2
  }

  if (dateRange) {
    whereClause.endDate = {
      [Op.gte]: new Date(dateRange.startDate),
      [Op.lte]: new Date(dateRange.endDate)
    }
  }

  const records = await VehicleMaintenance.findAll({ where: whereClause })

  let totalCost = 0
  const byType = {
    routine: { count: 0, cost: 0 },
    annual: { count: 0, cost: 0 },
    major: { count: 0, cost: 0 },
    accident: { count: 0, cost: 0 },
    parts: { count: 0, cost: 0 }
  }
  const monthMap = {}

  for (const record of records) {
    const cost = parseFloat(record.maintenanceCost) || 0
    totalCost += cost

    const typeMapping = {
      1: 'routine',
      2: 'annual',
      3: 'major',
      4: 'accident',
      5: 'parts'
    }
    const typeKey = typeMapping[record.maintenanceType]
    if (typeKey && byType[typeKey]) {
      byType[typeKey].count++
      byType[typeKey].cost += cost
    }

    if (record.endDate) {
      const date = new Date(record.endDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, count: 0, cost: 0 }
      }
      monthMap[monthKey].count++
      monthMap[monthKey].cost += cost
    }
  }

  const completedCount = records.length
  const avgCost = completedCount > 0 ? Math.round(totalCost / completedCount * 100) / 100 : 0

  const byMonth = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month))

  Object.keys(byType).forEach(key => {
    byType[key].cost = Math.round(byType[key].cost * 100) / 100
  })

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    avgCost,
    byType,
    byMonth
  }
}

module.exports = {
  validateMaintenanceCreation,
  calculateMaintenancePriority,
  generateLedgerNo,
  syncVehicleMaintenanceStatus,
  detectMaintenanceAnomaly,
  batchScheduleMaintenance,
  batchUpdateMaintenanceStatus,
  batchStatisticsMaintenanceCost
}
