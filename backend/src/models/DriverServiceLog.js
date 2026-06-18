const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const DriverServiceLog = sequelize.define('DriverServiceLog', {
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
  statDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '统计日期'
  },
  operationType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '操作类型：1数据更新 2等级变更 3数据修正 4异常检测 5数据导出'
  },
  operationTypeName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作类型名称'
  },
  dataField: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '变更字段'
  },
  oldValue: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '变更前值'
  },
  newValue: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '变更后值'
  },
  dataSource: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '数据来源'
  },
  statisticBasis: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '统计依据'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常：0否 1是'
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
  missingDataSource: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '缺失数据源'
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
  tableName: 'biz_driver_service_log',
  comment: '司机服务数据变更日志表',
  indexes: [
    { fields: ['driverId'] },
    { fields: ['statDate'] },
    { fields: ['operationType'] },
    { fields: ['isAbnormal'] },
    { fields: ['createTime'] }
  ]
})

module.exports = DriverServiceLog
