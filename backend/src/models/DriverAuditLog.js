const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const DriverAuditLog = sequelize.define('DriverAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '司机ID'
  },
  operationType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '操作类型：1资料提交 2资料修改 3审核通过 4审核驳回 5资料复核 6加急审核 7提醒补全 8资质过期'
  },
  operationTypeName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作类型名称'
  },
  oldStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更前审核状态'
  },
  newStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更后审核状态'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '操作备注'
  },
  qualificationCheck: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '资质校验详情'
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
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '操作时间'
  }
}, {
  tableName: 'biz_driver_audit_log',
  comment: '司机审核记录表',
  indexes: [
    { fields: ['driverId'] },
    { fields: ['operationType'] },
    { fields: ['createTime'] }
  ]
})

module.exports = DriverAuditLog
