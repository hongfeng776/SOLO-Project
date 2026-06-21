const { Op } = require('sequelize')
const { Passenger } = require('../models')

const USER_TAG_OPTIONS = [
  { value: 'new_register', label: '新注册用户', color: '#67c23a' },
  { value: 'high_consumption', label: '高消费用户', color: '#f56c6c' },
  { value: 'core_user', label: '核心用户', color: '#409eff' },
  { value: 'dormant_user', label: '沉睡用户', color: '#909399' },
  { value: 'frequent_traveler', label: '高频出行', color: '#e6a23c' },
  { value: 'weekend_user', label: '周末活跃', color: '#6f7ad7' },
  { value: 'peak_commuter', label: '早晚高峰通勤', color: '#8e44ad' },
  { value: 'long_distance', label: '长途偏好', color: '#16a085' },
  { value: 'business_user', label: '商务出行', color: '#2c3e50' },
  { value: 'family_travel', label: '家庭出行', color: '#e91e63' }
]

const EXCLUDE_TAG_OPTIONS = [
  { value: 'fraud', label: '欺诈用户', color: '#f56c6c' },
  { value: 'high_risk', label: '高风险账号', color: '#c0392b' },
  { value: 'low_value', label: '低价值用户', color: '#95a5a6' },
  { value: 'frequent_cancel', label: '高频取消', color: '#e67e22' },
  { value: 'malicious_complaint', label: '恶意投诉', color: '#e74c3c' },
  { value: 'coupon_hunter', label: '羊毛党', color: '#d35400' },
  { value: 'inactive_90d', label: '90天未登录', color: '#7f8c8d' }
]

const ACTIVITY_LEVEL_OPTIONS = [
  { value: 1, label: '沉睡用户（近90天无订单）' },
  { value: 2, label: '低活（月订单<3）' },
  { value: 3, label: '中活（月订单3-10）' },
  { value: 4, label: '高活（月订单11-30）' },
  { value: 5, label: '核心（月订单>30）' }
]

const CONSUMPTION_LEVEL_OPTIONS = [
  { value: 1, label: '低消费（月均<50）' },
  { value: 2, label: '中消费（50-200）' },
  { value: 3, label: '高消费（200-500）' },
  { value: 4, label: '超高消费（>500）' }
]

const USER_LEVEL_OPTIONS = [
  { value: 1, label: '普通用户' },
  { value: 2, label: '银卡' },
  { value: 3, label: '金卡' },
  { value: 4, label: '铂金' },
  { value: 5, label: '钻石' }
]

const AUDIENCE_PURPOSE_CONFIG = {
  1: {
    name: '拉新活动',
    desc: '定向新注册用户，快速增长用户规模',
    defaultTargetUser: 2,
    defaultUserTags: ['new_register'],
    defaultActivityLevels: null,
    defaultConsumptionLevels: null,
    defaultUserLevels: null,
    defaultRegisterDaysMax: 30,
    defaultExcludeHighRisk: 1,
    defaultExcludeBlocked: 1,
    defaultExcludeInactive: 0
  },
  2: {
    name: '促活活动',
    desc: '定向沉睡/低活跃用户，唤醒回归活跃',
    defaultTargetUser: 4,
    defaultUserTags: ['dormant_user'],
    defaultActivityLevels: [1, 2],
    defaultConsumptionLevels: null,
    defaultUserLevels: null,
    defaultInactiveDays: 30,
    defaultExcludeHighRisk: 1,
    defaultExcludeBlocked: 1,
    defaultExcludeInactive: 0
  },
  3: {
    name: '维稳活动',
    desc: '定向高频高价值用户，稳定核心留存',
    defaultTargetUser: 5,
    defaultUserTags: ['high_consumption', 'frequent_traveler'],
    defaultActivityLevels: [4, 5],
    defaultConsumptionLevels: [3, 4],
    defaultUserLevels: [3, 4, 5],
    defaultExcludeHighRisk: 1,
    defaultExcludeBlocked: 1,
    defaultExcludeInactive: 0
  },
  0: {
    name: '自定义人群',
    desc: '自由配置人群筛选条件',
    defaultTargetUser: 1,
    defaultUserTags: null,
    defaultActivityLevels: null,
    defaultConsumptionLevels: null,
    defaultUserLevels: null,
    defaultExcludeHighRisk: 1,
    defaultExcludeBlocked: 1,
    defaultExcludeInactive: 0
  }
}

const buildAudienceQuery = (campaign) => {
  const where = { status: 1 }

  if (campaign.targetUser && campaign.targetUser !== 1) {
    if (campaign.targetUser === 2) {
      where.registerDaysMax = campaign.registerDaysMax || 30
    } else if (campaign.targetUser === 4) {
      where.inactiveDays = campaign.inactiveDays || 30
    } else if (campaign.targetUser === 5) {
      where.userLevelMin = campaign.userLevelMin || 3
    }
  }

  if (campaign.userLevels && campaign.userLevels.length > 0) {
    where.level = { [Op.in]: campaign.userLevels }
  }
  if (campaign.userLevelsMin && campaign.userLevelsMin > 0) {
    where.level = { ...where.level, [Op.gte]: campaign.userLevelsMin }
  }
  if (campaign.userLevelsMax && campaign.userLevelsMax > 0) {
    where.level = { ...where.level, [Op.lte]: campaign.userLevelsMax }
  }

  if (campaign.activityLevels && campaign.activityLevels.length > 0) {
    where.activityLevel = { [Op.in]: campaign.activityLevels }
  }

  if (campaign.consumptionLevels && campaign.consumptionLevels.length > 0) {
    where.consumptionLevel = { [Op.in]: campaign.consumptionLevels }
  }

  if (campaign.excludeHighRisk) {
    where.isRisk = false
    where.travelRiskLevel = { [Op.lte]: 2 }
  }
  if (campaign.excludeBlocked) {
    where.travelRiskLevel = { ...(where.travelRiskLevel || {}), [Op.ne]: 5 }
    where.status = { [Op.ne]: 0 }
  }
  if (campaign.excludeInactive) {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    where.lastLoginTime = { [Op.gte]: d }
  }

  if (campaign.cities && campaign.cities.length > 0) {
    where[Op.or] = [
      { city: { [Op.in]: campaign.cities } },
      { travelCity: { [Op.in]: campaign.cities } }
    ]
  }

  if (campaign.provinces && campaign.provinces.length > 0) {
    where.province = { [Op.in]: campaign.provinces }
  }

  if (campaign.registerDaysMax && campaign.registerDaysMax > 0) {
    const d = new Date()
    d.setDate(d.getDate() - campaign.registerDaysMax)
    where.registerTime = { [Op.gte]: d }
  }

  if (campaign.registerDaysMin && campaign.registerDaysMin > 0) {
    const d = new Date()
    d.setDate(d.getDate() - campaign.registerDaysMin)
    where.registerTime = { ...where.registerTime, [Op.lte]: d }
  }

  if (campaign.registerChannels && campaign.registerChannels.length > 0) {
    where.registerChannel = { [Op.in]: campaign.registerChannels }
  }

  if (campaign.targetedUserIds && campaign.targetedUserIds.length > 0) {
    where.id = { [Op.in]: campaign.targetedUserIds }
  }

  return where
}

const validateAudienceConfig = async (campaign, errors = [], warnings = []) => {
  const passed = []

  if (campaign.targetUser === 2 && campaign.registerDaysMax <= 0) {
    errors.push({
      field: 'registerDaysMax',
      message: '拉新活动必须设置最大注册天数',
      blocking: true,
      code: 'AUD_001'
    })
  } else {
    passed.push({ field: '拉新注册天数', message: '拉新注册天数设置合法' })
  }

  if (campaign.targetUser === 4 && (campaign.inactiveDays || 0) < 7) {
    warnings.push({
      field: 'inactiveDays',
      message: '促活活动建议流失门槛≥7天',
      blocking: false,
      code: 'AUD_W01'
    })
  } else if (campaign.targetUser === 4) {
    passed.push({ field: '促活流失门槛', message: '流失用户门槛设置合理' })
  }

  if (campaign.targetUser === 5) {
    if (!campaign.userLevels || campaign.userLevels.length === 0) {
      if ((campaign.userLevelsMin || 0) < 3) {
        warnings.push({
          field: 'userLevelsMin',
          message: '维稳活动建议定向≥金卡等级用户',
          blocking: false,
          code: 'AUD_W02'
        })
      }
    }
  }

  if (campaign.userTags && campaign.userTags.includes('dormant_user') &&
      campaign.userTags && campaign.userTags.includes('new_register')) {
    errors.push({
      field: 'userTags',
      message: '"沉睡用户"与"新注册用户"标签互斥，不能同时选中',
      blocking: true,
      code: 'AUD_002'
    })
  }

  if (campaign.activityLevels) {
    const hasDormant = campaign.activityLevels.includes(1) || campaign.activityLevels.includes(2)
    const hasCore = campaign.activityLevels.includes(4) || campaign.activityLevels.includes(5)
    if (hasDormant && hasCore) {
      warnings.push({
        field: 'activityLevels',
        message: '同时定向沉睡与核心用户，建议拆分为不同活动',
        blocking: false,
        code: 'AUD_W03'
      })
    }
  }

  if ((campaign.targetedUserIds || []).length > 0 && (campaign.excludedUserIds || []).length > 0) {
    const overlap = (campaign.targetedUserIds || []).filter(id =>
      (campaign.excludedUserIds || []).includes(id)
    )
    if (overlap.length > 0) {
      errors.push({
        field: 'targetedUserIds',
        message: `有${overlap.length}个用户同时存在于定向和排除列表中`,
        blocking: true,
        code: 'AUD_003'
      })
    }
  }

  if (!campaign.excludeHighRisk) {
    warnings.push({
      field: 'excludeHighRisk',
      message: '建议开启排除高风险用户，降低营销风险',
      blocking: false,
      code: 'AUD_W04'
    })
  } else {
    passed.push({ field: '风险用户排除', message: '已自动排除高风险账号' })
  }

  if (!campaign.excludeBlocked) {
    warnings.push({
      field: 'excludeBlocked',
      message: '建议开启排除封禁用户，防止资源浪费',
      blocking: false,
      code: 'AUD_W05'
    })
  } else {
    passed.push({ field: '封禁用户排除', message: '已自动排除封禁用户' })
  }

  if ((campaign.userTags || []).length === 0 &&
      (campaign.activityLevels || []).length === 0 &&
      (campaign.consumptionLevels || []).length === 0 &&
      (campaign.userLevels || []).length === 0 &&
      (campaign.cities || []).length === 0 &&
      !campaign.targetedUserIds?.length &&
      campaign.targetUser === 1) {
    warnings.push({
      field: 'audience',
      message: '当前为全量用户，建议增加人群筛选条件提升投放精准度',
      blocking: false,
      code: 'AUD_W06'
    })
  }

  return { errors, warnings, passed }
}

const getAudiencePreview = async (campaign) => {
  const where = buildAudienceQuery(campaign)

  const totalCount = await Passenger.count({ where })

  const byLevel = await Passenger.findAll({
    where,
    attributes: ['level', [Passenger.sequelize.fn('COUNT', Passenger.sequelize.col('id')), 'cnt']],
    group: ['level'],
    raw: true
  })

  const byActivity = await Passenger.findAll({
    where,
    attributes: ['activityLevel', [Passenger.sequelize.fn('COUNT', Passenger.sequelize.col('id')), 'cnt']],
    group: ['activityLevel'],
    raw: true
  })

  const byConsumption = await Passenger.findAll({
    where,
    attributes: ['consumptionLevel', [Passenger.sequelize.fn('COUNT', Passenger.sequelize.col('id')), 'cnt']],
    group: ['consumptionLevel'],
    raw: true
  })

  const byCity = await Passenger.findAll({
    where,
    attributes: ['city', [Passenger.sequelize.fn('COUNT', Passenger.sequelize.col('id')), 'cnt']],
    group: ['city'],
    order: [[Passenger.sequelize.fn('COUNT', Passenger.sequelize.col('id')), 'DESC']],
    limit: 10,
    raw: true
  })

  const riskWhere = { ...where, [Op.or]: [{ isRisk: true }, { travelRiskLevel: { [Op.gte]: 4 } }] }
  const riskCount = await Passenger.count({ where: riskWhere })

  const blockedWhere = { ...where, [Op.or]: [{ status: 0 }, { travelRiskLevel: 5 }] }
  const blockedCount = await Passenger.count({ where: blockedWhere })

  return {
    total: totalCount,
    valid: Math.max(0, totalCount - riskCount - blockedCount),
    riskExcluded: riskCount,
    blockedExcluded: blockedCount,
    byLevel: byLevel.map(i => ({ level: i.level, count: Number(i.cnt) })),
    byActivity: byActivity.map(i => ({ level: i.activityLevel, count: Number(i.cnt) })),
    byConsumption: byConsumption.map(i => ({ level: i.consumptionLevel, count: Number(i.cnt) })),
    byCity: byCity.filter(i => i.city).map(i => ({ city: i.city, count: Number(i.cnt) }))
  }
}

const applyPurposeStrategy = (campaign, purpose) => {
  const cfg = AUDIENCE_PURPOSE_CONFIG[purpose] || AUDIENCE_PURPOSE_CONFIG[0]

  campaign.audiencePurpose = purpose
  campaign.targetUser = cfg.defaultTargetUser
  campaign.userTags = cfg.defaultUserTags
  campaign.activityLevels = cfg.defaultActivityLevels
  campaign.consumptionLevels = cfg.defaultConsumptionLevels
  campaign.userLevels = cfg.defaultUserLevels
  campaign.excludeHighRisk = cfg.defaultExcludeHighRisk
  campaign.excludeBlocked = cfg.defaultExcludeBlocked
  campaign.excludeInactive = cfg.defaultExcludeInactive

  if (cfg.defaultRegisterDaysMax) campaign.registerDaysMax = cfg.defaultRegisterDaysMax
  if (cfg.defaultInactiveDays) campaign.inactiveDays = cfg.defaultInactiveDays

  return campaign
}

module.exports = {
  USER_TAG_OPTIONS,
  EXCLUDE_TAG_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
  CONSUMPTION_LEVEL_OPTIONS,
  USER_LEVEL_OPTIONS,
  AUDIENCE_PURPOSE_CONFIG,
  buildAudienceQuery,
  validateAudienceConfig,
  getAudiencePreview,
  applyPurposeStrategy
}
