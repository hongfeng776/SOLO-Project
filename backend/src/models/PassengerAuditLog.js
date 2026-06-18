const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PassengerAuditLog = sequelize.define('PassengerAuditLog', {
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
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人姓名'
  },
  operationType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '操作类型：1信息修改 2实名审核 3绑定变更 4等级变更 5标签变更 6风险标记 7状态变更'
  },
  beforeData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '修改前数据'
  },
  afterData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '修改后数据'
  },
  changeReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '变更原因'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1成功 0失败'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'biz_passenger_audit_log',
  comment: '乘客审核日志表',
  indexes: [
    { fields: ['passengerId'] },
    { fields: ['operatorId'] },
    { fields: ['operationType'] },
    { fields: ['status'] },
    { fields: ['createTime'] }
  ]
})

module.exports = PassengerAuditLog
