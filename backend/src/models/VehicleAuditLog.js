const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const VehicleAuditLog = sequelize.define('VehicleAuditLog', {
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
  operationType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '操作类型：1新增备案 2修改备案 3审核通过 4审核驳回 5批量复核 6标记过期 7车辆锁定 8车辆解锁 9资料复核 10虚假备案拦截 11重复备案拦截 12证件造假拦截'
  },
  operationTypeName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作类型名称'
  },
  oldAuditStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更前审核状态'
  },
  newAuditStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更后审核状态'
  },
  oldStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更前运营状态'
  },
  newStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更后运营状态'
  },
  oldOperationLevel: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更前运营等级'
  },
  newOperationLevel: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更后运营等级'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '操作备注'
  },
  validationResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '校验结果详情'
  },
  changedFields: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '变更字段详情'
  },
  riskLevel: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '风险等级'
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
  tableName: 'biz_vehicle_audit_log',
  comment: '车辆审核记录表',
  indexes: [
    { fields: ['vehicleId'] },
    { fields: ['plateNumber'] },
    { fields: ['operationType'] },
    { fields: ['createTime'] },
    { fields: ['operatorId'] }
  ]
})

module.exports = VehicleAuditLog
