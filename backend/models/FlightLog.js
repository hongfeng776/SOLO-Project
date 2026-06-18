const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FlightLog = sequelize.define('FlightLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  flightId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '航班ID'
  },
  flightNo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '航班号'
  },
  operationType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '操作类型: 1-创建, 2-修改, 3-上架, 4-下架, 5-状态变更(延误/取消), 6-批量操作, 7-删除, 8-资质变更, 9-库存调整'
  },
  operationName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '操作名称'
  },
  beforeData: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更前数据(JSON)'
  },
  afterData: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更后数据(JSON)'
  },
  changedFields: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更字段列表(JSON)'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '操作人姓名'
  },
  operatorRole: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '操作人角色'
  },
  operationRemark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '操作备注'
  },
  operationStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '操作状态: 1-成功, 0-失败'
  },
  failReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '失败原因'
  },
  operationIp: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作IP'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '操作UA'
  },
  createdAt: {
    type: DataTypes.DATE,
    comment: '创建时间'
  }
}, {
  tableName: 'flight_logs',
  comment: '航班操作日志表',
  timestamps: false,
  indexes: [
    { fields: ['flightId'] },
    { fields: ['operationType'] },
    { fields: ['operatorId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = FlightLog;
