const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Passenger = sequelize.define('Passenger', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '昵称'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '手机号码'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像'
  },
  gender: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '性别：0未知 1男 2女'
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总订单数'
  },
  totalSpend: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '总消费'
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '账户余额'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.0,
    comment: '评分'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1正常 0禁用'
  },
  registerTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '注册时间'
  },
  realName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '真实姓名'
  },
  idCard: {
    type: DataTypes.STRING(18),
    allowNull: true,
    comment: '身份证号'
  },
  idCardFront: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '身份证正面照'
  },
  idCardBack: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '身份证反面照'
  },
  realNameStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '实名状态：0未实名 1审核中 2已实名 3实名失败'
  },
  realNameTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '实名时间'
  },
  realNameExpireTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '实名过期时间'
  },
  province: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '省份'
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '城市'
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '区县'
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '详细地址'
  },
  zipCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '邮政编码'
  },
  level: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '用户等级：1普通 2银卡 3金卡 4铂金 5钻石'
  },
  levelScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '等级积分'
  },
  reputationScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100.00,
    comment: '信誉评分：0-100'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '用户标签'
  },
  securityLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '安全等级：1低 2中 3高'
  },
  isRisk: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否风险账号'
  },
  lastLoginTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  },
  lastLoginIp: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '最后登录IP'
  },
  registerChannel: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '注册渠道'
  },
  orderFrequency: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '近30天订单数'
  },
  cancelCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '累计取消订单数'
  },
  cancelRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '取消率(%)'
  },
  lateCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '累计迟到次数'
  },
  complaintCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '累计投诉次数'
  },
  maliciousComplaintCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '恶意投诉次数'
  },
  travelRiskLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '出行风险等级：1正常 2关注 3警告 4限制 5封禁'
  },
  travelRiskScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '出行风险评分：0-100，分数越高风险越大'
  },
  isOrderRestricted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否限制临时下单'
  },
  isPremiumDiscountRestricted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否限制溢价减免权益'
  },
  riskRestrictionStartTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '风险限制开始时间'
  },
  riskRestrictionEndTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '风险限制结束时间'
  },
  travelCity: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '常用出行城市'
  },
  activityLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '活跃度：1沉睡 2低 3中 4高 5非常活跃'
  },
  consumptionLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '消费层级：1低 2中 3高 4超高'
  },
  avgConsumptionPerOrder: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '单均消费金额'
  }
}, {
  tableName: 'biz_passenger',
  comment: '乘客表',
  indexes: [
    { fields: ['phone'] },
    { fields: ['status'] }
  ]
})

module.exports = Passenger
