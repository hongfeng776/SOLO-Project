const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FlightPriceLog = sequelize.define('FlightPriceLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '价格日志ID'
  },
  priceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '价格配置ID'
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
  cabinClass: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '舱位等级'
  },
  operationType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '操作类型: 1-创建, 2-修改, 3-批量调整, 4-动态定价, 5-恢复基准价, 6-停用, 7-启用'
  },
  operationName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '操作名称'
  },
  beforePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '调整前价格'
  },
  afterPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '调整后价格'
  },
  beforeDiscount: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: '调整前折扣'
  },
  afterDiscount: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: '调整后折扣'
  },
  beforeTax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '调整前税费'
  },
  afterTax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '调整后税费'
  },
  priceChangeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '价格变动金额'
  },
  priceChangePercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: '价格变动幅度(%)'
  },
  changeFields: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更字段列表(JSON)'
  },
  dynamicRuleData: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '动态定价规则数据(JSON)'
  },
  effectScope: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '生效范围描述'
  },
  affectedFlightCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '受影响航班数量(批量操作时)'
  },
  affectedOrderCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '受影响订单数量'
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
    comment: '操作备注/调整原因'
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
  createdAt: {
    type: DataTypes.DATE,
    comment: '创建时间'
  }
}, {
  tableName: 'flight_price_logs',
  comment: '机票价格调整日志表',
  timestamps: false,
  indexes: [
    { fields: ['priceId'] },
    { fields: ['flightId'] },
    { fields: ['flightNo'] },
    { fields: ['cabinClass'] },
    { fields: ['operationType'] },
    { fields: ['operatorId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = FlightPriceLog;
