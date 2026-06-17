const { Op } = require('sequelize')
const { Driver, DriverAuditLog, Notification } = require('../models')
const { AppError } = require('../utils/response')
const notificationService = require('./notificationService')

const CITY_AUDIT_STANDARDS = {
  'beijing': { driverLicenseMinYears: 3, minCreditScore: 85 },
  'shanghai': { driverLicenseMinYears: 3, minCreditScore: 85 },
  'guangzhou': { driverLicenseMinYears: 2, minCreditScore: 80 },
  'shenzhen': { driverLicenseMinYears: 2, minCreditScore: 80 },
  'default': { driverLicenseMinYears: 1, minCreditScore: 75 }
}

const VEHICLE_TYPE_STANDARDS = {
  'luxury': { minDriverLevel: 2, extraCheck: true },
  'comfort': { minDriverLevel: 1, extraCheck: false },
  'economy': { minDriverLevel: 1, extraCheck: false },
  'default': { minDriverLevel: 1, extraCheck: false }
}

const OPERATION_TYPE_MAP = {
  1: '资料提交',
  2: '资料修改',
  3: '审核通过',
  4: '审核驳回',
  5: '资料复核',
  6: '加急审核',
  7: '提醒补全',
  8: '资质过期'
}

const checkQualification = async (driverId) => {
  const driver = await Driver.findByPk(driverId)
  if (!driver) {
    throw new AppError('司机不存在', 404, 404)
  }

  const now = new Date()
  const checks = []
  let overallPassed = true

  checks.push({
    type: 'idCard',
    name: '身份证校验',
    passed: !!driver.idCard,
    hasImage: !!driver.idCardImg,
    validDate: driver.idCardValidDate,
    isExpired: driver.idCardValidDate ? new Date(driver.idCardValidDate) < now : false,
    message: !driver.idCard ? '身份证号缺失' :
             !driver.idCardImg ? '身份证照片缺失' :
             driver.idCardValidDate && new Date(driver.idCardValidDate) < now ? '身份证已过期' : '校验通过'
  })

  checks.push({
    type: 'driverLicense',
    name: '驾驶证校验',
    passed: !!driver.driverLicenseNo,
    hasImage: !!driver.driverLicenseImg,
    validDate: driver.driverLicenseValidDate,
    isExpired: driver.driverLicenseValidDate ? new Date(driver.driverLicenseValidDate) < now : false,
    message: !driver.driverLicenseNo ? '驾驶证号缺失' :
             !driver.driverLicenseImg ? '驾驶证照片缺失' :
             driver.driverLicenseValidDate && new Date(driver.driverLicenseValidDate) < now ? '驾驶证已过期' : '校验通过'
  })

  checks.push({
    type: 'vehicleLicense',
    name: '行驶证校验',
    passed: !!driver.vehicleLicenseNo,
    hasImage: !!driver.vehicleLicenseImg,
    validDate: driver.vehicleLicenseValidDate,
    isExpired: driver.vehicleLicenseValidDate ? new Date(driver.vehicleLicenseValidDate) < now : false,
    message: !driver.vehicleLicenseNo ? '行驶证号缺失' :
             !driver.vehicleLicenseImg ? '行驶证照片缺失' :
             driver.vehicleLicenseValidDate && new Date(driver.vehicleLicenseValidDate) < now ? '行驶证已过期' : '校验通过'
  })

  checks.push({
    type: 'faceVerify',
    name: '人脸核验',
    passed: driver.faceVerifyResult === 1,
    hasImage: !!driver.faceImg,
    score: driver.faceVerifyScore,
    message: !driver.faceImg ? '人脸照片缺失' :
             driver.faceVerifyResult === 0 ? '未进行人脸核验' :
             driver.faceVerifyResult === 2 ? '人脸核验不通过' : '人脸核验通过'
  })

  checks.push({
    type: 'criminalRecord',
    name: '无违法犯罪记录证明',
    passed: !!driver.criminalRecordImg,
    hasImage: !!driver.criminalRecordImg,
    validDate: driver.criminalRecordValidDate,
    isExpired: driver.criminalRecordValidDate ? new Date(driver.criminalRecordValidDate) < now : false,
    message: !driver.criminalRecordImg ? '无违法犯罪记录证明缺失' :
             driver.criminalRecordValidDate && new Date(driver.criminalRecordValidDate) < now ? '证明已过期' : '校验通过'
  })

  overallPassed = checks.every(c => c.passed && !c.isExpired)

  const cityStandard = CITY_AUDIT_STANDARDS[driver.city] || CITY_AUDIT_STANDARDS['default']
  const vehicleStandard = VEHICLE_TYPE_STANDARDS[driver.vehicleType] || VEHICLE_TYPE_STANDARDS['default']

  const cityCheck = {
    type: 'cityStandard',
    name: '城市准入标准',
    city: driver.city,
    requiredYears: cityStandard.driverLicenseMinYears,
    requiredScore: cityStandard.minCreditScore,
    passed: driver.reputationScore >= cityStandard.minCreditScore,
    message: driver.reputationScore >= cityStandard.minCreditScore ? '符合城市准入标准' : `信誉分${driver.reputationScore}低于城市要求${cityStandard.minCreditScore}`
  }
  checks.push(cityCheck)

  const vehicleCheck = {
    type: 'vehicleStandard',
    name: '车型适配标准',
    vehicleType: driver.vehicleType,
    requiredLevel: vehicleStandard.minDriverLevel,
    extraCheck: vehicleStandard.extraCheck,
    passed: driver.driverLevel >= vehicleStandard.minDriverLevel,
    message: driver.driverLevel >= vehicleStandard.minDriverLevel ? '符合车型适配标准' : `司机等级${driver.driverLevel}低于车型要求${vehicleStandard.minDriverLevel}`
  }
  checks.push(vehicleCheck)

  if (!overallPassed) {
    const failedChecks = checks.filter(c => !c.passed || c.isExpired)
    overallPassed = false
  }

  const duplicateCheck = await checkDuplicateAccount(driver)
  checks.push(duplicateCheck)
  if (duplicateCheck.hasDuplicate) {
    overallPassed = false
  }

  const fakeCheck = checkFakeQualification(driver)
  checks.push(fakeCheck)
  if (fakeCheck.isSuspicious) {
    overallPassed = false
  }

  const violationPoints = checks
    .filter(c => !c.passed || c.isExpired || c.hasDuplicate || c.isSuspicious)
    .map(c => ({
      type: c.type,
      name: c.name,
      message: c.message,
      severity: c.isExpired || c.hasDuplicate || c.isSuspicious ? 'high' : 'medium'
    }))

  await driver.update({
    qualificationStatus: overallPassed ? 1 : 2,
    qualificationResult: checks,
    violationPoints
  })

  return {
    driverId,
    overallPassed,
    checks,
    violationPoints
  }
}

const checkDuplicateAccount = async (driver) => {
  const where = {
    id: { [Op.ne]: driver.id },
    [Op.or]: []
  }
  if (driver.phone) where[Op.or].push({ phone: driver.phone })
  if (driver.idCard) where[Op.or].push({ idCard: driver.idCard })
  if (driver.driverLicenseNo) where[Op.or].push({ driverLicenseNo: driver.driverLicenseNo })

  const duplicateCount = await Driver.count({ where })

  return {
    type: 'duplicateCheck',
    name: '重复账号检测',
    hasDuplicate: duplicateCount > 0,
    duplicateCount,
    passed: duplicateCount === 0,
    message: duplicateCount > 0 ? `检测到${duplicateCount}个重复账号` : '无重复账号'
  }
}

const checkFakeQualification = (driver) => {
  const suspicious = []

  if (driver.idCard && !/^\d{17}[\dXx]$/.test(driver.idCard)) {
    suspicious.push('身份证号格式不正确')
  }
  if (driver.driverLicenseNo && driver.driverLicenseNo.length < 10) {
    suspicious.push('驾驶证号长度异常')
  }
  if (driver.faceVerifyResult === 1 && driver.faceVerifyScore && driver.faceVerifyScore < 70) {
    suspicious.push('人脸核验分数过低')
  }

  return {
    type: 'fakeCheck',
    name: '虚假资质检测',
    isSuspicious: suspicious.length > 0,
    suspiciousItems: suspicious,
    passed: suspicious.length === 0,
    message: suspicious.length > 0 ? suspicious.join('；') : '未检测到虚假资质'
  }
}

const getAuditStrictness = (driver) => {
  const isNewDriver = driver.driverLevel === 1
  const isLowReputation = driver.reputationLevel === 1
  const cityStandard = CITY_AUDIT_STANDARDS[driver.city] || CITY_AUDIT_STANDARDS['default']
  const vehicleStandard = VEHICLE_TYPE_STANDARDS[driver.vehicleType] || VEHICLE_TYPE_STANDARDS['default']

  return {
    strictness: isNewDriver || isLowReputation ? 'high' : 'normal',
    isNewDriver,
    isLowReputation,
    requireManualReview: isNewDriver || isLowReputation || vehicleStandard.extraCheck,
    minCheckItems: isNewDriver ? 8 : 6,
    description: isNewDriver ? '新手司机，需严格审核' :
                 isLowReputation ? '低信誉司机，需单人精细核验' :
                 vehicleStandard.extraCheck ? '高端车型，需额外核验' : '正常审核标准'
  }
}

const createAuditLog = async (driverId, operationType, data = {}) => {
  const { oldStatus, newStatus, remark, qualificationCheck, operatorId, operatorName } = data

  const log = await DriverAuditLog.create({
    driverId,
    operationType,
    operationTypeName: OPERATION_TYPE_MAP[operationType],
    oldStatus,
    newStatus,
    remark,
    qualificationCheck,
    operatorId,
    operatorName
  })

  return log
}

const sendAuditNotification = async (driver, auditStatus, remark = '') => {
  const statusMap = {
    1: { title: '资质审核通过', content: `恭喜您，您的司机入驻资质已审核通过，可以开始接单了。${remark ? '备注：' + remark : ''}` },
    2: { title: '资质审核驳回', content: `很抱歉，您的司机入驻资质审核未通过。${remark ? '原因：' + remark : ''}` },
    5: { title: '待资料复核', content: `您的入驻资料需重新复核，请配合审核人员。${remark ? '备注：' + remark : ''}` },
    7: { title: '请补全资料', content: `请您及时补全入驻所需资料，以便完成审核。${remark ? '备注：' + remark : ''}` }
  }

  const notification = statusMap[auditStatus]
  if (notification) {
    await notificationService.sendToUser(driver.id, notification.title, notification.content, 2)
  }
}

const updateCanAcceptOrder = async (driverId, canAccept) => {
  const driver = await Driver.findByPk(driverId)
  if (driver) {
    await driver.update({ canAcceptOrder: canAccept ? 1 : 0 })
  }
}

const batchAudit = async (ids, auditStatus, remark, operatorId, operatorName) => {
  const results = []
  const now = new Date()

  for (const id of ids) {
    try {
      const driver = await Driver.findByPk(id)
      if (!driver) {
        results.push({ id, success: false, message: '司机不存在' })
        continue
      }

      const oldStatus = driver.auditStatus

      await driver.update({
        auditStatus,
        auditRemark: remark,
        auditTime: now,
        auditorId: operatorId
      })

      if (auditStatus === 1) {
        await updateCanAcceptOrder(id, true)
      } else if (auditStatus === 2) {
        await updateCanAcceptOrder(id, false)
      }

      await createAuditLog(id, auditStatus === 1 ? 3 : 4, {
        oldStatus,
        newStatus: auditStatus,
        remark,
        operatorId,
        operatorName
      })

      await sendAuditNotification(driver, auditStatus, remark)

      results.push({ id, success: true, message: '操作成功' })
    } catch (error) {
      results.push({ id, success: false, message: error.message })
    }
  }

  return results
}

const batchReview = async (ids, remark, operatorId, operatorName) => {
  const results = []

  for (const id of ids) {
    try {
      const driver = await Driver.findByPk(id)
      if (!driver) {
        results.push({ id, success: false, message: '司机不存在' })
        continue
      }

      const oldStatus = driver.auditStatus
      await driver.update({ auditStatus: 5, auditRemark: remark })

      await createAuditLog(id, 5, {
        oldStatus,
        newStatus: 5,
        remark,
        operatorId,
        operatorName
      })

      await sendAuditNotification(driver, 5, remark)

      results.push({ id, success: true, message: '操作成功' })
    } catch (error) {
      results.push({ id, success: false, message: error.message })
    }
  }

  return results
}

const batchRemind = async (ids, remark, operatorId, operatorName) => {
  const results = []

  for (const id of ids) {
    try {
      const driver = await Driver.findByPk(id)
      if (!driver) {
        results.push({ id, success: false, message: '司机不存在' })
        continue
      }

      await createAuditLog(id, 7, {
        oldStatus: driver.auditStatus,
        remark,
        operatorId,
        operatorName
      })

      await sendAuditNotification(driver, 7, remark)

      results.push({ id, success: true, message: '操作成功' })
    } catch (error) {
      results.push({ id, success: false, message: error.message })
    }
  }

  return results
}

const batchUrgent = async (ids, operatorId, operatorName) => {
  const results = []

  for (const id of ids) {
    try {
      const driver = await Driver.findByPk(id)
      if (!driver) {
        results.push({ id, success: false, message: '司机不存在' })
        continue
      }

      if (driver.reputationLevel !== 3) {
        results.push({ id, success: false, message: '非高信誉司机，不可加急审核' })
        continue
      }

      await driver.update({ isUrgent: 1 })

      await createAuditLog(id, 6, {
        oldStatus: driver.auditStatus,
        remark: '高信誉司机加急审核',
        operatorId,
        operatorName
      })

      results.push({ id, success: true, message: '操作成功' })
    } catch (error) {
      results.push({ id, success: false, message: error.message })
    }
  }

  return results
}

const getAuditLogs = async (driverId) => {
  const logs = await DriverAuditLog.findAll({
    where: { driverId },
    order: [['createTime', 'DESC']]
  })
  return logs
}

const getAuditDashboard = async () => {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

  const [
    pendingCount,
    approvedCount,
    rejectedCount,
    exceptionCount,
    expiredCount,
    urgentCount,
    lowReputationCount
  ] = await Promise.all([
    Driver.count({ where: { auditStatus: 0 } }),
    Driver.count({ where: { auditStatus: 1, auditTime: { [Op.gte]: todayStart } } }),
    Driver.count({ where: { auditStatus: 2, auditTime: { [Op.gte]: todayStart } } }),
    Driver.count({ where: { auditStatus: 3 } }),
    Driver.count({ where: { auditStatus: 4 } }),
    Driver.count({ where: { isUrgent: 1, auditStatus: 0 } }),
    Driver.count({ where: { reputationLevel: 1, auditStatus: 0 } })
  ])

  const cityDistribution = await Driver.findAll({
    where: { auditStatus: { [Op.in]: [0, 1, 2, 3, 4, 5] } },
    attributes: [
      'city',
      'auditStatus',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['city', 'auditStatus'],
    raw: true
  })

  return {
    pendingCount,
    approvedCount,
    rejectedCount,
    exceptionCount,
    expiredCount,
    urgentCount,
    lowReputationCount,
    cityDistribution,
    todayStart
  }
}

const checkExpiredQualifications = async () => {
  const now = new Date()
  const expiredDrivers = await Driver.findAll({
    where: {
      auditStatus: 1,
      [Op.or]: [
        { idCardValidDate: { [Op.lt]: now } },
        { driverLicenseValidDate: { [Op.lt]: now } },
        { vehicleLicenseValidDate: { [Op.lt]: now } },
        { criminalRecordValidDate: { [Op.lt]: now } }
      ]
    }
  })

  const results = []
  for (const driver of expiredDrivers) {
    await driver.update({ auditStatus: 4, canAcceptOrder: 0 })
    await createAuditLog(driver.id, 8, {
      oldStatus: 1,
      newStatus: 4,
      remark: '资质已过期'
    })
    await sendAuditNotification(driver, 2, '您的入驻资质已过期，请及时更新')
    results.push({ id: driver.id, name: driver.name })
  }

  return results
}

module.exports = {
  checkQualification,
  getAuditStrictness,
  createAuditLog,
  sendAuditNotification,
  updateCanAcceptOrder,
  batchAudit,
  batchReview,
  batchRemind,
  batchUrgent,
  getAuditLogs,
  getAuditDashboard,
  checkExpiredQualifications,
  OPERATION_TYPE_MAP
}
