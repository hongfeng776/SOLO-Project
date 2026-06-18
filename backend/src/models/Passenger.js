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
    comment: '取消订单次数'
  },
  cancelRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '取消率：百分比'
  },
  lateCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '迟到次数'
  },
  complaintCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '投诉次数'
  },
  maliciousComplaintCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '恶意投诉次数'
  },
  travelRiskLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '出行风险等级：1正常 2关注 3预警 4限制 5封禁'
  },
  travelRiskScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '出行风险评分：0-100，越高风险越大'
  },
  riskRestrictions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '风险限制权益：{canOrder, canUseCoupon, canPriority, canDiscount}'
  },
  lastRiskAssessTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最近风险评估时间'
  },
  activityLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '活跃度等级：1沉睡 2低频 3中频 4高频 5活跃'
  },
  spendLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '消费层级：1低 2中 3高 4VIP'
  },
  avgOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '平均订单金额'
  },
  frequentCities: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '常出行城市列表'
  },
  preferredVehicleTypes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '偏好车型列表'
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
