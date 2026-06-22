const { Op } = require('sequelize')
const { MarketingCampaign, MarketingRedemptionRecord } = require('../models')
const { AppError } = require('../utils/response')
const { REDEMPTION_STATUS, VIOLATION_TYPES } = require('./marketingRedemptionService')

const getTraceDetail = async (recordId) => {
  const record = await MarketingRedemptionRecord.findByPk(recordId)
  if (!record) throw new AppError('核销记录不存在', 404)

  const data = record.get({ plain: true })
  const campaign = await MarketingCampaign.findByPk(data.campaignId)

  const timeline = []

  if (data.participateTime) {
    timeline.push({ time: data.participateTime, action: '用户参与', detail: `用户(ID:${data.userId})参与活动「${data.campaignName}」`, icon: 'UserFilled', color: '#67c23a' })
  }
  if (data.receiveTime) {
    timeline.push({ time: data.receiveTime, action: '领取权益', detail: `领取核销码 ${data.redemptionCode || '-'}`, icon: 'Present', color: '#8e44ad' })
  }
  if (data.redemptionTime) {
    timeline.push({ time: data.redemptionTime, action: '发起核销', detail: `核销金额 ¥${data.redemptionAmount}，场景：${data.city || '-'} / ${data.vehicleType || '-'}`, icon: 'Tickets', color: '#e6a23c' })
  }

  if (data.complianceChecks && data.complianceChecks.length > 0) {
    const failedChecks = data.complianceChecks.filter(c => !c.passed)
    const passedChecks = data.complianceChecks.filter(c => c.passed)
    timeline.push({
      time: data.redemptionTime,
      action: '合规校验',
      detail: `合规评分 ${data.complianceScore}/100，${passedChecks.length}项通过，${failedChecks.length}项未通过`,
      icon: 'DocumentChecked',
      color: data.complianceScore >= 80 ? '#67c23a' : '#f56c6c',
      checks: data.complianceChecks
    })
  }

  if (data.auditLevel === 1 && data.status === REDEMPTION_STATUS.AUTO_PASSED) {
    timeline.push({ time: data.redemptionTime, action: '系统自动通过', detail: '合规评分达标，自动通过核销', icon: 'CircleCheck', color: '#67c23a' })
  } else if (data.auditLevel === 2) {
    if (data.auditorName && data.auditAt) {
      timeline.push({
        time: data.auditAt,
        action: data.status === REDEMPTION_STATUS.VERIFIED ? '人工审核通过' : '人工审核驳回',
        detail: `审核人：${data.auditorName}${data.auditRemark ? '，备注：' + data.auditRemark : ''}`,
        icon: data.status === REDEMPTION_STATUS.VERIFIED ? 'CircleCheck' : 'CircleClose',
        color: data.status === REDEMPTION_STATUS.VERIFIED ? '#67c23a' : '#f56c6c'
      })
    } else {
      timeline.push({ time: data.redemptionTime, action: '等待人工复核', detail: '系统判定需人工介入审核', icon: 'Clock', color: '#e6a23c' })
    }
  }

  if (data.status === REDEMPTION_STATUS.REVOKED) {
    timeline.push({
      time: data.revokedAt,
      action: '核销撤销',
      detail: `撤销人：${data.revokerName}，原因：${data.revokeReason || '-'}`,
      icon: 'RefreshLeft',
      color: '#909399'
    })
  }

  const violationLabel = VIOLATION_TYPES[data.violationType] ? VIOLATION_TYPES[data.violationType].label : data.violationType

  return {
    record: data,
    campaign: campaign ? campaign.get({ plain: true }) : null,
    timeline,
    violationLabel,
    complianceChecks: data.complianceChecks || [],
    complianceScore: data.complianceScore,
    isViolated: data.violationType !== 'none'
  }
}

const getViolationRecords = async (params = {}) => {
  const { campaignId, violationType, page = 1, pageSize = 20, startDate, endDate } = params
  const where = { violationType: { [Op.ne]: 'none' } }
  if (campaignId) where.campaignId = campaignId
  if (violationType) where.violationType = violationType
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
  const stats = {
    totalViolations: count,
    byType: {}
  }
  for (const vKey of Object.keys(VIOLATION_TYPES)) {
    if (vKey === 'none') continue
    stats.byType[vKey] = await MarketingRedemptionRecord.count({
      where: { ...where, violationType: vKey, violationType: { [Op.ne]: 'none' } }
    })
  }
  const violationWhere = { violationType: { [Op.ne]: 'none' } }
  if (campaignId) violationWhere.campaignId = campaignId
  const allViolations = await MarketingRedemptionRecord.findAll({
    where: violationWhere,
    attributes: ['violationType']
  })
  stats.byType = {}
  for (const rec of allViolations) {
    stats.byType[rec.violationType] = (stats.byType[rec.violationType] || 0) + 1
  }
  const blockedAmount = await MarketingRedemptionRecord.sum('redemptionAmount', {
    where: { ...violationWhere, status: REDEMPTION_STATUS.REJECTED }
  })
  stats.estimatedSavings = blockedAmount || 0
  return {
    list: rows.map(r => {
      const d = r.get({ plain: true })
      return {
        id: d.id,
        campaignId: d.campaignId,
        campaignName: d.campaignName,
        userId: d.userId,
        userPhone: d.userPhone ? d.userPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '-',
        rawPhone: d.userPhone,
        violationType: d.violationType,
        violationLabel: VIOLATION_TYPES[d.violationType] ? VIOLATION_TYPES[d.violationType].label : d.violationType,
        redemptionAmount: d.redemptionAmount,
        status: d.status,
        complianceScore: d.complianceScore,
        redemptionTime: d.redemptionTime
      }
    }),
    total: count,
    page,
    pageSize,
    stats
  }
}

const batchRejectViolations = async (recordIds, operator, reason) => {
  const results = { rejected: [], failed: [] }
  for (const id of recordIds) {
    try {
      const record = await MarketingRedemptionRecord.findByPk(id)
      if (!record) { results.failed.push({ id, reason: '记录不存在' }); continue }
      if (record.violationType === 'none') { results.failed.push({ id, reason: '非违规记录' }); continue }
      await record.update({
        status: REDEMPTION_STATUS.REJECTED,
        auditorId: operator.id,
        auditorName: operator.name,
        auditAt: new Date(),
        rejectReason: reason || '批量驳回违规核销'
      })
      results.rejected.push(id)
    } catch (e) {
      results.failed.push({ id, reason: e.message })
    }
  }
  return results
}

const batchReviewPending = async (campaignId, action, operator, params = {}) => {
  const { scene, startDate, endDate } = params
  const where = { campaignId, status: REDEMPTION_STATUS.MANUAL_REVIEW }
  if (scene) where.scene = scene
  if (startDate || endDate) {
    where.redemptionTime = {}
    if (startDate) where.redemptionTime[Op.gte] = new Date(startDate)
    if (endDate) where.redemptionTime[Op.lt] = new Date(endDate)
  }
  const records = await MarketingRedemptionRecord.findAll({ where })
  const results = { approved: [], rejected: [], failed: [] }
  for (const record of records) {
    try {
      if (action === 'approve') {
        await record.update({
          status: REDEMPTION_STATUS.VERIFIED,
          auditorId: operator.id,
          auditorName: operator.name,
          auditAt: new Date(),
          auditRemark: '批量复核通过'
        })
        const campaign = await MarketingCampaign.findByPk(record.campaignId)
        if (campaign) {
          await MarketingCampaign.update({
            useCount: campaign.useCount + 1,
            usedBudget: parseFloat(campaign.usedBudget) + parseFloat(record.redemptionAmount)
          }, { where: { id: campaign.id } })
        }
        results.approved.push(record.id)
      } else {
        await record.update({
          status: REDEMPTION_STATUS.REJECTED,
          auditorId: operator.id,
          auditorName: operator.name,
          auditAt: new Date(),
          rejectReason: '批量驳回'
        })
        results.rejected.push(record.id)
      }
    } catch (e) {
      results.failed.push({ id: record.id, reason: e.message })
    }
  }
  return results
}

const getComplianceOverview = async (campaignId) => {
  const total = await MarketingRedemptionRecord.count({ where: { campaignId } })
  if (total === 0) {
    return {
      total: 0,
      complianceScore: 0,
      checks: [
        { type: 'eligibility', name: '用户参与资格', passRate: 0, passCount: 0, failCount: 0 },
        { type: 'expiry', name: '权益有效期', passRate: 0, passCount: 0, failCount: 0 },
        { type: 'scene', name: '使用场景匹配', passRate: 0, passCount: 0, failCount: 0 },
        { type: 'duplicate', name: '重复核销检测', passRate: 0, passCount: 0, failCount: 0 },
        { type: 'amount', name: '金额合规校验', passRate: 0, passCount: 0, failCount: 0 },
        { type: 'frequency', name: '频次限额校验', passRate: 0, passCount: 0, failCount: 0 }
      ]
    }
  }
  const records = await MarketingRedemptionRecord.findAll({
    where: { campaignId },
    attributes: ['complianceChecks', 'complianceScore']
  })
  const checkStats = {}
  for (const rec of records) {
    const checks = rec.complianceChecks || []
    for (const chk of checks) {
      if (!checkStats[chk.type]) checkStats[chk.type] = { name: chk.name, passCount: 0, failCount: 0 }
      if (chk.passed) checkStats[chk.type].passCount++
      else checkStats[chk.type].failCount++
    }
  }
  const checks = Object.entries(checkStats).map(([type, data]) => ({
    type,
    name: data.name,
    passCount: data.passCount,
    failCount: data.failCount,
    passRate: Math.round(data.passCount / (data.passCount + data.failCount) * 10000) / 100
  }))
  const avgScore = records.reduce((sum, r) => sum + (r.complianceScore || 0), 0) / records.length
  return {
    total,
    complianceScore: Math.round(avgScore * 100) / 100,
    checks
  }
}

module.exports = {
  getTraceDetail,
  getViolationRecords,
  batchRejectViolations,
  batchReviewPending,
  getComplianceOverview
}
