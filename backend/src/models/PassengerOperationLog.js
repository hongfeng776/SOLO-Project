const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PassengerOperationLog = sequelize.define('PassengerOperationLog', {
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
  operationType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '操作类型：1修改手机号 2修改实名 3修改地址 4修改密码 5绑定微信 6绑定支付宝'
  },
  beforeValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '修改前值'
  },
  afterValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '修改后值'
  },
  operatorType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '操作人类型：1用户自己 2管理员 3系统'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '操作人ID'
  },
  ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作IP'
  },
  deviceInfo: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '设备信息'
  },
  riskLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '风险等级：1低 2中 3高'
  },
  isBlocked: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否被拦截：0否 1是'
  },
  blockReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '拦截原因'
  },
  verifyResult: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '核验结果'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'biz_passenger_operation_log',
  comment: '乘客操作溯源表',
  indexes: [
    { fields: ['passengerId'] },
    { fields: ['operationType'] },
    { fields: ['operatorType'] },
    { fields: ['riskLevel'] },
    { fields: ['isBlocked'] },
    { fields: ['ip'] },
    { fields: ['createTime'] }
  ]
})

module.exports = PassengerOperationLog
