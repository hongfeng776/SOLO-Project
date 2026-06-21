const { Op } = require('sequelize')
const { MarketingAudienceLog } = require('../models')

const AUDIENCE_ACTION_MAP = {
  preview: { label: '人群覆盖预览', icon: 'View', color: '#909399', riskLevel: 0 },
  rule_update: { label: '更新人群规则', icon: 'Edit', color: '#409eff', riskLevel: 0 },
  purpose_update: { label: '切换人群策略', icon: 'Switch', color: '#6f7ad7', riskLevel: 1 },
  import: { label: '批量导入定向用户', icon: 'Upload', color: '#67c23a', riskLevel: 1 },
  exclude: { label: '批量剔除无效用户', icon: 'Delete', color: '#f56c6c', riskLevel: 1 },
  tag_update: { label: '批量更新用户标签', icon: 'PriceTag', color: '#e6a23c', riskLevel: 1 },
  weight_update: { label: '更新参与权重', icon: 'Histogram', color: '#8e44ad', riskLevel: 0 },
  check: { label: '人群定向校验', icon: 'CircleCheck', color: '#909399', riskLevel: 0 },
  participate: { label: '用户参与活动', icon: 'User', color: '#67c23a', riskLevel: 0 },
  verify: { label: '用户核销权益', icon: 'Finished', color: '#409eff', riskLevel: 0 },
  fraud: { label: '恶意刷活动拦截', icon: 'Warning', color: '#f56c6c', riskLevel: 3 },
  invalid_participation: { label: '非定向用户拦截', icon: 'CircleClose', color: '#e6a23c', riskLevel: 2 }
}

const logAudienceAction = async (params) => {
  try {
    const actionCfg = AUDIENCE_ACTION_MAP[params.action] || {}
    return await MarketingAudienceLog.create({
      campaignId: params.campaignId,
      action: params.action,
      actionLabel: actionCfg.label || params.action,
      audiencePurpose: params.audiencePurpose || 0,
      operatorId: params.operatorId || 1,
      operatorName: params.operatorName || '系统',
      operatorRole: params.operatorRole,
      ipAddress: params.ipAddress || '127.0.0.1',
      beforeRule: params.beforeRule ? JSON.stringify(params.beforeRule) : null,
      afterRule: params.afterRule ? JSON.stringify(params.afterRule) : null,
      diffFields: params.diffFields ? JSON.stringify(params.diffFields) : null,
      affectedCount: params.affectedCount || 0,
      validCount: params.validCount || 0,
      excludedRiskCount: params.excludedRiskCount || 0,
      excludedBlockedCount: params.excludedBlockedCount || 0,
      excludedInvalidCount: params.excludedInvalidCount || 0,
      coveragePreview: params.coveragePreview ? JSON.stringify(params.coveragePreview) : null,
      weightConfig: params.weightConfig ? JSON.stringify(params.weightConfig) : null,
      riskLevel: params.riskLevel !== undefined ? params.riskLevel : (actionCfg.riskLevel || 0),
      validateResult: params.validateResult ? JSON.stringify(params.validateResult) : null,
      interceptionReason: params.interceptionReason,
      userId: params.userId,
      userPhone: params.userPhone,
      userLevel: params.userLevel,
      tags: params.tags ? JSON.stringify(params.tags) : null,
      remark: params.remark
    })
  } catch (err) {
    console.error('[MarketingAudienceLog] write error:', err.message)
    return null
  }
}

const getAudienceLogs = async (campaignId, query = {}) => {
  const { page = 1, pageSize = 20, action, riskLevel, startDate, endDate } = query

  const where = { campaignId }
  if (action) where.action = action
  if (riskLevel !== undefined && riskLevel !== '') where.riskLevel = riskLevel

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt[Op.gte] = new Date(startDate)
    if (endDate) where.createdAt[Op.lte] = new Date(endDate + ' 23:59:59')
  }

  const { count, rows } = await MarketingAudienceLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize)
  })

  const actionStats = await MarketingAudienceLog.findAll({
    where: { campaignId },
    attributes: [
      'action',
      'riskLevel',
      [MarketingAudienceLog.sequelize.fn('COUNT', MarketingAudienceLog.sequelize.col('id')), 'cnt']
    ],
    group: ['action', 'riskLevel'],
    raw: true
  })

  const stats = {
    totalAudienceOps: count,
    previewCount: 0,
    ruleChangeCount: 0,
    interceptCount: 0,
    fraudCount: 0,
    invalidExcluded: 0
  }
  actionStats.forEach(s => {
    if (s.action === 'preview') stats.previewCount += Number(s.cnt)
    if (['rule_update', 'purpose_update', 'import', 'exclude', 'tag_update', 'weight_update'].includes(s.action)) {
      stats.ruleChangeCount += Number(s.cnt)
    }
    if (s.riskLevel >= 2) stats.interceptCount += Number(s.cnt)
    if (s.action === 'fraud') stats.fraudCount += Number(s.cnt)
    if (s.action === 'exclude') stats.invalidExcluded += Number(s.cnt)
  })

  const logs = rows.map(log => {
    const actionCfg = AUDIENCE_ACTION_MAP[log.action] || {}
    return {
      ...log.toJSON(),
      actionLabel: actionCfg.label || log.action,
      actionColor: actionCfg.color || '#909399'
    }
  })

  return {
    list: logs,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    stats
  }
}

const getAudienceInterceptStats = async (query = {}) => {
  const { startDate, endDate, campaignId } = query
  const where = {}
  if (campaignId) where.campaignId = campaignId

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt[Op.gte] = new Date(startDate)
    if (endDate) where.createdAt[Op.lte] = new Date(endDate + ' 23:59:59')
  }

  const allLogs = await MarketingAudienceLog.findAll({
    where,
    attributes: [
      'action', 'riskLevel',
      [MarketingAudienceLog.sequelize.fn('COUNT', MarketingAudienceLog.sequelize.col('id')), 'cnt'],
      [MarketingAudienceLog.sequelize.fn('SUM',
        MarketingAudienceLog.sequelize.col('excludedInvalidCount')), 'invalidTotal'],
      [MarketingAudienceLog.sequelize.fn('SUM',
        MarketingAudienceLog.sequelize.col('excludedRiskCount')), 'riskTotal']
    ],
    group: ['action', 'riskLevel'],
    raw: true
  })

  const totalIntercept = allLogs
    .filter(l => l.riskLevel >= 2)
    .reduce((s, l) => s + Number(l.cnt), 0)

  const fraudCount = allLogs
    .filter(l => l.action === 'fraud')
    .reduce((s, l) => s + Number(l.cnt), 0)

  const invalidParticipation = allLogs
    .filter(l => l.action === 'invalid_participation')
    .reduce((s, l) => s + Number(l.cnt), 0)

  const totalInvalid = allLogs.reduce((s, l) => s + (Number(l.invalidTotal) || 0), 0)
  const totalRisk = allLogs.reduce((s, l) => s + (Number(l.riskTotal) || 0), 0)

  const byAction = Object.keys(AUDIENCE_ACTION_MAP).map(action => {
    const cfg = AUDIENCE_ACTION_MAP[action]
    const items = allLogs.filter(l => l.action === action)
    return {
      action,
      label: cfg.label,
      color: cfg.color,
      count: items.reduce((s, i) => s + Number(i.cnt), 0),
      blocked: items.filter(i => i.riskLevel >= 3).reduce((s, i) => s + Number(i.cnt), 0)
    }
  }).filter(i => i.count > 0 || ['fraud', 'invalid_participation', 'exclude'].includes(i.action))

  return {
    totalIntercept,
    fraudCount,
    invalidParticipation,
    totalInvalidExcluded: totalInvalid,
    totalRiskExcluded: totalRisk,
    byAction
  }
}

const calculateAudienceDiff = (before, after) => {
  const diffFields = []
  const trackFields = [
    'targetUser', 'audiencePurpose', 'userTags', 'excludeUserTags',
    'activityLevels', 'consumptionLevels', 'userLevels',
    'userLevelsMin', 'userLevelsMax', 'cities', 'provinces',
    'registerDaysMin', 'registerDaysMax', 'inactiveDays',
    'excludeHighRisk', 'excludeBlocked', 'excludeInactive',
    'registerChannels', 'audienceCityTiers', 'targetedUserIds',
    'excludedUserIds', 'userWeights', 'audienceRules'
  ]

  trackFields.forEach(field => {
    const b = before?.[field]
    const a = after?.[field]
    const bStr = JSON.stringify(b)
    const aStr = JSON.stringify(a)

    if (bStr !== aStr) {
      diffFields.push({
        field,
        before: b,
        after: a,
        type: b === undefined || b === null ? 'added' : (a === undefined || a === null ? 'removed' : 'modified')
      })
    }
  })

  return diffFields
}

module.exports = {
  AUDIENCE_ACTION_MAP,
  logAudienceAction,
  getAudienceLogs,
  getAudienceInterceptStats,
  calculateAudienceDiff
}
