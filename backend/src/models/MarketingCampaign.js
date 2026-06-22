const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const MarketingCampaign = sequelize.define('MarketingCampaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '活动名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '活动编码'
  },
  scene: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '活动场景：1新人礼 2节日礼 3出行补贴 4召回福利'
  },
  type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '类型：1新用户 2节日 3高峰补贴 4会员专享'
  },
  couponId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联优惠券ID'
  },
  subsidyAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '补贴金额'
  },
  maxSubsidyPerOrder: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '单笔订单最高补贴'
  },
  discountRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '折扣率（0-10，如8表示8折）'
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '预算'
  },
  usedBudget: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '已用预算'
  },
  dailyBudget: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '每日预算上限'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '开始时间'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '结束时间'
  },
  targetUser: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '目标用户：1全部 2新用户 3老用户 4流失用户 5高价值用户'
  },
  userLevelMin: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '用户最低等级（0不限）'
  },
  registerDaysMin: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '注册天数最小值（0不限）'
  },
  registerDaysMax: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '注册天数最大值（0不限）'
  },
  inactiveDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '流失用户未活跃天数（召回福利专用）'
  },
  cities: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '适用城市列表（空表示全部城市）'
  },
  cityTierConfig: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '城市圈层差异化配置 { tier1: {subsidy}, tier2: {...} }'
  },
  vehicleTypes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '适用车型列表（空表示全部车型）'
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '最低订单金额门槛'
  },
  perUserLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '每人限领/参与次数'
  },
  perDayLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '每人每日限领次数（0不限）'
  },
  totalCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '活动总名额（0不限）'
  },
  mutuallyExclusive: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否与其他活动互斥：0否 1是'
  },
  exclusiveScenes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '互斥场景列表（空表示与所有场景互斥）'
  },
  rules: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '活动规则扩展配置'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0草稿 1待生效 2进行中 3已暂停 4已结束 5已下线'
  },
  participantCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '参与人数'
  },
  orderCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '关联订单数'
  },
  receiveCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '领取次数'
  },
  useCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用次数'
  },
  sourceCampaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '复制来源活动ID'
  },
  campaignPurpose: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '活动目的：0通用 1拉新 2促活 3维稳'
  },
  audiencePurpose: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '人群策略目的：1拉新(注册≤30天) 2促活(沉睡/低活) 3维稳(高频核心) 0自定义'
  },
  userTags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '定向用户标签列表 ["new_register","high_consumption",...]'
  },
  excludeUserTags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '排除用户标签列表 ["fraud","risk","low_value",...]'
  },
  activityLevels: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '定向活跃度：[1,2] 1沉睡 2低 3中 4高 5非常活跃'
  },
  consumptionLevels: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '定向消费层级：[1,2] 1低 2中 3高 4超高'
  },
  userLevels: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '定向用户等级：[3,4,5] 1普通-5钻石'
  },
  userLevelsMin: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '用户等级最小值'
  },
  userLevelsMax: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '用户等级最大值（0不限）'
  },
  excludeHighRisk: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否排除高风险用户：0否 1是'
  },
  excludeBlocked: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否排除封禁用户：0否 1是'
  },
  excludeInactive: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否排除超90天未登录用户：0否 1是'
  },
  registerChannels: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '注册渠道定向 ["app_store","wechat","baidu",...]'
  },
  provinces: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '省份定向（空表示全部）'
  },
  audienceCityTiers: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '城市圈层定向 [1,2] 1一线-4四线及以下'
  },
  audienceRules: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '人群定向规则JSON { filters:[{field,op,value}], relation:"AND"}'
  },
  userWeights: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '用户参与权重配置 { byLevel:{3:1.5,4:2}, byTag:{vip:2}, byCity:{} }'
  },
  targetedUserIds: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '手动定向用户ID列表'
  },
  excludedUserIds: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '手动排除用户ID列表'
  },
  audienceCoverage: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '人群覆盖数量快照 {total, valid, byLevel, byActivity, byCity}'
  },
  audienceVersion: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '人群规则版本号，每次变更+1'
  },
  impressionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '曝光次数'
  },
  clickCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '点击次数'
  },
  conversionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '转化次数（产生有效订单）'
  },
  conversionAmount: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0,
    comment: '转化订单金额（GMV）'
  },
  efficiencyLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '活动效果等级：0未评级 1低效 2一般 3良好 4优秀 5S级'
  },
  efficiencyScore: {
    type: DataTypes.DECIMAL(6, 2),
    defaultValue: 0,
    comment: '活动效果评分（0-100）'
  },
  roiValue: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
    comment: 'ROI = conversionAmount / usedBudget'
  },
  ctrValue: {
    type: DataTypes.DECIMAL(8, 4),
    defaultValue: 0,
    comment: '点击率 clickCount / impressionCount'
  },
  conversionRate: {
    type: DataTypes.DECIMAL(8, 4),
    defaultValue: 0,
    comment: '转化率 conversionCount / receiveCount'
  },
  redemptionRate: {
    type: DataTypes.DECIMAL(8, 4),
    defaultValue: 0,
    comment: '核销率 useCount / receiveCount'
  },
  optimizeSuggestions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '优化建议数组 [{level, type, title, desc, priority}]'
  },
  dataAuthenticity: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '数据真伪校验：1待校验 2真实 3疑似造假 4确认造假'
  },
  authenticityScore: {
    type: DataTypes.DECIMAL(6, 2),
    defaultValue: 0,
    comment: '数据真实性评分（0-100）'
  },
  fraudWarningCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '疑似虚假参与拦截次数'
  },
  isTemplate: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否标记为优质模板：0否 1是'
  },
  templateTags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '优质模板标签数组 ["高ROI","高核销率","拉新效果好"]'
  },
  funnelData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '全链路漏斗快照 {impression,click,participate,receive,use,conversion,gmv}'
  },
  lastEvaluatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最近一次效果评级时间'
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建人ID'
  },
  creatorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '创建人姓名'
  },
  onlineTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '上线时间'
  },
  offlineTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '下线时间'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '活动描述'
  }
}, {
  tableName: 'biz_marketing_campaign',
  comment: '营销活动表',
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['scene'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['startTime'] },
    { fields: ['endTime'] },
    { fields: ['targetUser'] },
    { fields: ['creatorId'] }
  ]
})

module.exports = MarketingCampaign
