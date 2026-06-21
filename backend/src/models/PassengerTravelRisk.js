const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PassengerTravelRisk = sequelize.define('PassengerTravelRisk', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  passengerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '乘客ID'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: true,
    comment: '关联订单号'
  },
  riskType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '风险类型：1恶意刷单 2频繁取消 3虚假投诉 4迟到爽约 5异常行为'
  },
  riskLevel: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '风险等级：1低 2中 3高 4严重'
  },
  riskScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '风险扣分'
  },
  evidence: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '风险证据数据'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '风险描述'
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已拦截'
  },
  blockReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '拦截原因'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '处理状态：0待处理 1已确认 2已忽略 3已申诉'
  },
  handlerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '处理人ID'
  },
  handlerName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '处理人姓名'
  },
  handleRemark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '处理备注'
  },
  handleTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处理时间'
  },
  triggeredRestrictions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '触发的限制措施'
  }
}, {
  tableName: 'biz_passenger_travel_risk',
  comment: '乘客出行风险记录表',
  indexes: [
    { fields: ['passengerId'] },
    { fields: ['orderId'] },
    { fields: ['riskType'] },
    { fields: ['riskLevel'] },
    { fields: ['status'] },
    { fields: ['createTime'] }
  ]
})

module.exports = PassengerTravelRisk
