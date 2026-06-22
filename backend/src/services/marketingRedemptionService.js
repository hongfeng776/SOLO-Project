const { Op } = require('sequelize')
const { MarketingCampaign, MarketingRedemptionRecord } = require('../models')
const { AppError } = require('../utils/response')

const REDEMPTION_STATUS = {
  PENDING: 0,
  AUTO_PASSED: 1,
  MANUAL_REVIEW: 2,
  REJECTED: 3,
  REVOKED: 4,
  VERIFIED: 5
}

const STATUS_MAP = {
  [REDEMPTION_STATUS.PENDING]: '待核销',
  [REDEMPTION_STATUS.AUTO_PASSED]: '自动通过',
  [REDEMPTION_STATUS.MANUAL_REVIEW]: '人工复核中',
  [REDEMPTION_STATUS.REJECTED]: '已驳回',
  [REDEMPTION_STATUS.REVOKED]: '已撤销',
  [REDEMPTION_STATUS.VERIFIED]: '已核销'
}

const VIOLATION_TYPES = {
  none: { label: '无违规', level: 'success' },
  duplicate: { label: '重复核销', level: 'danger' },
  fake: { label: '虚假核销', level: 'danger' },
  cross_scenario: { label: '跨场景违规', level: 'danger' },
  expired: { label: '过期权益', level: 'warning' },
  unqualified: { label: '无参与资格', level: 'warning' },
  over_limit: { label: '超出限额', level: 'warning' }
}

const COMPLIANCE_CHECK_TYPES = [
  { type: 'eligibility', name: '用户参与资格', weight: 25 },
  { type: 'expiry', name: '权益有效期', weight: 20 },
  { type: 'scene', name: '使用场景匹配', weight: 20 },
  { type: 'duplicate', name: '重复核销检测', weight: 15 },
  { type: 'amount', name: '金额合规校验', weight: 10 },
  { type: 'frequency', name: '频次限额校验', weight: 10 }
]

const AUTO_PASS_THRESHOLD = 80

const preCheckRedemption = async (campaignId, redemptionData) => {
  const campaign = await MarketingCampaign.findByPk(campaignId)
  if (!campaign) throw new AppError('活动不存在', 404)

  if (campaign.status === 0 || campaign.status === 1) {
    return {
      canProceed: false,
      reason: campaign.status === 0 ? '活动为草稿状态，禁止核销' : '活动待生效，禁止核销',
      campaignStatus: campaign.status
    }
  }

  if (campaign.status === 4 || campaign.status === 5) {
    return {
      canProceed: false,
      reason: campaign.status === 4 ? '活动已结束，禁止核销' : '活动已下线，禁止核销',
      campaignStatus: campaign.status
    }
  }

  const now = new Date()
  if (campaign.endTime && new Date(campaign.endTime) < now) {
    return { canProceed: false, reason: '活动已过期，禁止核销', campaignStatus: campaign.status }
  }

  if (campaign.budget && campaign.usedBudget >= campaign.budget) {
    return { canProceed: false, reason: '活动预算已耗尽，禁止核销', campaignStatus: campaign.status }
  }

  if (campaign.totalCount > 0 && campaign.useCount >= campaign.totalCount) {
    return { canProceed: false, reason: '活动名额已用尽，禁止核销', campaignStatus: campaign.status }
  }

  return { canProceed: true, campaign, campaignStatus: campaign.status }
}

const runComplianceChecks = async (campaign, redemptionData) => {
  const checks = []
  let totalScore = 0
  let violationType = 'none'

  const eligibilityCheck = checkEligibility(campaign, redemptionData)
  checks.push(eligibilityCheck)
  if (!eligibilityCheck.passed) violationType = violationType === 'none' ? 'unqualified' : violationType

  const expiryCheck = checkExpiry(campaign, redemptionData)
  checks.push(expiryCheck)
  if (!expiryCheck.passed) violationType = violationType === 'none' ? 'expired' : violationType

  const sceneCheck = checkScene(campaign, redemptionData)
  checks.push(sceneCheck)
  if (!sceneCheck.passed) violationType = violationType === 'none' ? 'cross_scenario' : violationType

  const duplicateCheck = await checkDuplicate(campaign, redemptionData)
  checks.push(duplicateCheck)
  if (!duplicateCheck.passed) violationType = violationType === 'none' ? 'duplicate' : violationType

  const amountCheck = checkAmount(campaign, redemptionData)
  checks.push(amountCheck)

  const frequencyCheck = await checkFrequency(campaign, redemptionData)
  checks.push(frequencyCheck)
  if (!frequencyCheck.passed) violationType = violationType === 'none' ? 'over_limit' : violationType

  for (const chk of checks) {
    const cfg = COMPLIANCE_CHECK_TYPES.find(c => c.type === chk.type)
    const weight = cfg ? cfg.weight : 10
    totalScore += chk.passed ? weight : 0
  }

  const fakeCheck = await checkFakeRedemption(campaign, redemptionData)
  if (fakeCheck.suspicious) {
    violationType = 'fake'
    const idx = checks.findIndex(c => c.type === 'duplicate')
    if (idx >= 0) {
      checks[idx] = { ...checks[idx], passed: false, message: fakeCheck.message, detail: fakeCheck.detail }
    } else {
      checks.push({ type: 'duplicate', name: '虚假核销检测', passed: false, message: fakeCheck.message, detail: fakeCheck.detail })
    }
    totalScore = Math.max(0, totalScore - 20)
  }

  return { checks, complianceScore: totalScore, violationType }
}

const checkEligibility = (campaign, data) => {
  if (campaign.targetUser === 2 && data.userLevel !== undefined && data.registerDays !== undefined && data.registerDays > 30) {
    return { type: 'eligibility', name: '用户参与资格', passed: false, message: '当前用户非新用户，不符合活动参与资格', detail: `注册${data.registerDays}天，要求≤30天` }
  }
  if (campaign.targetUser === 4 && data.inactiveDays !== undefined && data.inactiveDays < 30) {
    return { type: 'eligibility', name: '用户参与资格', passed: false, message: '当前用户非流失用户，不符合召回活动资格', detail: `未活跃${data.inactiveDays}天，要求≥30天` }
  }
  if (campaign.targetUser === 5 && data.userLevel !== undefined && data.userLevel < 5) {
    return { type: 'eligibility', name: '用户参与资格', passed: false, message: '当前用户等级不满足高价值用户活动要求', detail: `用户等级${data.userLevel}，要求≥5级` }
  }
  if (campaign.excludeHighRisk && data.isHighRisk) {
    return { type: 'eligibility', name: '用户参与资格', passed: false, message: '用户为高风险用户，已被活动排除', detail: '高风险用户禁止参与' }
  }
  if (campaign.excludeBlocked && data.isBlocked) {
    return { type: 'eligibility', name: '用户参与资格', passed: false, message: '用户为封禁用户，已被活动排除', detail: '封禁用户禁止参与' }
  }
  return { type: 'eligibility', name: '用户参与资格', passed: true, message: '用户参与资格校验通过', detail: '' }
}

const checkExpiry = (campaign, data) => {
  const now = new Date()
  if (data.benefitEndTime && new Date(data.benefitEndTime) < now) {
    return { type: 'expiry', name: '权益有效期', passed: false, message: '权益已过期，禁止核销', detail: `失效时间：${new Date(data.benefitEndTime).toLocaleString()}` }
  }
  if (data.benefitStartTime && new Date(data.benefitStartTime) > now) {
    return { type: 'expiry', name: '权益有效期', passed: false, message: '权益尚未生效', detail: `生效时间：${new Date(data.benefitStartTime).toLocaleString()}` }
  }
  return { type: 'expiry', name: '权益有效期', passed: true, message: '权益有效期校验通过', detail: '' }
}

const checkScene = (campaign, data) => {
  if (campaign.cities && campaign.cities.length > 0 && data.city) {
    if (!campaign.cities.includes(data.city)) {
      return { type: 'scene', name: '使用场景匹配', passed: false, message: '核销城市不在活动适用范围内', detail: `核销城市：${data.city}，适用：${campaign.cities.join('、')}` }
    }
  }
  if (campaign.vehicleTypes && campaign.vehicleTypes.length > 0 && data.vehicleType) {
    if (!campaign.vehicleTypes.includes(data.vehicleType)) {
      return { type: 'scene', name: '使用场景匹配', passed: false, message: '核销车型不在活动适用范围内', detail: `核销车型：${data.vehicleType}，适用：${campaign.vehicleTypes.join('、')}` }
    }
  }
  if (campaign.minOrderAmount > 0 && data.orderAmount !== undefined && data.orderAmount < campaign.minOrderAmount) {
    return { type: 'scene', name: '使用场景匹配', passed: false, message: '订单金额未达到活动门槛', detail: `订单金额：¥${data.orderAmount}，门槛：¥${campaign.minOrderAmount}` }
  }
  return { type: 'scene', name: '使用场景匹配', passed: true, message: '使用场景校验通过', detail: '' }
}

const checkDuplicate = async (campaign, data) => {
  if (!data.userId) {
    return { type: 'duplicate', name: '重复核销检测', passed: true, message: '重复核销检测通过', detail: '' }
  }
  const existing = await MarketingRedemptionRecord.count({
    where: {
      campaignId: campaign.id,
      userId: data.userId,
      orderId: data.orderId || undefined,
      status: { [Op.in]: [REDEMPTION_STATUS.AUTO_PASSED, REDEMPTION_STATUS.VERIFIED] }
    }
  })
  if (existing > 0) {
    return { type: 'duplicate', name: '重复核销检测', passed: false, message: '检测到重复核销：同一用户对同一订单已核销', detail: `已存在${existing}条核销记录` }
  }
  return { type: 'duplicate', name: '重复核销检测', passed: true, message: '重复核销检测通过', detail: '' }
}

const checkAmount = (campaign, data) => {
  const amount = data.redemptionAmount || campaign.subsidyAmount
  if (campaign.maxSubsidyPerOrder && amount > campaign.maxSubsidyPerOrder) {
    return { type: 'amount', name: '金额合规校验', passed: false, message: '核销金额超出单笔最高补贴限制', detail: `核销金额：¥${amount}，上限：¥${campaign.maxSubsidyPerOrder}` }
  }
  return { type: 'amount', name: '金额合规校验', passed: true, message: '金额合规校验通过', detail: '' }
}

const checkFrequency = async (campaign, data) => {
  if (!data.userId) {
    return { type: 'frequency', name: '频次限额校验', passed: true, message: '频次限额校验通过', detail: '' }
  }
  const userTotalCount = await MarketingRedemptionRecord.count({
    where: {
      campaignId: campaign.id,
      userId: data.userId,
      status: { [Op.in]: [REDEMPTION_STATUS.AUTO_PASSED, REDEMPTION_STATUS.VERIFIED] }
    }
  })
  if (campaign.perUserLimit > 0 && userTotalCount >= campaign.perUserLimit) {
    return { type: 'frequency', name: '频次限额校验', passed: false, message: '用户核销次数已达活动上限', detail: `已核销${userTotalCount}次，限额${campaign.perUserLimit}次` }
  }
  if (campaign.perDayLimit > 0 && data.redemptionTime) {
    const dayStart = new Date(data.redemptionTime)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const userDayCount = await MarketingRedemptionRecord.count({
      where: {
        campaignId: campaign.id,
        userId: data.userId,
        status: { [Op.in]: [REDEMPTION_STATUS.AUTO_PASSED, REDEMPTION_STATUS.VERIFIED] },
        redemptionTime: { [Op.gte]: dayStart, [Op.lt]: dayEnd }
      }
    })
    if (userDayCount >= campaign.perDayLimit) {
      return { type: 'frequency', name: '频次限额校验', passed: false, message: '用户今日核销次数已达上限', detail: `今日已核销${userDayCount}次，日限${campaign.perDayLimit}次` }
    }
  }
  return { type: 'frequency', name: '频次限额校验', passed: true, message: '频次限额校验通过', detail: '' }
}

const checkFakeRedemption = async (campaign, data) => {
  let suspicious = false
  let message = ''
  let detail = ''
  if (data.ipAddress && data.deviceId) {
    const sameDeviceCount = await MarketingRedemptionRecord.count({
      where: {
        campaignId: campaign.id,
        deviceId: data.deviceId,
        status: { [Op.in]: [REDEMPTION_STATUS.AUTO_PASSED, REDEMPTION_STATUS.VERIFIED] },
        userId: { [Op.ne]: data.userId }
      }
    })
    if (sameDeviceCount >= 3) {
      suspicious = true
      message = '同一设备存在多个用户核销，疑似虚假核销'
      detail = `设备${data.deviceId.slice(-6)}已关联${sameDeviceCount + 1}个不同用户`
    }
  }
  if (!suspicious && data.redemptionTime) {
    const recentStart = new Date(data.redemptionTime)
    recentStart.setMinutes(recentStart.getMinutes() - 5)
    const recentCount = await MarketingRedemptionRecord.count({
      where: {
        campaignId: campaign.id,
        userId: data.userId,
        status: { [Op.in]: [REDEMPTION_STATUS.AUTO_PASSED, REDEMPTION_STATUS.VERIFIED] },
        redemptionTime: { [Op.gte]: recentStart }
      }
    })
    if (recentCount >= 2) {
      suspicious = true
      message = '短时间内同一用户多次核销，疑似刷核销行为'
      detail = `5分钟内核销${recentCount + 1}次`
    }
  }
  return { suspicious, message, detail }
}

const determineAuditPath = (complianceResult) => {
  const { complianceScore, violationType, checks } = complianceResult
  const blockingChecks = checks.filter(c => !c.passed)
  if (violationType === 'duplicate' || violationType === 'fake') {
    return { auditLevel: 2, status: REDEMPTION_STATUS.MANUAL_REVIEW, reason: '存在高风险违规，需人工复核' }
  }
  if (blockingChecks.some(c => c.type === 'eligibility' || c.type === 'expiry')) {
    return { auditLevel: 2, status: REDEMPTION_STATUS.MANUAL_REVIEW, reason: '参与资格或权益有效期异常，需人工复核' }
  }
  if (complianceScore >= AUTO_PASS_THRESHOLD) {
    return { auditLevel: 1, status: REDEMPTION_STATUS.AUTO_PASSED, reason: '合规评分达标，自动通过' }
  }
  return { auditLevel: 2, status: REDEMPTION_STATUS.MANUAL_REVIEW, reason: `合规评分${complianceScore}分，低于自动通过阈值${AUTO_PASS_THRESHOLD}分` }
}

const submitRedemption = async (campaignId, redemptionData, operator) => {
  const preCheck = await preCheckRedemption(campaignId, redemptionData)
  if (!preCheck.canProceed) {
    return { success: false, reason: preCheck.reason, campaignStatus: preCheck.campaignStatus }
  }
  const campaign = preCheck.campaign
  const complianceResult = await runComplianceChecks(campaign, redemptionData)
  const auditPath = determineAuditPath(complianceResult)
  const record = await MarketingRedemptionRecord.create({
    campaignId,
    campaignName: campaign.name,
    userId: redemptionData.userId,
    userPhone: redemptionData.userPhone || null,
    userLevel: redemptionData.userLevel || 0,
    orderId: redemptionData.orderId || null,
    orderNo: redemptionData.orderNo || null,
    couponId: redemptionData.couponId || campaign.couponId,
    redemptionCode: redemptionData.redemptionCode || null,
    status: auditPath.status,
    auditLevel: auditPath.auditLevel,
    violationType: complianceResult.violationType,
    complianceChecks: complianceResult.checks,
    complianceScore: complianceResult.complianceScore,
    scene: redemptionData.scene || campaign.scene,
    vehicleType: redemptionData.vehicleType || null,
    city: redemptionData.city || null,
    redemptionAmount: redemptionData.redemptionAmount || campaign.subsidyAmount,
    orderAmount: redemptionData.orderAmount || 0,
    benefitStartTime: redemptionData.benefitStartTime || campaign.startTime,
    benefitEndTime: redemptionData.benefitEndTime || campaign.endTime,
    participateId: redemptionData.participateId || null,
    participateTime: redemptionData.participateTime || null,
    receiveTime: redemptionData.receiveTime || null,
    redemptionTime: redemptionData.redemptionTime || new Date(),
    ipAddress: redemptionData.ipAddress || null,
    deviceId: redemptionData.deviceId || null
  })

  if (auditPath.status === REDEMPTION_STATUS.AUTO_PASSED) {
    await syncCampaignQuota(campaign, redemptionData.redemptionAmount || campaign.subsidyAmount)
  }

  return {
    success: true,
    record: record.get({ plain: true }),
    auditLevel: auditPath.auditLevel,
    auditPath: auditPath.reason,
    complianceScore: complianceResult.complianceScore,
    violationType: complianceResult.violationType,
    autoPassed: auditPath.status === REDEMPTION_STATUS.AUTO_PASSED
  }
}

const syncCampaignQuota = async (campaign, amount) => {
  const updateData = {
    useCount: campaign.useCount + 1,
    usedBudget: parseFloat(campaign.usedBudget) + parseFloat(amount || 0)
  }
  await MarketingCampaign.update(updateData, { where: { id: campaign.id } })
}

const manualReview = async (recordId, action, operator, remark) => {
  const record = await MarketingRedemptionRecord.findByPk(recordId)
  if (!record) throw new AppError('核销记录不存在', 404)
  if (record.status !== REDEMPTION_STATUS.MANUAL_REVIEW && record.status !== REDEMPTION_STATUS.PENDING) {
    throw new AppError('当前状态不允许人工复核操作')
  }

  let newStatus
  if (action === 'approve') {
    newStatus = REDEMPTION_STATUS.VERIFIED
  } else if (action === 'reject') {
    newStatus = REDEMPTION_STATUS.REJECTED
  } else {
    throw new AppError('无效的复核操作')
  }

  await record.update({
    status: newStatus,
    auditorId: operator.id,
    auditorName: operator.name,
    auditAt: new Date(),
    auditRemark: remark || null,
    rejectReason: action === 'reject' ? (remark || '人工驳回') : null
  })

  if (action === 'approve') {
    const campaign = await MarketingCampaign.findByPk(record.campaignId)
    if (campaign) {
      await syncCampaignQuota(campaign, record.redemptionAmount)
    }
  }

  return { record: record.get({ plain: true }), action, newStatus }
}

const batchManualReview = async (recordIds, action, operator, remark) => {
  const results = { approved: [], rejected: [], failed: [] }
  for (const id of recordIds) {
    try {
      const res = await manualReview(id, action, operator, remark)
      if (action === 'approve') results.approved.push(id)
      else results.rejected.push(id)
    } catch (e) {
      results.failed.push({ id, reason: e.message })
    }
  }
  return results
}

const getRedemptionList = async (campaignId, params = {}) => {
  const { page = 1, pageSize = 20, status, violationType, auditLevel, startDate, endDate } = params
  const where = { campaignId }
  if (status !== undefined && status !== '') where.status = status
  if (violationType) where.violationType = violationType
  if (auditLevel) where.auditLevel = auditLevel
  if (startDate || endDate) {
    where.redemptionTime = {}
    if (startDate) where.redemptionTime[Op.gte] = new Date(startDate)
    if (endDate) where.redemptionTime[Op.lt] = new Date(endDate)
  }
  const { count, rows } = await MarketingRedemptionRecord.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize
  })
  return {
    list: rows.map(r => r.get({ plain: true })),
    total: count,
    page,
    pageSize
  }
}

const getRedemptionStats = async (campaignId) => {
  const total = await MarketingRedemptionRecord.count({ where: { campaignId } })
  const byStatus = {}
  for (const [key, val] of Object.entries(STATUS_MAP)) {
    byStatus[key] = await MarketingRedemptionRecord.count({ where: { campaignId, status: parseInt(key) } })
  }
  const byViolation = {}
  for (const vKey of Object.keys(VIOLATION_TYPES)) {
    byViolation[vKey] = await MarketingRedemptionRecord.count({ where: { campaignId, violationType: vKey } })
  }
  const autoPassCount = await MarketingRedemptionRecord.count({ where: { campaignId, auditLevel: 1, status: { [Op.in]: [REDEMPTION_STATUS.AUTO_PASSED, REDEMPTION_STATUS.VERIFIED] } } })
  const manualReviewCount = await MarketingRedemptionRecord.count({ where: { campaignId, auditLevel: 2 } })
  const avgComplianceScore = total > 0 ? (await MarketingRedemptionRecord.sum('complianceScore', { where: { campaignId } })) / total : 0
  return {
    total,
    byStatus,
    byViolation,
    autoPassCount,
    manualReviewCount,
    avgComplianceScore: Math.round(avgComplianceScore * 100) / 100,
    violationRate: total > 0 ? Math.round(((byViolation.duplicate || 0) + (byViolation.fake || 0) + (byViolation.cross_scenario || 0)) / total * 10000) / 100 : 0
  }
}

const revokeRedemption = async (recordId, operator, reason) => {
  const record = await MarketingRedemptionRecord.findByPk(recordId)
  if (!record) throw new AppError('核销记录不存在', 404)
  if (!record.isRevocable) throw new AppError('当前记录不可撤销')
  if (record.status !== REDEMPTION_STATUS.AUTO_PASSED && record.status !== REDEMPTION_STATUS.VERIFIED) {
    throw new AppError('仅已核销或自动通过的记录可撤销')
  }
  await record.update({
    status: REDEMPTION_STATUS.REVOKED,
    revokedAt: new Date(),
    revokerId: operator.id,
    revokerName: operator.name,
    revokeReason: reason || '人工撤销'
  })
  const campaign = await MarketingCampaign.findByPk(record.campaignId)
  if (campaign) {
    await MarketingCampaign.update({
      useCount: Math.max(0, campaign.useCount - 1),
      usedBudget: Math.max(0, parseFloat(campaign.usedBudget) - parseFloat(record.redemptionAmount))
    }, { where: { id: campaign.id } })
  }
  return { record: record.get({ plain: true }) }
}

module.exports = {
  REDEMPTION_STATUS,
  STATUS_MAP,
  VIOLATION_TYPES,
  COMPLIANCE_CHECK_TYPES,
  AUTO_PASS_THRESHOLD,
  preCheckRedemption,
  runComplianceChecks,
  determineAuditPath,
  submitRedemption,
  manualReview,
  batchManualReview,
  getRedemptionList,
  getRedemptionStats,
  revokeRedemption,
  syncCampaignQuota
}
