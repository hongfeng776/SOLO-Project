const { Op } = require('sequelize')
const { Vehicle } = require('../models')

const PLATE_PATTERNS = [
  /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/,
  /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][0-9]{5,6}$/
]

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/

const INVALID_VIN_CHARS = ['I', 'O', 'Q']

const ENGINE_NO_PATTERN = /^[A-Z0-9]{6,20}$/

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 9, 8, 7, 6, 5, 4, 3, 2]
const VIN_TRANSCODE = {
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
  'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
  'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '0': 0
}

const VALID_VEHICLE_TYPES = ['轿车', 'SUV', '面包车', '货车']
const VALID_EMISSION_STANDARDS = [1, 2, 3, 4, 5, 6]

const validatePlateNumber = (plateNumber) => {
  if (!plateNumber) {
    return { valid: false, message: '车牌号不能为空' }
  }
  
  const cleanPlate = plateNumber.toUpperCase().replace(/\s/g, '')
  
  if (cleanPlate.length < 7 || cleanPlate.length > 8) {
    return { valid: false, message: '车牌号长度应为7-8位' }
  }
  
  const isValid = PLATE_PATTERNS.some(pattern => pattern.test(cleanPlate))
  if (!isValid) {
    return { valid: false, message: '车牌号格式不正确' }
  }
  
  return { valid: true, message: '车牌号格式正确' }
}

const validateVIN = (vin) => {
  if (!vin) {
    return { valid: false, message: '车架号不能为空' }
  }
  
  const cleanVIN = vin.toUpperCase().replace(/\s/g, '')
  
  if (cleanVIN.length !== 17) {
    return { valid: false, message: '车架号必须为17位' }
  }
  
  for (const char of INVALID_VIN_CHARS) {
    if (cleanVIN.includes(char)) {
      return { valid: false, message: `车架号不能包含字符${char}` }
    }
  }
  
  if (!VIN_PATTERN.test(cleanVIN)) {
    return { valid: false, message: '车架号格式不正确' }
  }
  
  let sum = 0
  for (let i = 0; i < 17; i++) {
    if (i === 8) continue
    const char = cleanVIN[i]
    const value = VIN_TRANSCODE[char] || 0
    sum += value * VIN_WEIGHTS[i]
  }
  
  const remainder = sum % 11
  const checkCode = remainder === 10 ? 'X' : remainder.toString()
  const actualCheckCode = cleanVIN[8]
  
  if (checkCode !== actualCheckCode) {
    return { valid: false, message: '车架号校验码不正确，可能为虚假车架号' }
  }
  
  return { valid: true, message: '车架号格式正确' }
}

const validateEngineNo = (engineNo) => {
  if (!engineNo) {
    return { valid: true, message: '发动机号非必填' }
  }
  
  const cleanEngineNo = engineNo.toUpperCase().replace(/\s/g, '')
  
  if (cleanEngineNo.length < 6 || cleanEngineNo.length > 20) {
    return { valid: false, message: '发动机号长度应为6-20位' }
  }
  
  if (!ENGINE_NO_PATTERN.test(cleanEngineNo)) {
    return { valid: false, message: '发动机号格式不正确' }
  }
  
  return { valid: true, message: '发动机号格式正确' }
}

const validateDateNotExpired = (dateStr, fieldName) => {
  if (!dateStr) {
    return { valid: false, message: `${fieldName}不能为空` }
  }
  
  const date = new Date(dateStr)
  const now = new Date()
  
  if (isNaN(date.getTime())) {
    return { valid: false, message: `${fieldName}格式不正确` }
  }
  
  if (date < now) {
    return { valid: false, message: `${fieldName}已过期`, expired: true }
  }
  
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
  
  if (date < thirtyDaysLater) {
    return { valid: true, message: `${fieldName}将在30天内到期，请注意及时更新`, warning: true }
  }
  
  return { valid: true, message: `${fieldName}有效` }
}

const validateVehicleParams = (vehicleData) => {
  const results = []
  
  if (!vehicleData.brand || vehicleData.brand.trim().length < 1) {
    results.push({ valid: false, field: 'brand', message: '车辆品牌不能为空' })
  }
  
  if (!vehicleData.model || vehicleData.model.trim().length < 1) {
    results.push({ valid: false, field: 'model', message: '车辆型号不能为空' })
  }
  
  if (!vehicleData.color || vehicleData.color.trim().length < 1) {
    results.push({ valid: false, field: 'color', message: '车辆颜色不能为空' })
  }
  
  if (vehicleData.seats && (vehicleData.seats < 2 || vehicleData.seats > 9)) {
    results.push({ valid: false, field: 'seats', message: '座位数应在2-9之间' })
  }
  
  if (vehicleData.vehicleType && !VALID_VEHICLE_TYPES.includes(vehicleData.vehicleType)) {
    results.push({ valid: false, field: 'vehicleType', message: '车辆类型不正确' })
  }
  
  if (vehicleData.emissionStandard !== undefined && vehicleData.emissionStandard !== null) {
    if (!VALID_EMISSION_STANDARDS.includes(parseInt(vehicleData.emissionStandard))) {
      results.push({ valid: false, field: 'emissionStandard', message: '排放标准不正确' })
    }
  }
  
  if (vehicleData.displacement !== undefined && vehicleData.displacement !== null) {
    const disp = parseFloat(vehicleData.displacement)
    if (isNaN(disp) || disp < 0.8 || disp > 6.0) {
      results.push({ valid: false, field: 'displacement', message: '排量应在0.8L-6.0L之间' })
    }
  }
  
  return results
}

const checkPlateUniqueness = async (plateNumber, excludeId = null) => {
  const cleanPlate = plateNumber.toUpperCase().replace(/\s/g, '')
  
  const where = { plateNumber: cleanPlate }
  if (excludeId) {
    where.id = { [Op.ne]: excludeId }
  }
  
  const existing = await Vehicle.findOne({ where })
  
  if (existing) {
    return { valid: false, unique: false, message: '该车牌号已存在，禁止重复备案' }
  }
  
  return { valid: true, unique: true, message: '车牌号可用' }
}

const checkVINUniqueness = async (vin, excludeId = null) => {
  const cleanVIN = vin.toUpperCase().replace(/\s/g, '')
  
  const where = { vin: cleanVIN }
  if (excludeId) {
    where.id = { [Op.ne]: excludeId }
  }
  
  const existing = await Vehicle.findOne({ where })
  
  if (existing) {
    return { valid: false, unique: false, message: '该车架号已存在，可能为重复备案' }
  }
  
  return { valid: true, unique: true, message: '车架号可用' }
}

const detectDocumentFraud = async (vehicleData) => {
  const risks = []
  
  if (vehicleData.drivingLicenseDate && vehicleData.registrationDate) {
    const licenseDate = new Date(vehicleData.drivingLicenseDate)
    const regDate = new Date(vehicleData.registrationDate)
    
    if (licenseDate < regDate) {
      risks.push({
        level: 'high',
        type: 'document_fraud',
        message: '行驶证有效期早于注册日期，证件可能造假'
      })
    }
  }
  
  if (vehicleData.vin && vehicleData.plateNumber) {
    const firstVINChar = vehicleData.vin[0]
    const plateProvince = vehicleData.plateNumber[0]
    
    const chinaVINPrefixes = ['L']
    if (chinaVINPrefixes.includes(firstVINChar)) {
      const domesticProvinces = ['京', '津', '沪', '渝', '冀', '豫', '云', '辽', '黑', '湘', '皖', '鲁', '新', '苏', '浙', '赣', '鄂', '桂', '甘', '晋', '蒙', '陕', '吉', '闽', '贵', '粤', '青', '藏', '川', '宁', '琼']
      if (!domesticProvinces.includes(plateProvince)) {
        risks.push({
          level: 'medium',
          type: 'information_mismatch',
          message: '国产车辆挂境外车牌，信息可能不符'
        })
      }
    }
  }
  
  if (vehicleData.insuranceDate && vehicleData.inspectionDate) {
    const insuranceDate = new Date(vehicleData.insuranceDate)
    const inspectionDate = new Date(vehicleData.inspectionDate)
    
    if (insuranceDate < inspectionDate) {
      risks.push({
        level: 'low',
        type: 'date_warning',
        message: '保险有效期早于年检有效期，请确认'
      })
    }
  }
  
  return risks
}

const validateVehicle = async (vehicleData, excludeId = null) => {
  const result = {
    valid: true,
    passed: [],
    failed: [],
    warnings: [],
    risks: []
  }
  
  const plateResult = validatePlateNumber(vehicleData.plateNumber)
  if (plateResult.valid) {
    result.passed.push({ field: 'plateNumber', ...plateResult })
  } else {
    result.failed.push({ field: 'plateNumber', ...plateResult })
    result.valid = false
  }
  
  if (vehicleData.vin) {
    const vinResult = validateVIN(vehicleData.vin)
    if (vinResult.valid) {
      result.passed.push({ field: 'vin', ...vinResult })
    } else {
      result.failed.push({ field: 'vin', ...vinResult })
      result.valid = false
    }
  }
  
  if (vehicleData.engineNo) {
    const engineResult = validateEngineNo(vehicleData.engineNo)
    if (engineResult.valid) {
      result.passed.push({ field: 'engineNo', ...engineResult })
    } else {
      result.failed.push({ field: 'engineNo', ...engineResult })
      result.valid = false
    }
  }
  
  if (vehicleData.drivingLicenseDate) {
    const licenseResult = validateDateNotExpired(vehicleData.drivingLicenseDate, '行驶证有效期')
    if (licenseResult.valid) {
      if (licenseResult.warning) {
        result.warnings.push({ field: 'drivingLicenseDate', ...licenseResult })
      } else {
        result.passed.push({ field: 'drivingLicenseDate', ...licenseResult })
      }
    } else {
      result.failed.push({ field: 'drivingLicenseDate', ...licenseResult })
      result.valid = false
    }
  }
  
  if (vehicleData.inspectionDate) {
    const inspectionResult = validateDateNotExpired(vehicleData.inspectionDate, '年检有效期')
    if (inspectionResult.valid) {
      if (inspectionResult.warning) {
        result.warnings.push({ field: 'inspectionDate', ...inspectionResult })
      } else {
        result.passed.push({ field: 'inspectionDate', ...inspectionResult })
      }
    } else {
      result.failed.push({ field: 'inspectionDate', ...inspectionResult })
      result.valid = false
    }
  }
  
  if (vehicleData.insuranceDate) {
    const insuranceResult = validateDateNotExpired(vehicleData.insuranceDate, '保险有效期')
    if (insuranceResult.valid) {
      if (insuranceResult.warning) {
        result.warnings.push({ field: 'insuranceDate', ...insuranceResult })
      } else {
        result.passed.push({ field: 'insuranceDate', ...insuranceResult })
      }
    } else {
      result.failed.push({ field: 'insuranceDate', ...insuranceResult })
      result.valid = false
    }
  }
  
  const paramResults = validateVehicleParams(vehicleData)
  paramResults.forEach(r => {
    if (r.valid) {
      result.passed.push(r)
    } else {
      result.failed.push(r)
      result.valid = false
    }
  })
  
  if (vehicleData.plateNumber && result.failed.every(f => f.field !== 'plateNumber')) {
    const plateUniqueResult = await checkPlateUniqueness(vehicleData.plateNumber, excludeId)
    if (plateUniqueResult.valid) {
      result.passed.push({ field: 'plateNumberUniqueness', ...plateUniqueResult })
    } else {
      result.failed.push({ field: 'plateNumberUniqueness', ...plateUniqueResult })
      result.valid = false
    }
  }
  
  if (vehicleData.vin && result.failed.every(f => f.field !== 'vin')) {
    const vinUniqueResult = await checkVINUniqueness(vehicleData.vin, excludeId)
    if (vinUniqueResult.valid) {
      result.passed.push({ field: 'vinUniqueness', ...vinUniqueResult })
    } else {
      result.failed.push({ field: 'vinUniqueness', ...vinUniqueResult })
      result.valid = false
    }
  }
  
  const fraudRisks = await detectDocumentFraud(vehicleData)
  result.risks = fraudRisks
  
  if (fraudRisks.some(r => r.level === 'high')) {
    result.valid = false
    result.failed.push({
      field: 'documentAuthenticity',
      valid: false,
      message: '检测到高风险证件问题，备案申请已被拦截'
    })
  }
  
  return result
}

const calculateVehicleAge = (registrationDate) => {
  if (!registrationDate) return null
  
  const regDate = new Date(registrationDate)
  const now = new Date()
  const ageInMonths = (now.getFullYear() - regDate.getFullYear()) * 12 + (now.getMonth() - regDate.getMonth())
  const ageInYears = ageInMonths / 12
  
  return Math.round(ageInYears * 10) / 10
}

module.exports = {
  validatePlateNumber,
  validateVIN,
  validateEngineNo,
  validateDateNotExpired,
  validateVehicleParams,
  checkPlateUniqueness,
  checkVINUniqueness,
  detectDocumentFraud,
  validateVehicle,
  calculateVehicleAge
}
