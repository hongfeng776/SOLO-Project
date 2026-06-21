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
