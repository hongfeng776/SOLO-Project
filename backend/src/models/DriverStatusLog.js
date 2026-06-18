const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const DriverStatusLog = sequelize.define('DriverStatusLog', {
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
    comment: '操作类型：1状态修改 2批量状态修改 3自动判定 4异常拦截 5解封操作'
  },
  operationTypeName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作类型名称'
  },
  oldStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更前账号状态：0正常 1限制接单 2临时封禁 3永久封禁'
  },
  newStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更后账号状态：0正常 1限制接单 2临时封禁 3永久封禁'
  },
  oldRiskLevel: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更前风险等级'
  },
  newRiskLevel: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更后风险等级'
  },
  changeReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '变更原因'
  },
  preCheckResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '前置校验结果'
  },
  permissionChanges: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '权限变更详情'
  },
  effectiveTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '生效时间'
  },
  expireTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '失效时间（临时封禁）'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常操作：0否 1是'
  },
  abnormalReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '异常原因'
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
  operatorRole: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人角色'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'biz_driver_status_log',
  comment: '司机账号状态变更日志表',
  indexes: [
    { fields: ['driverId'] },
    { fields: ['operationType'] },
    { fields: ['oldStatus'] },
    { fields: ['newStatus'] },
    { fields: ['isAbnormal'] },
    { fields: ['createTime'] }
  ]
})

module.exports = DriverStatusLog
