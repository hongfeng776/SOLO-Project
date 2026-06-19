const { Op } = require('sequelize')
const { VehicleComplianceCheck, VehicleRectification } = require('../models')

const TIER_ONE_CITIES = ['北京', '上海', '广州', '深圳']

const TIER_TWO_CITIES = [
  '杭州', '南京', '成都', '武汉', '西安', '重庆', '天津', '苏州',
  '长沙', '郑州', '青岛', '沈阳', '宁波', '厦门', '福州', '济南',
  '哈尔滨', '长春', '大连', '合肥', '南昌', '南宁', '昆明', '贵阳',
  '兰州', '乌鲁木齐', '石家庄', '太原', '呼和浩特', '海口'
]

const COMPLIANCE_STANDARDS = {
  1: {
    checkCycleDays: 15,
    checkLevel: 2,
    checkLevelName: '严格',
    strictDocumentCheck: true,
    violationThreshold: 2,
    maxMissedCheckLimit: 1
  },
  2: {
    checkCycleDays: 30,
    checkLevel: 1,
    checkLevelName: '常规',
    strictDocumentCheck: false,
    violationThreshold: 5,
    maxMissedCheckLimit: 2
  },
  3: {
    checkCycleDays: 60,
    checkLevel: 1,
    checkLevelName: '常规',
    strictDocumentCheck: false,
    violationThreshold: 8,
    maxMissedCheckLimit: 3
  }
}

const COMPLIANCE_LEVELS = {
  A: { level: 'A', levelName: 'A级', minScore: 90, description: '优秀' },
  B: { level: 'B', levelName: 'B级', minScore: 75, description: '良好' },
  C: { level: 'C', levelName: 'C级', minScore: 60, description: '合格' },
  D: { level: 'D', levelName: 'D级', minScore: 0, description: '不合格' }
}

const WEIGHTS = {
  insurance: 0.3,
  inspection: 0.3,
  violation: 0.2,
  parameter: 0.2
}

const getCityTier = (city) => {
  if (!city) return 3

  const cityName = city.trim()

  if (TIER_ONE_CITIES.includes(cityName)) {
    return 1
  }

  if (TIER_TWO_CITIES.includes(cityName)) {
    return 2
  }

  return 3
}

const getComplianceStandards = (cityTier) => {
  const tier = cityTier || 3
  const standards = COMPLIANCE_STANDARDS[tier] || COMPLIANCE_STANDARDS[3]

  return {
    checkCycleDays: standards.checkCycleDays,
    checkLevel: standards.checkLevel,
    checkLevelName: standards.checkLevelName,
    strictDocumentCheck: standards.strictDocumentCheck,
    violationThreshold: standards.violationThreshold,
    maxMissedCheckLimit: standards.maxMissedCheckLimit
  }
}

const calculateComplianceLevel = (vehicle, checkResults) => {
  const result = {
    level: 'C',
    levelName: 'C级',
    score: 0,
    breakdown: [],
    abnormalItems: [],
    highlightedFields: []
  }

  const cityTier = vehicle.cityTier || getCityTier(vehicle.city)
  const deductionMultiplier = cityTier === 1 ? 1.5 : cityTier === 2 ? 1.2 : 1.0

  const insuranceResult = checkResults.insuranceCheck || { score: 0, issues: [] }
  const inspectionResult = checkResults.inspectionCheck || { score: 0, issues: [] }
  const violationResult = checkResults.violationCheck || { score: 0, issues: [] }
  const parameterResult = checkResults.parameterCheck || { score: 0, issues: [] }
  const dataComparison = checkResults.dataComparison || { score: 0, issues: [] }

  const insuranceScore = Math.max(0, insuranceResult.score * WEIGHTS.insurance)
  const inspectionScore = Math.max(0, inspectionResult.score * WEIGHTS.inspection)
  const violationScore = Math.max(0, violationResult.score * WEIGHTS.violation)
  const parameterScore = Math.max(0, (parameterResult.score + dataComparison.score) / 2 * WEIGHTS.parameter)

  const totalScore = Math.round((insuranceScore + inspectionScore + violationScore + parameterScore) * 10) / 10
  result.score = totalScore

  result.breakdown = [
    { item: '保险合规', weight: WEIGHTS.insurance * 100, score: insuranceResult.score, weightedScore: insuranceScore },
    { item: '年检合规', weight: WEIGHTS.inspection * 100, score: inspectionResult.score, weightedScore: inspectionScore },
    { item: '违章合规', weight: WEIGHTS.violation * 100, score: violationResult.score, weightedScore: violationScore },
    { item: '参数/数据匹配', weight: WEIGHTS.parameter * 100, score: (parameterResult.score + dataComparison.score) / 2, weightedScore: parameterScore }
  ]

  const allAbnormalItems = [
    ...(insuranceResult.abnormalItems || []),
    ...(inspectionResult.abnormalItems || []),
    ...(violationResult.abnormalItems || []),
    ...(parameterResult.abnormalItems || []),
    ...(dataComparison.abnormalItems || [])
  ]
  result.abnormalItems = [...new Set(allAbnormalItems)]

  const allHighlightedFields = [
    ...(insuranceResult.highlightedFields || []),
    ...(inspectionResult.highlightedFields || []),
    ...(violationResult.highlightedFields || []),
    ...(parameterResult.highlightedFields || []),
    ...(dataComparison.highlightedFields || [])
  ]
  result.highlightedFields = allHighlightedFields

  if (totalScore >= COMPLIANCE_LEVELS.A.minScore) {
    result.level = COMPLIANCE_LEVELS.A.level
    result.levelName = COMPLIANCE_LEVELS.A.levelName
  } else if (totalScore >= COMPLIANCE_LEVELS.B.minScore) {
    result.level = COMPLIANCE_LEVELS.B.level
    result.levelName = COMPLIANCE_LEVELS.B.levelName
  } else if (totalScore >= COMPLIANCE_LEVELS.C.minScore) {
    result.level = COMPLIANCE_LEVELS.C.level
    result.levelName = COMPLIANCE_LEVELS.C.levelName
  } else {
    result.level = COMPLIANCE_LEVELS.D.level
    result.levelName = COMPLIANCE_LEVELS.D.levelName
  }

  return result
}

const checkInsuranceValidity = (vehicle, strictMode = false) => {
  const result = {
    passed: true,
    score: 100,
    issues: [],
    abnormalItems: [],
    highlightedFields: []
  }

  const now = new Date()

  if (!vehicle.insuranceDate) {
    result.passed = false
    result.score = 0
    result.issues.push({ type: 'insurance_missing', message: '未提供保险有效期', severity: 'high' })
    result.abnormalItems.push('保险信息缺失')
    result.highlightedFields.push({ field: 'insuranceDate', reason: '保险有效期缺失', level: 'high' })
    return result
  }

  const insuranceDate = new Date(vehicle.insuranceDate)
  const daysUntilExpiry = Math.ceil((insuranceDate - now) / (1000 * 60 * 60 * 24))

  if (insuranceDate < now) {
    result.passed = false
    result.score = 0
    result.issues.push({ type: 'insurance_expired', message: `保险已过期${Math.abs(daysUntilExpiry)}天`, severity: 'critical' })
    result.abnormalItems.push('保险已过期')
    result.highlightedFields.push({ field: 'insuranceDate', reason: '保险已过期', level: 'critical' })
  } else if (daysUntilExpiry <= 7) {
    result.score = strictMode ? 60 : 70
    result.issues.push({ type: 'insurance_near_expiry', message: `保险将在${daysUntilExpiry}天后过期`, severity: 'warning' })
    result.abnormalItems.push('保险即将过期')
    result.highlightedFields.push({ field: 'insuranceDate', reason: '保险即将过期', level: 'warning' })
  } else if (daysUntilExpiry <= 30) {
    result.score = strictMode ? 80 : 85
    result.issues.push({ type: 'insurance_expiring_soon', message: `保险将在${daysUntilExpiry}天后过期`, severity: 'info' })
    result.highlightedFields.push({ field: 'insuranceDate', reason: '保险临近过期', level: 'info' })
  }

  return result
}

const checkInspectionValidity = (vehicle, strictMode = false) => {
  const result = {
    passed: true,
    score: 100,
    issues: [],
    abnormalItems: [],
    highlightedFields: []
  }

  const now = new Date()

  if (!vehicle.inspectionDate) {
    result.passed = false
    result.score = 0
    result.issues.push({ type: 'inspection_missing', message: '未提供年检有效期', severity: 'high' })
    result.abnormalItems.push('年检信息缺失')
    result.highlightedFields.push({ field: 'inspectionDate', reason: '年检有效期缺失', level: 'high' })
    return result
  }

  const inspectionDate = new Date(vehicle.inspectionDate)
  const daysUntilExpiry = Math.ceil((inspectionDate - now) / (1000 * 60 * 60 * 24))

  if (inspectionDate < now) {
    result.passed = false
    result.score = 0
    result.issues.push({ type: 'inspection_expired', message: `年检已过期${Math.abs(daysUntilExpiry)}天`, severity: 'critical' })
    result.abnormalItems.push('年检已过期')
    result.highlightedFields.push({ field: 'inspectionDate', reason: '年检已过期', level: 'critical' })
  } else if (daysUntilExpiry <= 15) {
    result.score = strictMode ? 55 : 65
    result.issues.push({ type: 'inspection_near_expiry', message: `年检将在${daysUntilExpiry}天后过期`, severity: 'warning' })
    result.abnormalItems.push('年检即将过期')
    result.highlightedFields.push({ field: 'inspectionDate', reason: '年检即将过期', level: 'warning' })
  } else if (daysUntilExpiry <= 60) {
    result.score = strictMode ? 75 : 80
    result.issues.push({ type: 'inspection_expiring_soon', message: `年检将在${daysUntilExpiry}天后过期`, severity: 'info' })
    result.highlightedFields.push({ field: 'inspectionDate', reason: '年检临近过期', level: 'info' })
  }

  return result
}

const checkViolations = (vehicle, violationRecords = [], threshold = 5) => {
  const result = {
    passed: true,
    score: 100,
    issues: [],
    abnormalItems: [],
    highlightedFields: [],
    violationCount: 0,
    unresolvedCount: 0,
    majorViolations: []
  }

  const activeViolations = violationRecords.filter(v => v.violationStatus !== 2)
  const unresolvedCount = activeViolations.length
  result.violationCount = violationRecords.length
  result.unresolvedCount = unresolvedCount

  if (unresolvedCount === 0) {
    return result
  }

  const severeViolations = activeViolations.filter(v => v.violationLevel === 3 || v.penaltyType === 5)
  const moderateViolations = activeViolations.filter(v => v.violationLevel === 2 || (v.penaltyType >= 3 && v.penaltyType <= 4))
  const minorViolations = activeViolations.filter(v => v.violationLevel === 1 || v.penaltyType === 1 || v.penaltyType === 2)

  result.majorViolations = severeViolations.map(v => ({
    id: v.id,
    type: v.violationType,
    level: v.violationLevel,
    description: v.description,
    penaltyType: v.penaltyType
  }))

  let deduction = 0
  deduction += severeViolations.length * 25
  deduction += moderateViolations.length * 10
  deduction += minorViolations.length * 3

  if (unresolvedCount > threshold) {
    deduction += (unresolvedCount - threshold) * 5
    result.issues.push({ type: 'violation_exceed_threshold', message: `未处理违章${unresolvedCount}条，超过阈值${threshold}条`, severity: 'high' })
    result.abnormalItems.push('违章数量超标')
  }

  if (severeViolations.length > 0) {
    result.passed = false
    result.issues.push({ type: 'severe_violations', message: `存在${severeViolations.length}条严重违章`, severity: 'critical' })
    result.abnormalItems.push('存在严重违章')
    result.highlightedFields.push({ field: 'violationRecords', reason: '存在严重违章记录', level: 'critical' })
  }

  result.score = Math.max(0, 100 - deduction)

  if (result.score < 60) {
    result.passed = false
  }

  return result
}

const checkVehicleParameters = (vehicle, strictMode = false) => {
  const result = {
    passed: true,
    score: 100,
    issues: [],
    abnormalItems: [],
    highlightedFields: []
  }

  const requiredFields = ['plateNumber', 'vin', 'engineNo', 'brand', 'model', 'color']
  const missingFields = []

  requiredFields.forEach(field => {
    if (!vehicle[field] || vehicle[field] === '') {
      missingFields.push(field)
    }
  })

  if (missingFields.length > 0) {
    const fieldNames = {
      plateNumber: '车牌号',
      vin: '车架号',
      engineNo: '发动机号',
      brand: '品牌',
      model: '型号',
      color: '颜色'
    }
    const missingNames = missingFields.map(f => fieldNames[f] || f).join('、')
    result.issues.push({ type: 'missing_parameters', message: `缺少车辆参数：${missingNames}`, severity: 'warning' })
    result.abnormalItems.push('车辆参数不完整')
    missingFields.forEach(field => {
      result.highlightedFields.push({ field, reason: '参数缺失', level: 'warning' })
    })

    const deduction = missingFields.length * (strictMode ? 8 : 5)
    result.score = Math.max(0, 100 - deduction)
  }

  if (vehicle.vin && vehicle.vin.length !== 17) {
    result.issues.push({ type: 'invalid_vin', message: '车架号格式不正确（应为17位）', severity: 'high' })
    result.abnormalItems.push('车架号格式异常')
    result.highlightedFields.push({ field: 'vin', reason: '车架号格式不正确', level: 'high' })
    result.score = Math.max(0, result.score - 15)
  }

  if (vehicle.plateNumber) {
    const plateRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/
    if (!plateRegex.test(vehicle.plateNumber)) {
      result.issues.push({ type: 'invalid_plate', message: '车牌号格式不正确', severity: 'warning' })
      result.highlightedFields.push({ field: 'plateNumber', reason: '车牌号格式异常', level: 'warning' })
      result.score = Math.max(0, result.score - 5)
    }
  }

  if (result.score < 60) {
    result.passed = false
  }

  return result
}

const compareWithTrafficData = (vehicle, trafficData = null) => {
  const result = {
    passed: true,
    score: 100,
    issues: [],
    abnormalItems: [],
    highlightedFields: [],
    consistent: true,
    inconsistentFields: [],
    trafficDataVerified: false
  }

  if (!trafficData) {
    result.score = 70
    result.issues.push({ type: 'no_traffic_data', message: '暂无交管数据比对', severity: 'info' })
    return result
  }

  result.trafficDataVerified = true

  const fieldsToCompare = [
    { field: 'plateNumber', name: '车牌号' },
    { field: 'vin', name: '车架号' },
    { field: 'engineNo', name: '发动机号' },
    { field: 'brand', name: '品牌' },
    { field: 'model', name: '型号' },
    { field: 'color', name: '颜色' }
  ]

  let inconsistencyCount = 0

  fieldsToCompare.forEach(({ field, name }) => {
    if (vehicle[field] && trafficData[field] && vehicle[field] !== trafficData[field]) {
      inconsistencyCount++
      result.consistent = false
      result.inconsistentFields.push({
        field,
        name,
        platformValue: vehicle[field],
        trafficValue: trafficData[field]
      })
      result.issues.push({
        type: `data_mismatch_${field}`,
        message: `${name}数据不一致：平台值=${vehicle[field]}，交管局=${trafficData[field]}`,
        severity: 'high'
      })
      result.highlightedFields.push({ field, reason: '与交管数据不一致', level: 'high' })
    }
  })

  if (inconsistencyCount > 0) {
    result.abnormalItems.push('数据比对不一致')
    result.score = Math.max(0, 100 - inconsistencyCount * 20)
    result.passed = false
  }

  return result
}

const performComplianceCheck = async (vehicle, checkType = 4) => {
  const result = {
    checkStatus: 1,
    complianceLevel: 'B',
    complianceLevelName: 'B级',
    checkScore: 0,
    insuranceCheck: null,
    inspectionCheck: null,
    violationCheck: null,
    parameterCheck: null,
    dataComparison: null,
    abnormalItems: [],
    highlightedFields: [],
    trafficDataVerified: false,
    autoLock: false,
    lockReason: null
  }

  const cityTier = vehicle.cityTier || getCityTier(vehicle.city)
  const standards = getComplianceStandards(cityTier)

  result.insuranceCheck = checkInsuranceValidity(vehicle, standards.strictDocumentCheck)
  result.inspectionCheck = checkInspectionValidity(vehicle, standards.strictDocumentCheck)
  result.parameterCheck = checkVehicleParameters(vehicle, standards.strictDocumentCheck)

  try {
    const { VehicleViolation } = require('../models')
    const violationRecords = await VehicleViolation.findAll({
      where: {
        vehicleId: vehicle.id,
        violationStatus: { [Op.in]: [0, 1] }
      }
    })
    result.violationCheck = checkViolations(vehicle, violationRecords, standards.violationThreshold)
  } catch (err) {
    result.violationCheck = {
      passed: true,
      score: 80,
      issues: [{ type: 'violation_check_error', message: '违章查询异常，暂按80分计算', severity: 'info' }],
      abnormalItems: [],
      highlightedFields: []
    }
  }

  result.dataComparison = compareWithTrafficData(vehicle, null)
  result.trafficDataVerified = result.dataComparison.trafficDataVerified

  const levelResult = calculateComplianceLevel(vehicle, {
    insuranceCheck: result.insuranceCheck,
    inspectionCheck: result.inspectionCheck,
    violationCheck: result.violationCheck,
    parameterCheck: result.parameterCheck,
    dataComparison: result.dataComparison
  })

  result.complianceLevel = levelResult.level
  result.complianceLevelName = levelResult.levelName
  result.checkScore = levelResult.score

  result.abnormalItems = levelResult.abnormalItems
  result.highlightedFields = levelResult.highlightedFields

  const hasCriticalIssue = !result.insuranceCheck.passed || !result.inspectionCheck.passed
  const hasMajorViolation = result.violationCheck.majorViolations && result.violationCheck.majorViolations.length > 0

  if (hasCriticalIssue || hasMajorViolation) {
    result.checkStatus = 2
    result.autoLock = true
    if (hasCriticalIssue) {
      result.lockReason = '证件已过期，自动锁定车辆运营'
    } else {
      result.lockReason = '存在严重违章，自动锁定车辆运营'
    }
  } else if (result.checkScore >= 60) {
    result.checkStatus = 1
  } else {
    result.checkStatus = 3
  }

  return result
}

const detectFakeCompliance = (vehicle, checkResults) => {
  const result = {
    detected: false,
    fakeType: null,
    status: 0,
    confidence: 0,
    evidence: []
  }

  const insuranceCheck = checkResults.insuranceCheck || {}
  const inspectionCheck = checkResults.inspectionCheck || {}
  const dataComparison = checkResults.dataComparison || {}

  if (dataComparison.inconsistentFields && dataComparison.inconsistentFields.length > 0) {
    result.detected = true
    result.fakeType = 'data_mismatch'
    result.status = 1
    result.confidence = Math.min(95, 50 + dataComparison.inconsistentFields.length * 15)
    result.evidence.push({
      type: 'traffic_data_mismatch',
      description: `平台数据与交管数据存在${dataComparison.inconsistentFields.length}处不一致`,
      details: dataComparison.inconsistentFields
    })
  }

  if (vehicle.insuranceImg && vehicle.insuranceDate) {
    const registrationDate = vehicle.registrationDate ? new Date(vehicle.registrationDate) : null
    const insuranceDate = new Date(vehicle.insuranceDate)

    if (registrationDate && insuranceDate < registrationDate) {
      result.detected = true
      result.fakeType = result.fakeType || 'document_inconsistency'
      result.status = 1
      result.confidence = Math.max(result.confidence, 70)
      result.evidence.push({
        type: 'insurance_before_registration',
        description: '保险有效期早于车辆注册日期，存在证件伪造嫌疑',
        details: { registrationDate, insuranceDate }
      })
    }
  }

  if (vehicle.inspectionDate && vehicle.registrationDate) {
    const registrationDate = new Date(vehicle.registrationDate)
    const inspectionDate = new Date(vehicle.inspectionDate)
    const vehicleAgeYears = (inspectionDate - registrationDate) / (1000 * 60 * 60 * 24 * 365)

    if (vehicleAgeYears > 6 && inspectionDate - registrationDate < 365 * 2 * 24 * 60 * 60 * 1000) {
      result.detected = true
      result.fakeType = result.fakeType || 'document_inconsistency'
      result.status = 1
      result.confidence = Math.max(result.confidence, 60)
      result.evidence.push({
        type: 'inspection_date_anomaly',
        description: '车龄较大但年检有效期异常偏长，存在年检造假嫌疑',
        details: { vehicleAgeYears, inspectionDate }
      })
    }
  }

  if (checkResults.violationCheck && checkResults.violationCheck.violationCount >= 3) {
    const violations = checkResults.violationCheck.majorViolations || []
    const similarViolations = violations.filter(v => v.type === 3 || v.type === 2)

    if (similarViolations.length >= 3) {
      result.detected = true
      result.fakeType = result.fakeType || 'violation_pattern'
      result.status = 1
      result.confidence = Math.max(result.confidence, 55)
      result.evidence.push({
        type: 'repeated_similar_violations',
        description: `存在${similarViolations.length}次同类违规记录，疑似规律性违规`,
        details: { count: similarViolations.length, types: ['虚假运营', '违规接单'] }
      })
    }
  }

  if (result.confidence >= 80) {
    result.status = 2
  }

  return result
}

const detectMissedChecks = (vehicle) => {
  const result = {
    missed: false,
    overdueDays: 0,
    count: 0
  }

  if (!vehicle.nextComplianceCheckDate) {
    return result
  }

  const now = new Date()
  const nextCheckDate = new Date(vehicle.nextComplianceCheckDate)

  if (nextCheckDate < now) {
    result.missed = true
    result.overdueDays = Math.ceil((now - nextCheckDate) / (1000 * 60 * 60 * 24))

    const cycle = vehicle.complianceCheckCycle || 30
    result.count = Math.floor(result.overdueDays / cycle) + 1
  }

  return result
}

const batchComplianceCheck = async (vehicles, checkType = 4) => {
  const result = {
    total: vehicles.length,
    success: 0,
    failed: 0,
    results: []
  }

  for (const vehicle of vehicles) {
    try {
      const checkResult = await performComplianceCheck(vehicle, checkType)
      result.results.push({
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        ...checkResult
      })
      result.success++
    } catch (err) {
      result.results.push({
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        error: err.message,
        checkStatus: 0
      })
      result.failed++
    }
  }

  return result
}

const generateComplianceReport = (vehicle, checkRecords = []) => {
  const result = {
    vehicleId: vehicle.id,
    plateNumber: vehicle.plateNumber,
    summary: {
      totalChecks: checkRecords.length,
      passCount: 0,
      failCount: 0,
      partialCount: 0,
      latestScore: 0,
      latestLevel: null,
      averageScore: 0
    },
    trend: {
      direction: 'stable',
      change: 0,
      period: '30d',
      history: []
    },
    riskAssessment: {
      riskLevel: 'low',
      riskItems: [],
      suggestions: []
    },
    rectification: {
      pendingCount: 0,
      completedCount: 0,
      overdueCount: 0
    }
  }

  const sortedRecords = [...checkRecords].sort((a, b) => new Date(a.createTime) - new Date(b.createTime))

  result.summary.passCount = sortedRecords.filter(r => r.checkStatus === 1).length
  result.summary.failCount = sortedRecords.filter(r => r.checkStatus === 2).length
  result.summary.partialCount = sortedRecords.filter(r => r.checkStatus === 3).length

  if (sortedRecords.length > 0) {
    const latestRecord = sortedRecords[sortedRecords.length - 1]
    result.summary.latestScore = latestRecord.complianceScore || 0
    result.summary.latestLevel = latestRecord.complianceLevel || null

    const scores = sortedRecords.filter(r => r.complianceScore != null).map(r => r.complianceScore)
    if (scores.length > 0) {
      result.summary.averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }
  }

  result.trend.history = sortedRecords.slice(-10).map(r => ({
    date: r.createTime,
    score: r.complianceScore || 0,
    level: r.complianceLevel,
    checkType: r.checkType
  }))

  if (result.trend.history.length >= 2) {
    const firstScore = result.trend.history[0].score
    const lastScore = result.trend.history[result.trend.history.length - 1].score
    result.trend.change = lastScore - firstScore

    if (result.trend.change > 10) {
      result.trend.direction = 'up'
    } else if (result.trend.change < -10) {
      result.trend.direction = 'down'
    }
  }

  const cityTier = vehicle.cityTier || getCityTier(vehicle.city)
  const standards = getComplianceStandards(cityTier)

  const riskItems = []
  const suggestions = []

  if (vehicle.insuranceDate) {
    const daysToExpiry = Math.ceil((new Date(vehicle.insuranceDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (daysToExpiry <= 0) {
      riskItems.push({ type: 'insurance_expired', level: 'critical', message: '保险已过期' })
      suggestions.push('立即续保，避免车辆被锁定')
    } else if (daysToExpiry <= 30) {
      riskItems.push({ type: 'insurance_near_expiry', level: 'warning', message: `保险将在${daysToExpiry}天后过期` })
      suggestions.push('及时办理续保手续')
    }
  }

  if (vehicle.inspectionDate) {
    const daysToExpiry = Math.ceil((new Date(vehicle.inspectionDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (daysToExpiry <= 0) {
      riskItems.push({ type: 'inspection_expired', level: 'critical', message: '年检已过期' })
      suggestions.push('立即办理年检，否则车辆将被禁止运营')
    } else if (daysToExpiry <= 60) {
      riskItems.push({ type: 'inspection_near_expiry', level: 'warning', message: `年检将在${daysToExpiry}天后过期` })
      suggestions.push('提前安排年检')
    }
  }

  if (vehicle.pendingRectificationCount > 0) {
    riskItems.push({ type: 'pending_rectification', level: 'warning', message: `存在${vehicle.pendingRectificationCount}项待整改` })
    suggestions.push('尽快完成整改并提交复查')
  }

  result.riskAssessment.riskItems = riskItems
  result.riskAssessment.suggestions = suggestions

  if (riskItems.some(i => i.level === 'critical')) {
    result.riskAssessment.riskLevel = 'critical'
  } else if (riskItems.some(i => i.level === 'high')) {
    result.riskAssessment.riskLevel = 'high'
  } else if (riskItems.some(i => i.level === 'warning')) {
    result.riskAssessment.riskLevel = 'medium'
  }

  return result
}

module.exports = {
  getCityTier,
  getComplianceStandards,
  calculateComplianceLevel,
  performComplianceCheck,
  detectFakeCompliance,
  detectMissedChecks,
  batchComplianceCheck,
  generateComplianceReport,
  TIER_ONE_CITIES,
  TIER_TWO_CITIES,
  COMPLIANCE_STANDARDS,
  COMPLIANCE_LEVELS,
  WEIGHTS
}
