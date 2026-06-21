const { MarketingAuditLog, MarketingCampaign } = require('../models')
const { getTargetUserLabel, getStatusLabel } = require('./marketingValidateService')

const ACTION_MAP = {
  create: { label: '创建活动', icon: 'plus' },
  update: { label: '修改活动', icon: 'edit' },
  online: { label: '上线活动', icon: 'video-play' },
  offline: { label: '下线活动', icon: 'video-pause' },
  copy: { label: '复制活动', icon: 'copy-document' },
  delete: { label: '删除活动', icon: 'delete' },
  validate: { label: '校验拦截', icon: 'warning' },
  batch_online: { label: '批量上线', icon: 'top' },
  batch_offline: { label: '批量下线', icon: 'bottom' },
  batch_update: { label: '批量修改', icon: 'edit-pen' },
  batch_copy: { label: '批量复制', icon: 'documents' }
}

const logAction = async ({
  campaignId,
  campaignName,
  action,
  operatorId,
  operatorName,
  actionDetail = null,
  beforeData = null,
  afterData = null,
  validateResult = null,
  ip = null,
  riskLevel = 0,
  remark = null
}) => {
  try {
    const diffFields = calculateDiff(beforeData, afterData)

    await MarketingAuditLog.create({
      campaignId,
      campaignName,
      action,
      actionDetail,
      operatorId,
      operatorName,
      beforeData,
      afterData,
      diffFields,
      validateResult,
      ip,
      riskLevel,
      remark
    })

    return true
  } catch (error) {
    console.error('记录营销审计日志失败:', error)
    return false
  }
}

const calculateDiff = (before, after) => {
  if (!before || !after) return null

  const diff = []
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

  const sensitiveFields = ['rules', 'cities', 'vehicleTypes', 'cityTierConfig', 'exclusiveScenes']

  allKeys.forEach(key => {
    if (['id', 'createTime', 'updateTime', 'usedBudget', 'participantCount', 'orderCount', 'receiveCount', 'useCount'].includes(key)) {
      return
    }

    const beforeVal = before[key]
    const afterVal = after[key]

    const beforeStr = sensitiveFields.includes(key) ? JSON.stringify(beforeVal) : String(beforeVal ?? '')
    const afterStr = sensitiveFields.includes(key) ? JSON.stringify(afterVal) : String(afterVal ?? '')

    if (beforeStr !== afterStr) {
      diff.push({
        field: key,
        fieldLabel: getFieldDisplayName(key),
        before: formatFieldValue(key, beforeVal),
        after: formatFieldValue(key, afterVal)
      })
    }
  })

  return diff.length > 0 ? diff : null
}

const getFieldDisplayName = (field) => {
  const map = {
    name: '活动名称',
    code: '活动编码',
    scene: '活动场景',
    type: '活动类型',
    couponId: '关联优惠券',
    subsidyAmount: '补贴金额',
    maxSubsidyPerOrder: '单笔最高补贴',
    discountRate: '折扣率',
    budget: '活动预算',
    dailyBudget: '每日预算',
    startTime: '开始时间',
    endTime: '结束时间',
    targetUser: '目标人群',
    userLevelMin: '最低用户等级',
    registerDaysMin: '注册天数(最小)',
    registerDaysMax: '注册天数(最大)',
    inactiveDays: '流失天数',
    cities: '适用城市',
    cityTierConfig: '城市圈层配置',
    vehicleTypes: '适用车型',
    minOrderAmount: '使用门槛',
    perUserLimit: '每人限领次数',
    perDayLimit: '每日限领次数',
    totalCount: '活动总名额',
    mutuallyExclusive: '权益互斥',
    exclusiveScenes: '互斥场景',
    rules: '扩展规则',
    status: '活动状态',
    description: '活动描述'
  }
  return map[field] || field
}

const formatFieldValue = (field, value) => {
  if (value === null || value === undefined || value === '') return '未设置'

  switch (field) {
    case 'scene':
      return { 1: '新人礼', 2: '节日礼', 3: '出行补贴', 4: '召回福利' }[value] || String(value)
    case 'targetUser':
      return getTargetUserLabel(value)
    case 'status':
      return getStatusLabel(value)
    case 'mutuallyExclusive':
      return value === 1 ? '开启互斥' : '允许叠加'
    case 'cities':
    case 'vehicleTypes':
    case 'exclusiveScenes':
      if (Array.isArray(value)) {
        return value.length > 0 ? `共${value.length}项` : '全部'
      }
      return '未设置'
    case 'cityTierConfig':
    case 'rules':
      return typeof value === 'object' ? '已配置' : '未设置'
    case 'startTime':
    case 'endTime':
      return new Date(value).toLocaleString('zh-CN')
    case 'subsidyAmount':
    case 'maxSubsidyPerOrder':
    case 'budget':
    case 'dailyBudget':
    case 'minOrderAmount':
      return `¥${Number(value).toFixed(2)}`
    case 'discountRate':
      return `${value}折`
    default:
      return String(value)
  }
}

const getAuditLogs = async (campaignId, params = {}) => {
  const { page = 1, pageSize = 20, action, riskLevel, startDate, endDate } = params

  const where = { campaignId }
  if (action) where.action = action
  if (riskLevel !== undefined && riskLevel !== '') where.riskLevel = { gte: riskLevel }

  if (startDate || endDate) {
    where.createTime = {}
    if (startDate) where.createTime.gte = new Date(startDate)
    if (endDate) where.createTime.lte = new Date(endDate + ' 23:59:59')
  }

  const { count, rows } = await MarketingAuditLog.findAndCountAll({
    where,
    order: [['createTime', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize)
  })

  return {
    list: rows.map(row => formatAuditLog(row)),
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  }
}

const formatAuditLog = (log) => {
  const data = log.toJSON()
  return {
    ...data,
    actionLabel: (ACTION_MAP[data.action] || {}).label || data.action,
    actionIcon: (ACTION_MAP[data.action] || {}).icon || 'document',
    riskLabel: ['正常', '低风险', '中风险', '高风险'][data.riskLevel] || '正常',
    riskColor: ['#67c23a', '#909399', '#e6a23c', '#f56c6c'][data.riskLevel] || '#67c23a'
  }
}

const getRiskInterceptStats = async (params = {}) => {
  const { startDate, endDate } = params
  const where = { riskLevel: { [require('sequelize').Op.gt]: 0 } }

  if (startDate || endDate) {
    where.createTime = {}
    if (startDate) where.createTime.gte = new Date(startDate)
    if (endDate) where.createTime.lte = new Date(endDate + ' 23:59:59')
  }

  const logs = await MarketingAuditLog.findAll({
    where,
    attributes: ['action', 'riskLevel', 'validateResult'],
    order: [['createTime', 'DESC']],
    limit: 100
  })

  const riskByAction = {}
  let totalBlocked = 0

  logs.forEach(log => {
    const action = log.action
    if (!riskByAction[action]) {
      riskByAction[action] = { label: (ACTION_MAP[action] || {}).label || action, count: 0, blocked: 0 }
    }
    riskByAction[action].count++
    if (log.riskLevel === 3) {
      riskByAction[action].blocked++
      totalBlocked++
    }
  })

  return {
    totalRisk: logs.length,
    totalBlocked,
    riskByAction: Object.values(riskByAction)
  }
}

module.exports = {
  logAction,
  getAuditLogs,
  getRiskInterceptStats,
  ACTION_MAP,
  calculateDiff
}
