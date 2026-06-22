const { Op } = require('sequelize')
const { MarketingCampaign, MarketingAudienceLog, Order, Passenger } = require('../models')
const { calcMetrics, evaluateCampaign } = require('./marketingEffectService')

const FUNNEL_STAGES = [
  { key: 'impression', label: '活动曝光', color: '#66b1ff', icon: 'View' },
  { key: 'click',      label: '点击进入', color: '#67c23a', icon: 'Pointer' },
  { key: 'participate',label: '参与活动', color: '#e6a23c', icon: 'UserFilled' },
  { key: 'receive',    label: '领取权益', color: '#8e44ad', icon: 'Present' },
  { key: 'use',        label: '核销使用', color: '#f56c6c', icon: 'Tickets' },
  { key: 'conversion', label: '订单转化', color: '#ff0050', icon: 'Goods' }
]

const EXPORT_FIELD_CONFIG = [
  { key: 'id',                  label: '活动ID',       group: 'basic' },
  { key: 'name',                label: '活动名称',     group: 'basic', sensitive: false },
  { key: 'code',                label: '活动编码',     group: 'basic', sensitive: false },
  { key: 'sceneName',           label: '活动场景',     group: 'basic' },
  { key: 'audiencePurposeName', label: '人群策略',     group: 'basic' },
  { key: 'statusName',          label: '活动状态',     group: 'basic' },
  { key: 'startTime',           label: '开始时间',     group: 'basic' },
  { key: 'endTime',             label: '结束时间',     group: 'basic' },
  { key: 'budget',              label: '预算金额',     group: 'finance' },
  { key: 'usedBudget',          label: '已用预算',     group: 'finance' },
  { key: 'subsidyAmount',       label: '单次补贴额',   group: 'finance' },
  { key: 'conversionAmount',    label: '转化GMV',      group: 'finance' },
  { key: 'roiValue',            label: 'ROI',          group: 'finance' },
  { key: 'impressionCount',     label: '曝光数',       group: 'metrics' },
  { key: 'clickCount',          label: '点击数',       group: 'metrics' },
  { key: 'participantCount',    label: '参与人数',     group: 'metrics' },
  { key: 'receiveCount',        label: '领取数',       group: 'metrics' },
  { key: 'useCount',            label: '核销数',       group: 'metrics' },
  { key: 'conversionCount',     label: '转化订单数',   group: 'metrics' },
  { key: 'ctrValue',            label: '点击率',       group: 'metrics' },
  { key: 'redemptionRate',      label: '核销率',       group: 'metrics' },
  { key: 'conversionRate',      label: '转化率',       group: 'metrics' },
  { key: 'efficiencyLevelName', label: '效果等级',     group: 'rating' },
  { key: 'efficiencyScore',     label: '效果评分',     group: 'rating' },
  { key: 'dataAuthenticityName',label: '数据真实性',   group: 'rating' },
  { key: 'authenticityScore',   label: '真实性评分',   group: 'rating' },
  { key: 'templateTags',        label: '优质标签',     group: 'rating' },
  { key: 'creatorName',         label: '创建人',       group: 'meta' }
]

const SCENE_MAP = { 1: '新人礼', 2: '节日礼', 3: '出行补贴', 4: '召回福利' }
const AUDIENCE_PURPOSE_MAP = { 0: '自定义', 1: '拉新', 2: '促活', 3: '维稳' }
const STATUS_MAP = { 0: '草稿', 1: '待生效', 2: '进行中', 3: '已暂停', 4: '已结束', 5: '已下线' }
const AUTHENTICITY_MAP = { 1: '待校验', 2: '真实', 3: '疑似造假', 4: '确认造假' }
const EFFICIENCY_MAP = { 0: '未评级', 1: '低效', 2: '一般', 3: '良好', 4: '优秀', 5: 'S级' }

const maskPhone = (phone) => {
  if (!phone) return ''
  const s = String(phone)
  return s.length >= 11 ? `${s.slice(0, 3)}****${s.slice(-4)}` : s.replace(/(\d{2})\d+(\d{2})/, '$1****$2')
}

const getFunnelData = async (campaignId, params = {}) => {
  const campaign = await MarketingCampaign.findByPk(campaignId)
  if (!campaign) throw new Error('活动不存在')

  const metrics = calcMetrics(campaign)

  const funnel = FUNNEL_STAGES.map(s => {
    const value = Number(metrics[s.key] || 0)
    return {
      ...s,
      value,
      displayValue: value.toLocaleString()
    }
  })

  let prevValue = funnel[0].value || 1
  funnel.forEach((stage, idx) => {
    if (idx === 0) {
      stage.conversionPct = 100
      stage.dropPct = 0
    } else {
      stage.conversionPct = prevValue > 0 ? Number(((stage.value / prevValue) * 100).toFixed(2)) : 0
      stage.dropPct = Number((100 - stage.conversionPct).toFixed(2))
    }
    if (stage.value > prevValue) {
      stage.conversionPct = 100
      stage.dropPct = 0
    }
    prevValue = stage.value || prevValue
    stage.totalRatio = funnel[0].value > 0
      ? Number(((stage.value / funnel[0].value) * 100).toFixed(2))
      : 0
  })

  const topReasons = await getFunnelLossReasons(campaignId, funnel)

  return {
    funnel,
    gmv: metrics.gmv,
    avgOrderValue: metrics.conversion > 0 ? Number((metrics.gmv / metrics.conversion).toFixed(2)) : 0,
    avgAcquisitionCost: metrics.participant > 0 ? Number((metrics.usedBudget / metrics.participant).toFixed(2)) : 0,
    topLossReasons: topReasons
  }
}

const getFunnelLossReasons = async (campaignId, funnel) => {
  const reasons = []
  const dropPoints = funnel.filter(f => f.dropPct > 15 && f.key !== 'impression')

  const reasonMap = {
    click: [
      { level: 'warning', title: '点击参与率偏低', desc: '建议优化活动主图、标题和推送时段，突出核心权益' },
      { level: 'info',    title: '人群定向精准度待提升', desc: '可重新评估人群标签组合或调整覆盖城市范围' }
    ],
    participate: [
      { level: 'warning', title: '权益吸引力不足', desc: '参与流程过长或补贴力度未达预期，建议简化参与步骤' },
      { level: 'info',    title: '落地页转化瓶颈', desc: '建议优化落地页信息结构：顶部突出核心优惠' }
    ],
    receive: [
      { level: 'warning', title: '领取条件门槛过高', desc: '建议降低最低订单金额或参与等级要求' },
      { level: 'danger',  title: '风控拦截过严', desc: '核对高风险拦截规则，检查是否误伤正常用户' }
    ],
    use: [
      { level: 'warning', title: '使用场景受限', desc: '权益可用时段/城市/车型限制较多导致核销困难' },
      { level: 'info',    title: '核销提醒不足', desc: '未向用户发送到期提醒，建议优化触达策略' }
    ],
    conversion: [
      { level: 'warning', title: '权益使用未撬动复购', desc: '补贴权益用完后未产生新订单，建议搭配复购券包' },
      { level: 'info',    title: '权益与场景匹配度低', desc: '可考虑调整权益使用范围与目标人群的出行场景匹配度' }
    ]
  }

  dropPoints.forEach(p => {
    const list = reasonMap[p.key] || []
    list.forEach(r => reasons.push({ stageKey: p.key, stageLabel: p.label, dropPct: p.dropPct, ...r }))
  })

  if (reasons.length === 0) {
    reasons.push({ level: 'success', title: '漏斗各阶段转化健康', desc: '各环节流失率均在正常范围内（<15%）', dropPct: 0 })
  }

  return reasons
}

const getFraudRecords = async (campaignId, params = {}) => {
  const { page = 1, pageSize = 20 } = params
  const where = { campaignId, action: { [Op.in]: ['fraud', 'invalid_participation'] } }

  const { count, rows } = await MarketingAudienceLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: Number(pageSize),
    offset: (Number(page) - 1) * Number(pageSize)
  })

  const list = rows.map(r => ({
    id: r.id,
    action: r.action,
    phone: r.userPhone ? maskPhone(r.userPhone) : '',
    rawPhone: r.userPhone || '',
    userLevel: r.userLevel,
    reason: r.interceptionReason,
    tags: r.tags || [],
    affectedCount: r.affectedCount,
    createdAt: r.createdAt,
    riskLevel: r.riskLevel
  }))

  const fraudTypeStats = [
    { key: 'invalid_participation', label: '非定向用户参与', count: list.filter(l => l.action === 'invalid_participation').length, color: '#e6a23c' },
    { key: 'fraud', label: '恶意刷活动/刷核销', count: list.filter(l => l.action === 'fraud').length, color: '#f56c6c' },
    { key: 'risk', label: '高风险账号拦截', count: 0, color: '#909399' },
    { key: 'blocked', label: '封禁账号拦截', count: 0, color: '#c0c4cc' }
  ]

  return {
    list,
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
    stats: {
      totalBlocked: count,
      byType: fraudTypeStats,
      estimatedSavings: Number((count * 8.5).toFixed(2))
    }
  }
}

const exportCampaignReports = async (ids, params = {}) => {
  const { fields, maskSensitive = true, sortBy = 'efficiencyScore', sortOrder = 'desc' } = params

  const selectedFields = (fields && fields.length)
    ? EXPORT_FIELD_CONFIG.filter(f => fields.includes(f.key))
    : EXPORT_FIELD_CONFIG

  const campaigns = await MarketingCampaign.findAll({ where: { id: { [Op.in]: ids } } })

  const evaluatedPromises = campaigns.map(async c => {
    if (!c.efficiencyLevel) {
      try { await evaluateCampaign(c.id) } catch (e) {}
      return MarketingCampaign.findByPk(c.id)
    }
    return c
  })
  const evaluated = await Promise.all(evaluatedPromises)

  const list = evaluated.map(c => {
    const item = {}
    selectedFields.forEach(f => {
      let val
      switch (f.key) {
        case 'sceneName': val = SCENE_MAP[c.scene] || ''; break
        case 'audiencePurposeName': val = AUDIENCE_PURPOSE_MAP[c.audiencePurpose] || ''; break
        case 'statusName': val = STATUS_MAP[c.status] || ''; break
        case 'efficiencyLevelName': val = EFFICIENCY_MAP[c.efficiencyLevel] || ''; break
        case 'dataAuthenticityName': val = AUTHENTICITY_MAP[c.dataAuthenticity] || ''; break
        case 'templateTags': val = Array.isArray(c.templateTags) ? c.templateTags.join('/') : ''; break
        case 'ctrValue':
        case 'redemptionRate':
        case 'conversionRate':
          val = c[f.key] ? `${(Number(c[f.key]) * 100).toFixed(2)}%` : '0%'
          break
        case 'roiValue':
          val = Number(c[f.key] || 0).toFixed(2)
          break
        default: val = c[f.key] !== undefined ? c[f.key] : ''
      }
      if (maskSensitive && f.sensitive) {
        if (f.key === 'creatorName') val = '***'
        else if (typeof val === 'string' && val.includes('@')) val = '***@***.com'
      }
      item[f.key] = val
    })
    return item
  })

  list.sort((a, b) => {
    const av = Number(a[sortBy]) || 0
    const bv = Number(b[sortBy]) || 0
    return sortOrder === 'asc' ? av - bv : bv - av
  })

  return {
    total: list.length,
    columns: selectedFields.map(f => ({ key: f.key, label: f.label, group: f.group })),
    rows: list,
    maskApplied: !!maskSensitive
  }
}

module.exports = {
  FUNNEL_STAGES,
  EXPORT_FIELD_CONFIG,
  getFunnelData,
  getFunnelLossReasons,
  getFraudRecords,
  exportCampaignReports
}
