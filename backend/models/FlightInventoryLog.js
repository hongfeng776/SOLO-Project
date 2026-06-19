const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FlightInventoryLog = sequelize.define('FlightInventoryLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '库存日志ID'
  },
  inventoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '库存配置ID'
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
  inventoryType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '库存类型'
  },
  operationType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '操作类型: 1-创建库存, 2-调整库存, 3-占用库存(下单), 4-释放库存(取消), 5-售出库存(支付), 6-锁定库存, 7-解锁库存, 8-预留库存, 9-释放预留, 10-补录库存, 11-批量调整, 12-库存预警'
  },
  operationName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '操作名称'
  },
  operationCategory: {
    type: DataTypes.STRING(50),
    defaultValue: 'adjust',
    comment: '操作分类: create-创建, adjust-调整, occupy-占用, release-释放, lock-锁定, unlock-解锁, reserve-预留, supplement-补录, batch-批量, warning-预警'
  },
  beforeTotalStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整前总库存'
  },
  afterTotalStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整后总库存'
  },
  beforeOccupiedStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整前占用库存'
  },
  afterOccupiedStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整后占用库存'
  },
  beforeSoldStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整前已售库存'
  },
  afterSoldStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整后已售库存'
  },
  beforeReservedStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整前预留库存'
  },
  afterReservedStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整后预留库存'
  },
  beforeLockedStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整前锁定库存'
  },
  afterLockedStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整后锁定库存'
  },
  beforeAvailableStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整前可用库存'
  },
  afterAvailableStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '调整后可用库存'
  },
  changeQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '变动数量'
  },
  changeDirection: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '变动方向: increase-增加, decrease-减少'
  },
  changeFields: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更字段列表(JSON)'
  },
  relatedOrderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联订单ID'
  },
  relatedOrderNo: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '关联订单号'
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
  isBatchOperation: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否批量操作: 0-否, 1-是'
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
    comment: '操作备注/原因'
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
  tableName: 'flight_inventory_logs',
  comment: '机票库存台账日志表',
  timestamps: false,
  indexes: [
    { fields: ['inventoryId'] },
    { fields: ['flightId'] },
    { fields: ['flightNo'] },
    { fields: ['cabinClass'] },
    { fields: ['inventoryType'] },
    { fields: ['operationType'] },
    { fields: ['operationCategory'] },
    { fields: ['operatorId'] },
    { fields: ['relatedOrderId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = FlightInventoryLog;
