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
    comment: '目标用户：1全部 2新用户 3老用户'
  },
  rules: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '活动规则'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0草稿 1进行中 2已结束 3已暂停'
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
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '描述'
  }
}, {
  tableName: 'biz_marketing_campaign',
  comment: '营销活动表',
  indexes: [
    { fields: ['code'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['startTime'] }
  ]
})

module.exports = MarketingCampaign
