const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const SettlementItem = sequelize.define('SettlementItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  settlementRecordId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '结算记录ID'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '订单号'
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '司机ID'
  },
  orderType: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '订单类型：1即时单 2预约单 3拼车单'
  },
  orderSource: {
    type: DataTypes.STRING(50),
    defaultValue: 'platform',
    comment: '订单来源：platform平台/enterprise企业/h5小程序/vip会员'
  },
  orderStartTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '订单开始时间'
  },
  isPeakHour: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否高峰时段'
  },
  isHoliday: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否节假日'
  },
  isWeekend: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否周末'
  },
  isPremium: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否溢价订单'
  },
  serviceRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.0,
    comment: '本次服务星级'
  },
  orderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '订单总金额'
  },
  premiumAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '溢价金额'
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 80,
    comment: '实际分成比例'
  },
  baseIncome: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '基础收入'
  },
  hourSubsidy: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '时段补贴'
  },
  ratingSubsidy: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '星级补贴'
  },
  holidaySubsidy: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '节假日补贴'
  },
  premiumIncome: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '溢价分成收入'
  },
  penaltyAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '扣款'
  },
  totalIncome: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '司机本单收益'
  },
  platformCommission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '平台抽成'
  },
  appliedRules: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '应用的结算规则ID数组'
  },
  calculationDetail: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '计算过程明细'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常'
  },
  abnormalType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '异常类型'
  },
  abnormalReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '异常原因'
  },
  matchCheckResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '多维度匹配校验结果'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updateTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  tableName: 'biz_settlement_item',
  comment: '单笔收益明细表',
  indexes: [
    { fields: ['settlementRecordId'] },
    { fields: ['orderId'] },
    { fields: ['driverId'] },
    { fields: ['orderNo'], unique: true },
    { fields: ['isAbnormal'] },
    { fields: ['orderStartTime'] }
  ]
})

module.exports = SettlementItem
