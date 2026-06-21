const { Op } = require('sequelize')
const { MarketingCampaign } = require('../models')
const { validateAudienceConfig } = require('./marketingAudienceService')

const SCENE_CONFIG = {
  1: {
    name: '新人礼',
    maxSubsidy: 30,
    maxDiscountRate: 7,
    defaultTargetUser: 2,
    requiredFields: ['subsidyAmount', 'perUserLimit'],
    exclusiveScenes: [2, 3, 4],
    maxBudgetPerCity: 500000
  },
  2: {
    name: '节日礼',
    maxSubsidy: 50,
    maxDiscountRate: 6,
    defaultTargetUser: 1,
    requiredFields: ['startTime', 'endTime', 'subsidyAmount'],
    exclusiveScenes: [1, 3, 4],
    maxBudgetPerCity: 1000000
  },
  3: {
    name: '出行补贴',
    maxSubsidy: 20,
    maxDiscountRate: 8,
    defaultTargetUser: 1,
    requiredFields: ['subsidyAmount', 'minOrderAmount'],
    exclusiveScenes: [1, 2, 4],
    maxBudgetPerCity: 2000000
  },
  4: {
    name: '召回福利',
    maxSubsidy: 40,
    maxDiscountRate: 6.5,
    defaultTargetUser: 4,
    requiredFields: ['subsidyAmount', 'inactiveDays'],
    exclusiveScenes: [1, 2, 3],
    maxBudgetPerCity: 800000
  }
}

const validateCampaign = async (data, excludeId = null) => {
  const errors = []
  const warnings = []
  const passed = []

  checkBasicParams(data, errors, warnings)

  checkSceneRules(data, errors, warnings)

  await checkTimeOverlap(data, excludeId, errors, warnings)

  await checkBudgetConflict(data, excludeId, errors, warnings)

  await checkUserConflict(data, excludeId, errors, warnings)

  checkMutualExclusive(data, errors, warnings)

  checkBenefitRationality(data, errors, warnings)

  await checkDuplicateCampaign(data, excludeId, errors, warnings)

  checkAudienceTargeting(data, errors, warnings, passed)

  const riskLevel = calculateRiskLevel(errors, warnings)
  const isBlocked = errors.some(e => e.blocking)

  return {
    valid: !isBlocked,
    riskLevel,
    errors,
    warnings,
    passed,
    summary: {
      totalChecks: errors.length + warnings.length + passed.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      passCount: passed.length
    }
  }
}

const checkBasicParams = (data, errors, warnings) => {
  if (!data.name || data.name.trim().length < 2) {
    errors.push({
      field: 'name',
      type: 'basic',
      severity: 'high',
      blocking: true,
      code: 'NAME_TOO_SHORT',
      message: '活动名称至少需要2个字符'
    })
  } else if (data.name && data.name.length > 50) {
    errors.push({
      field: 'name',
      type: 'basic',
      severity: 'high',
      blocking: true,
      code: 'NAME_TOO_LONG',
      message: '活动名称不能超过50个字符'
    })
  } else {
    passed.push({ field: 'name', message: '活动名称校验通过' })
  }

  if (!data.code || !/^[A-Z0-9_]{3,30}$/.test(data.code)) {
    errors.push({
      field: 'code',
      type: 'basic',
      severity: 'high',
      blocking: true,
      code: 'CODE_INVALID',
      message: '活动编码格式不正确，需3-30位大写字母、数字或下划线'
    })
  } else {
    passed.push({ field: 'code', message: '活动编码格式校验通过' })
  }

  if (!data.startTime || !data.endTime) {
    errors.push({
      field: 'timeRange',
      type: 'basic',
      severity: 'high',
      blocking: true,
      code: 'TIME_REQUIRED',
      message: '请选择活动开始和结束时间'
    })
  } else if (new Date(data.startTime) >= new Date(data.endTime)) {
    errors.push({
      field: 'timeRange',
      type: 'basic',
      severity: 'high',
      blocking: true,
      code: 'TIME_INVALID',
      message: '活动结束时间必须晚于开始时间'
    })
  } else {
    passed.push({ field: 'timeRange', message: '活动时段设置有效' })
  }

  if (data.budget === undefined || data.budget === null || parseFloat(data.budget) <= 0) {
    errors.push({
      field: 'budget',
      type: 'basic',
      severity: 'high',
      blocking: true,
      code: 'BUDGET_INVALID',
      message: '活动预算必须大于0'
    })
  } else if (parseFloat(data.budget) > 10000000) {
    warnings.push({
      field: 'budget',
      type: 'basic',
      severity: 'medium',
      blocking: false,
      code: 'BUDGET_TOO_HIGH',
      message: '预算超过1000万，建议拆分活动或提交审批'
    })
  } else {
    passed.push({ field: 'budget', message: '预算金额设置合理' })
  }

  if (data.dailyBudget && parseFloat(data.dailyBudget) > parseFloat(data.budget)) {
    errors.push({
      field: 'dailyBudget',
      type: 'basic',
      severity: 'high',
      blocking: true,
      code: 'DAILY_BUDGET_EXCEED',
      message: '每日预算不能超过活动总预算'
    })
  }
}

const checkSceneRules = (data, errors, warnings) => {
  const scene = parseInt(data.scene) || 1
  const config = SCENE_CONFIG[scene]

  if (!config) {
    errors.push({
      field: 'scene',
      type: 'scene',
      severity: 'high',
      blocking: true,
      code: 'SCENE_INVALID',
      message: '无效的活动场景类型'
    })
    return
  }

  config.requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({
        field,
        type: 'scene',
        severity: 'high',
        blocking: true,
        code: `${field.toUpperCase()}_REQUIRED`,
        message: `${config.name}活动必须配置${getFieldLabel(field)}`
      })
    }
  })

  if (data.targetUser && config.defaultTargetUser !== parseInt(data.targetUser)) {
    if (scene === 1 && ![2].includes(parseInt(data.targetUser))) {
      errors.push({
        field: 'targetUser',
        type: 'scene',
        severity: 'high',
        blocking: true,
        code: 'TARGET_USER_MISMATCH',
        message: '新人礼活动目标人群必须为新用户'
      })
    }
    if (scene === 4 && ![4].includes(parseInt(data.targetUser))) {
      errors.push({
        field: 'targetUser',
        type: 'scene',
        severity: 'high',
        blocking: true,
        code: 'TARGET_USER_MISMATCH',
        message: '召回福利活动目标人群必须为流失用户'
      })
    }
  }

  if (scene === 4 && (!data.inactiveDays || parseInt(data.inactiveDays) < 7)) {
    errors.push({
      field: 'inactiveDays',
      type: 'scene',
      severity: 'high',
      blocking: true,
      code: 'INACTIVE_DAYS_INVALID',
      message: '召回福利要求用户至少7天未活跃'
    })
  }

  if (data.subsidyAmount && parseFloat(data.subsidyAmount) > config.maxSubsidy) {
    errors.push({
      field: 'subsidyAmount',
      type: 'scene',
      severity: 'high',
      blocking: true,
      code: 'SUBSIDY_EXCEED_LIMIT',
      message: `${config.name}单笔补贴最高${config.maxSubsidy}元，当前设置${data.subsidyAmount}元`
    })
  }

  if (data.discountRate && parseFloat(data.discountRate) < config.maxDiscountRate) {
    warnings.push({
      field: 'discountRate',
      type: 'scene',
      severity: 'medium',
      blocking: false,
      code: 'DISCOUNT_TOO_LOW',
      message: `${config.name}折扣力度通常不低于${config.maxDiscountRate}折`
    })
  }

  passed.push({ field: 'scene', message: `${config.name}场景规则校验通过` })
}

const checkTimeOverlap = async (data, excludeId, errors, warnings) => {
  if (!data.startTime || !data.endTime) return

  const startTime = new Date(data.startTime)
  const endTime = new Date(data.endTime)
  const cities = Array.isArray(data.cities) ? data.cities : null

  const where = {
    status: { [Op.in]: [1, 2] },
    startTime: { [Op.lt]: endTime },
    endTime: { [Op.gt]: startTime }
  }

  if (excludeId) {
    where.id = { [Op.ne]: excludeId }
  }

  const overlapping = await MarketingCampaign.findAll({
    where,
    attributes: ['id', 'name', 'scene', 'startTime', 'endTime', 'cities']
  })

  const conflictCities = []
  overlapping.forEach(campaign => {
    const camCities = campaign.cities ? JSON.parse(campaign.cities) : null
    if (cities && camCities) {
      const overlapCities = cities.filter(c => camCities.includes(c))
      if (overlapCities.length > 0) {
        conflictCities.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          cities: overlapCities
        })
      }
    } else {
      conflictCities.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        cities: camCities || '全部城市'
      })
    }
  })

  if (conflictCities.length > 0) {
    errors.push({
      field: 'timeRange',
      type: 'overlap',
      severity: 'high',
      blocking: true,
      code: 'TIME_CITY_OVERLAP',
      message: `与${conflictCities.length}个活动时段重叠`,
      detail: conflictCities.map(c =>
        `活动「${c.campaignName}」覆盖城市：${Array.isArray(c.cities) ? c.cities.join('、') : c.cities}`
      )
    })
  } else {
    passed.push({ field: 'timeRange', message: '活动时段无冲突' })
  }
}

const checkBudgetConflict = async (data, excludeId, errors, warnings) => {
  if (!data.budget || !data.startTime || !data.endTime) return

  const scene = parseInt(data.scene) || 1
  const config = SCENE_CONFIG[scene]
  const budget = parseFloat(data.budget)
  const cities = Array.isArray(data.cities) ? data.cities : null

  if (cities && cities.length > 0 && config) {
    const maxAllowed = cities.length * config.maxBudgetPerCity
    if (budget > maxAllowed) {
      errors.push({
        field: 'budget',
        type: 'budget',
        severity: 'high',
        blocking: true,
        code: 'BUDGET_CITY_EXCEED',
        message: `按城市数预算上限为${maxAllowed.toLocaleString()}元，当前超${(budget - maxAllowed).toLocaleString()}元`
      })
    }
  }

  const startTime = new Date(data.startTime)
  const endTime = new Date(data.endTime)

  const where = {
    status: { [Op.in]: [1, 2] },
    startTime: { [Op.lt]: endTime },
    endTime: { [Op.gt]: startTime }
  }

  if (excludeId) {
    where.id = { [Op.ne]: excludeId }
  }

  const samePeriod = await MarketingCampaign.findAll({
    where,
    attributes: ['id', 'name', 'budget', 'usedBudget', 'cities']
  })

  if (samePeriod.length > 0) {
    let totalPeriodBudget = 0
    let totalUsedBudget = 0
    samePeriod.forEach(c => {
      const camCities = c.cities ? JSON.parse(c.cities) : null
      if (!cities || !camCities || cities.some(ct => camCities.includes(ct))) {
        totalPeriodBudget += parseFloat(c.budget) || 0
        totalUsedBudget += parseFloat(c.usedBudget) || 0
      }
    })

    totalPeriodBudget += budget

    if (totalPeriodBudget > 5000000) {
      warnings.push({
        field: 'budget',
        type: 'budget',
        severity: 'medium',
        blocking: false,
        code: 'PERIOD_BUDGET_TOO_HIGH',
        message: `同期同区域活动总预算达${totalPeriodBudget.toLocaleString()}元，请确认是否合理`
      })
    }
  }

  if (data.dailyBudget) {
    const days = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24))
    if (days > 0) {
      const expectedDaily = budget / days
      if (parseFloat(data.dailyBudget) < expectedDaily * 0.5) {
        warnings.push({
          field: 'dailyBudget',
          type: 'budget',
          severity: 'medium',
          blocking: false,
          code: 'DAILY_BUDGET_TOO_LOW',
          message: `日均预算建议不低于${(expectedDaily * 0.5).toFixed(0)}元`
        })
      }
    }
  }
}

const checkUserConflict = async (data, excludeId, errors, warnings) => {
  if (!data.targetUser || !data.startTime || !data.endTime) return

  const targetUser = parseInt(data.targetUser)
  const startTime = new Date(data.startTime)
  const endTime = new Date(data.endTime)
  const cities = Array.isArray(data.cities) ? data.cities : null

  const userGroups = {
    1: [1, 2, 3, 4, 5],
    2: [2],
    3: [3, 5],
    4: [4],
    5: [5]
  }

  const myGroups = userGroups[targetUser] || [targetUser]

  const where = {
    status: { [Op.in]: [1, 2] },
    startTime: { [Op.lt]: endTime },
    endTime: { [Op.gt]: startTime },
    mutuallyExclusive: 1
  }

  if (excludeId) {
    where.id = { [Op.ne]: excludeId }
  }

  const candidates = await MarketingCampaign.findAll({
    where,
    attributes: ['id', 'name', 'targetUser', 'exclusiveScenes', 'cities', 'scene']
  })

  const conflicts = []
  candidates.forEach(cam => {
    const camGroups = userGroups[cam.targetUser] || [cam.targetUser]
    const groupOverlap = myGroups.some(g => camGroups.includes(g))

    if (groupOverlap) {
      const camCities = cam.cities ? JSON.parse(cam.cities) : null
      const cityOverlap = !cities || !camCities || cities.some(c => camCities.includes(c))

      if (cityOverlap) {
        const exclusiveScenes = cam.exclusiveScenes ? JSON.parse(cam.exclusiveScenes) : null
        const sceneOverlap = !exclusiveScenes || exclusiveScenes.includes(parseInt(data.scene))

        if (sceneOverlap && data.mutuallyExclusive !== 0) {
          conflicts.push({
            campaignId: cam.id,
            campaignName: cam.name,
            reason: `人群：${getTargetUserLabel(cam.targetUser)}，城市：${camCities ? camCities.join('、') : '全部'}`
          })
        }
      }
    }
  })

  if (conflicts.length > 0) {
    errors.push({
      field: 'targetUser',
      type: 'user',
      severity: 'high',
      blocking: true,
      code: 'USER_CONFLICT',
      message: `与${conflicts.length}个活动目标人群冲突`,
      detail: conflicts.map(c => `活动「${c.campaignName}」(${c.reason})`)
    })
  } else {
    passed.push({ field: 'targetUser', message: '目标人群无冲突' })
  }
}

const checkMutualExclusive = (data, errors, warnings) => {
  const scene = parseInt(data.scene) || 1
  const config = SCENE_CONFIG[scene]

  if (data.mutuallyExclusive === 0 && config) {
    warnings.push({
      field: 'mutuallyExclusive',
      type: 'exclusive',
      severity: 'low',
      blocking: false,
      code: 'NOT_EXCLUSIVE_WARNING',
      message: `${config.name}建议开启权益互斥，防止用户重复薅羊毛`
    })
  } else if (config) {
    passed.push({ field: 'mutualExclusive', message: '权益互斥设置已启用' })
  }
}

const checkBenefitRationality = (data, errors, warnings) => {
  const subsidyAmount = parseFloat(data.subsidyAmount) || 0
  const minOrderAmount = parseFloat(data.minOrderAmount) || 0
  const discountRate = parseFloat(data.discountRate) || 0

  if (subsidyAmount > 0 && minOrderAmount > 0 && subsidyAmount >= minOrderAmount) {
    errors.push({
      field: 'subsidyAmount',
      type: 'benefit',
      severity: 'high',
      blocking: true,
      code: 'SUBSIDY_EXCEED_THRESHOLD',
      message: `补贴金额(${subsidyAmount}元)不得大于等于使用门槛(${minOrderAmount}元)`
    })
  }

  if (minOrderAmount > 0 && subsidyAmount > 0) {
    const ratio = subsidyAmount / minOrderAmount
    if (ratio > 0.5) {
      warnings.push({
        field: 'subsidyAmount',
        type: 'benefit',
        severity: 'medium',
        blocking: false,
        code: 'SUBSIDY_RATIO_HIGH',
        message: `补贴占门槛比例${(ratio * 100).toFixed(0)}%，可能过高`
      })
    }
  }

  if (discountRate > 0) {
    if (discountRate > 10 || discountRate < 1) {
      errors.push({
        field: 'discountRate',
        type: 'benefit',
        severity: 'high',
        blocking: true,
        code: 'DISCOUNT_INVALID',
        message: '折扣率必须在1-10之间'
      })
    }
  }

  if (data.maxSubsidyPerOrder && subsidyAmount > 0) {
    if (parseFloat(data.maxSubsidyPerOrder) < subsidyAmount) {
      errors.push({
        field: 'maxSubsidyPerOrder',
        type: 'benefit',
        severity: 'high',
        blocking: true,
        code: 'MAX_SUBSIDY_INVALID',
        message: '单笔最高补贴不能小于基础补贴金额'
      })
    }
  }

  if (data.perUserLimit && parseInt(data.perUserLimit) > 10) {
    warnings.push({
      field: 'perUserLimit',
      type: 'benefit',
      severity: 'low',
      blocking: false,
      code: 'PER_USER_LIMIT_HIGH',
      message: '每人限领次数较多，建议设置在10次以内'
    })
  }

  passed.push({ field: 'benefit', message: '权益配置合理性校验完成' })
}

const checkDuplicateCampaign = async (data, excludeId, errors, warnings) => {
  const where = {
    scene: parseInt(data.scene) || 1,
    targetUser: parseInt(data.targetUser) || 1,
    name: { [Op.like]: `%${data.name}%` }
  }

  if (excludeId) {
    where.id = { [Op.ne]: excludeId }
  }

  const similar = await MarketingCampaign.findAll({
    where,
    limit: 5,
    attributes: ['id', 'name', 'startTime', 'endTime', 'budget', 'status']
  })

  if (similar.length > 0) {
    warnings.push({
      field: 'name',
      type: 'duplicate',
      severity: 'medium',
      blocking: false,
      code: 'SIMILAR_CAMPAIGN_EXISTS',
      message: `发现${similar.length}个相似活动，请确认是否重复创建`,
      detail: similar.map(s => `「${s.name}」${getStatusLabel(s.status)}`)
    })
  } else {
    passed.push({ field: 'duplicate', message: '未发现重复活动' })
  }

  if (data.code) {
    const codeWhere = { code: data.code }
    if (excludeId) codeWhere.id = { [Op.ne]: excludeId }
    const codeExist = await MarketingCampaign.findOne({ where: codeWhere })
    if (codeExist) {
      errors.push({
        field: 'code',
        type: 'duplicate',
        severity: 'high',
        blocking: true,
        code: 'CODE_DUPLICATE',
        message: '活动编码已存在，请更换'
      })
    }
  }
}

const calculateRiskLevel = (errors, warnings) => {
  const highErrors = errors.filter(e => e.severity === 'high').length
  const mediumErrors = errors.filter(e => e.severity === 'medium').length
  const mediumWarnings = warnings.filter(w => w.severity === 'medium').length

  if (highErrors > 0) return 3
  if (mediumErrors > 0 || mediumWarnings >= 3) return 2
  if (warnings.length > 0) return 1
  return 0
}

const getFieldLabel = (field) => {
  const labels = {
    subsidyAmount: '补贴金额',
    perUserLimit: '每人限领次数',
    minOrderAmount: '使用门槛',
    inactiveDays: '流失天数',
    startTime: '开始时间',
    endTime: '结束时间'
  }
  return labels[field] || field
}

const getTargetUserLabel = (type) => {
  const labels = { 1: '全部用户', 2: '新用户', 3: '老用户', 4: '流失用户', 5: '高价值用户' }
  return labels[type] || '未知'
}

const getStatusLabel = (status) => {
  const labels = { 0: '草稿', 1: '待生效', 2: '进行中', 3: '已暂停', 4: '已结束', 5: '已下线' }
  return labels[status] || '未知'
}

const checkAudienceTargeting = (data, errors = [], warnings = [], passed = []) => {
  const result = validateAudienceConfig(data, errors, warnings)
  errors.push(...result.errors.map(e => ({
    ...e,
    type: 'audience',
    severity: e.blocking ? 'high' : 'medium'
  })))
  warnings.push(...result.warnings.map(w => ({
    ...w,
    type: 'audience',
    severity: w.blocking ? 'high' : 'low'
  })))
  if (result.passed) passed.push(...result.passed.map(p => ({ field: p.field || 'audience', message: p.message })))
}

module.exports = {
  validateCampaign,
  SCENE_CONFIG,
  getTargetUserLabel,
  getStatusLabel
}
