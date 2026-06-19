const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const VehicleStatusLog = sequelize.define('VehicleStatusLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '车辆ID'
  },
  plateNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '车牌号'
  },
  changeType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '变更类型：1运营状态变更 2检修状态变更 3违规状态变更 4封禁状态变更 5预警触发 6异常拦截 7自动状态判定'
  },
  oldOperationStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '原运营状态'
  },
  newOperationStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '新运营状态'
  },
  oldStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '原车辆状态'
  },
  newStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '新车辆状态'
  },
  triggerType: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    allowNull: true,
    comment: '触发类型：1手动操作 2系统自动 3定时任务 4阈值触发'
  },
  triggerReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '触发原因'
  },
  validationResults: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '校验结果'
  },
  maintenanceCheck: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '检修记录校验'
  },
  documentCheck: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '证件时效校验'
  },
  violationCheck: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '违规状态校验'
  },
  capacityImpact: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '运力影响数据'
  },
  scheduleImpact: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '排班影响数据'
  },
  alertLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
    comment: '告警等级：0无 1提示 2警告 3严重'
  },
  alertMessage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '告警消息'
  },
  isAnomaly: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
    comment: '是否异常：0否 1是'
  },
  anomalyType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '异常类型：violation_online/sick_operation/status_fluctuation'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
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
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作IP地址'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'biz_vehicle_status_log',
  comment: '车辆运营状态变更日志表',
  indexes: [
    { fields: ['vehicleId'] },
    { fields: ['changeType'] },
    { fields: ['triggerType'] },
    { fields: ['alertLevel'] },
    { fields: ['isAnomaly'] },
    { fields: ['createTime'] }
  ]
})

module.exports = VehicleStatusLog
