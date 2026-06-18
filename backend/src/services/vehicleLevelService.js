const { calculateVehicleAge } = require('./vehicleValidationService')

const OPERATION_LEVELS = {
  S: { level: 1, name: 'S级', minScore: 90 },
  A: { level: 2, name: 'A级', minScore: 75 },
  B: { level: 3, name: 'B级', minScore: 60 },
  C: { level: 4, name: 'C级', minScore: 0 }
}

const CAPACITY_TYPE_WEIGHTS = {
  1: { name: '快车', baseScore: 70, maxOrderRadius: 10 },
  2: { name: '专车', baseScore: 80, maxOrderRadius: 15 },
  3: { name: '豪华车', baseScore: 90, maxOrderRadius: 20 },
  4: { name: '拼车', baseScore: 60, maxOrderRadius: 8 },
  5: { name: '出租车', baseScore: 75, maxOrderRadius: 12 }
}

const VEHICLE_TYPE_SCORES = {
  '轿车': 10,
  'SUV': 8,
  '面包车': 5,
  '货车': 3
}

const EMISSION_STANDARD_SCORES = {
  1: 0,
  2: 5,
  3: 10,
  4: 15,
  5: 20,
  6: 25
}

const VEHICLE_AGE_SCORES = [
  { maxAge: 1, score: 25 },
  { maxAge: 3, score: 20 },
  { maxAge: 5, score: 15 },
  { maxAge: 8, score: 10 },
  { maxAge: 10, score: 5 },
  { maxAge: Infinity, score: 0 }
]

const DISPLACEMENT_SCORES = [
  { maxDisp: 1.6, score: 5 },
  { maxDisp: 2.0, score: 8 },
  { maxDisp: 2.5, score: 10 },
  { maxDisp: 3.0, score: 12 },
  { maxDisp: Infinity, score: 15 }
]

const SEATS_SCORES = {
  2: 3,
  4: 5,
  5: 8,
  6: 10,
  7: 12,
  9: 15
}

const calculateOperationLevel = (vehicleData) => {
  const result = {
    level: 3,
    levelName: 'B级',
    totalScore: 0,
    breakdown: [],
    orderScope: {},
    premiumPermission: 0,
    operationTimeLimit: 12
  }

  const capacityType = vehicleData.capacityType || 1
  const capacityConfig = CAPACITY_TYPE_WEIGHTS[capacityType] || CAPACITY_TYPE_WEIGHTS[1]
  
  result.totalScore += capacityConfig.baseScore
  result.breakdown.push({
    item: '运力类型',
    value: capacityConfig.name,
    score: capacityConfig.baseScore
  })

  if (vehicleData.vehicleType) {
    const typeScore = VEHICLE_TYPE_SCORES[vehicleData.vehicleType] || 0
    result.totalScore += typeScore
    result.breakdown.push({
      item: '车辆类型',
      value: vehicleData.vehicleType,
      score: typeScore
    })
  }

  if (vehicleData.emissionStandard) {
    const emissionScore = EMISSION_STANDARD_SCORES[vehicleData.emissionStandard] || 0
    result.totalScore += emissionScore
    result.breakdown.push({
      item: '排放标准',
      value: `国${['一', '二', '三', '四', '五', '六'][vehicleData.emissionStandard - 1] || 'N'}`,
      score: emissionScore
    })
  }

  if (vehicleData.registrationDate) {
    const vehicleAge = calculateVehicleAge(vehicleData.registrationDate)
    const ageScoreConfig = VEHICLE_AGE_SCORES.find(s => vehicleAge <= s.maxAge)
    const ageScore = ageScoreConfig ? ageScoreConfig.score : 0
    result.totalScore += ageScore
    result.breakdown.push({
      item: '车龄',
      value: `${vehicleAge}年`,
      score: ageScore
    })
  }

  if (vehicleData.displacement) {
    const disp = parseFloat(vehicleData.displacement)
    const dispScoreConfig = DISPLACEMENT_SCORES.find(s => disp <= s.maxDisp)
    const dispScore = dispScoreConfig ? dispScoreConfig.score : 0
    result.totalScore += dispScore
    result.breakdown.push({
      item: '排量',
      value: `${disp}L`,
      score: dispScore
    })
  }

  if (vehicleData.seats) {
    const seatsScore = SEATS_SCORES[vehicleData.seats] || 5
    result.totalScore += seatsScore
    result.breakdown.push({
      item: '座位数',
      value: `${vehicleData.seats}座`,
      score: seatsScore
    })
  }

  if (result.totalScore >= OPERATION_LEVELS.S.minScore) {
    result.level = OPERATION_LEVELS.S.level
    result.levelName = OPERATION_LEVELS.S.name
  } else if (result.totalScore >= OPERATION_LEVELS.A.minScore) {
    result.level = OPERATION_LEVELS.A.level
    result.levelName = OPERATION_LEVELS.A.name
  } else if (result.totalScore >= OPERATION_LEVELS.B.minScore) {
    result.level = OPERATION_LEVELS.B.level
    result.levelName = OPERATION_LEVELS.B.name
  } else {
    result.level = OPERATION_LEVELS.C.level
    result.levelName = OPERATION_LEVELS.C.name
  }

  result.orderScope = {
    maxRadius: capacityConfig.maxOrderRadius,
    allowAirport: result.level <= 2,
    allowBusiness: result.level <= 1,
    allowLongDistance: result.level <= 2,
    peakPriority: result.level <= 1
  }

  const premiumMap = { 1: 30, 2: 20, 3: 10, 4: 0 }
  result.premiumPermission = premiumMap[result.level] || 0

  const timeLimitMap = { 1: 16, 2: 14, 3: 12, 4: 8 }
  result.operationTimeLimit = timeLimitMap[result.level] || 12

  return result
}

const syncDriverOrderPermission = async (vehicle, driverModel, auditLogModel, operatorId = null, operatorName = null) => {
  if (!vehicle.driverId) return { updated: false, message: '车辆未绑定司机' }

  const driver = await driverModel.findByPk(vehicle.driverId)
  if (!driver) return { updated: false, message: '司机不存在' }

  const canAcceptOrder = vehicle.auditStatus === 1 && vehicle.status !== 3 && vehicle.status !== 4 && vehicle.isLocked === 0
  const oldCanAcceptOrder = driver.canAcceptOrder

  if (oldCanAcceptOrder !== canAcceptOrder) {
    await driver.update({ canAcceptOrder })

    if (auditLogModel) {
      await auditLogModel.create({
        driverId: driver.id,
        operationType: canAcceptOrder ? 3 : 8,
        operationTypeName: canAcceptOrder ? '审核通过' : '资质过期',
        oldStatus: oldCanAcceptOrder,
        newStatus: canAcceptOrder,
        remark: `车辆${vehicle.plateNumber}${canAcceptOrder ? '备案通过，恢复司机接单权限' : '备案状态变更，暂停司机接单权限'}`,
        operatorId,
        operatorName
      })
    }

    return {
      updated: true,
      driverId: driver.id,
      driverName: driver.name,
      oldCanAcceptOrder,
      newCanAcceptOrder: canAcceptOrder,
      message: `司机${driver.name}接单权限已${canAcceptOrder ? '恢复' : '暂停'}`
    }
  }

  return { updated: false, message: '司机接单权限未变更' }
}

const getLevelPrivileges = (level) => {
  const privileges = {
    1: {
      level: 'S级',
      orderScope: '全部订单（含机场、商务、长途）',
      premiumPermission: '最高30%溢价',
      operationTimeLimit: '16小时/天',
      priority: '最高优先级',
      features: ['机场订单优先派单', '商务订单专属', '长途订单优先', '高峰期流量倾斜', '专属客服']
    },
    2: {
      level: 'A级',
      orderScope: '常规订单+机场+长途',
      premiumPermission: '最高20%溢价',
      operationTimeLimit: '14小时/天',
      priority: '高优先级',
      features: ['机场订单派单', '长途订单派单', '高峰期流量倾斜']
    },
    3: {
      level: 'B级',
      orderScope: '常规订单',
      premiumPermission: '最高10%溢价',
      operationTimeLimit: '12小时/天',
      priority: '正常优先级',
      features: ['常规订单派单', '基础溢价权限']
    },
    4: {
      level: 'C级',
      orderScope: '限制订单范围',
      premiumPermission: '无溢价权限',
      operationTimeLimit: '8小时/天',
      priority: '低优先级',
      features: ['仅近郊订单', '无溢价', '运营时长受限']
    }
  }

  return privileges[level] || privileges[3]
}

module.exports = {
  calculateOperationLevel,
  syncDriverOrderPermission,
  getLevelPrivileges,
  OPERATION_LEVELS,
  CAPACITY_TYPE_WEIGHTS
}
