const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Flight = require('./Flight');
const FlightInventory = require('./FlightInventory');

const FlightInventoryLog = sequelize.define('FlightInventoryLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  inventoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '库存ID',
    references: {
      model: FlightInventory,
      key: 'id'
    }
  },
  flightId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '航班ID',
    references: {
      model: Flight,
      key: 'id'
    }
  },
  flightNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '航班号'
  },
  cabinClass: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '舱位等级'
  },
  inventoryType: {
    type: DataTypes.STRING(50),
    comment: '库存类型'
  },
  operationType: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '操作类型: 1-创建库存, 2-库存调整, 3-库存占用, 4-库存释放, 5-库存锁定, 6-库存解锁, 7-预留库存, 8-释放预留, 9-库存补录, 10-批量操作, 11-状态变更, 12-删除库存'
  },
  operationName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作名称'
  },
  beforeTotalStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '操作前总库存'
  },
  afterTotalStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '操作后总库存'
  },
  beforeSoldStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '操作前已售库存'
  },
  afterSoldStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '操作后已售库存'
  },
  beforeReservedStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '操作前预留库存'
  },
  afterReservedStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '操作后预留库存'
  },
  beforeLockedStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '操作前锁定库存'
  },
  afterLockedStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '操作后锁定库存'
  },
  beforeAvailableStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '操作前可售库存'
  },
  afterAvailableStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '操作后可售库存'
  },
  changeQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '变动数量，正数为增加，负数为减少'
  },
  changeType: {
    type: DataTypes.STRING(20),
    comment: '变动方向: increase-增加, decrease-减少, unchanged-不变'
  },
  changeFields: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '变更字段，JSON数组'
  },
  relatedOrderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联订单ID'
  },
  relatedOrderNo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '关联订单号'
  },
  effectScope: {
    type: DataTypes.STRING(100),
    comment: '生效范围: single-单条, batch-批量, global-全局'
  },
  affectedInventoryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '影响库存数量（批量操作）'
  },
  operationReason: {
    type: DataTypes.STRING(500),
    comment: '操作原因'
  },
  operationRemark: {
    type: DataTypes.STRING(500),
    comment: '操作备注'
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
    type: DataTypes.STRING(50),
    comment: '操作人角色'
  },
  operationIp: {
    type: DataTypes.STRING(50),
    comment: '操作IP'
  },
  operationStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '操作状态: 1-成功, 0-失败'
  },
  failReason: {
    type: DataTypes.STRING(500),
    comment: '失败原因'
  },
  createdAt: {
    type: DataTypes.DATE,
    comment: '创建时间'
  }
}, {
  tableName: 'flight_inventory_logs',
  comment: '机票库存操作日志表',
  indexes: [
    { fields: ['inventoryId'] },
    { fields: ['flightId'] },
    { fields: ['flightNo'] },
    { fields: ['cabinClass'] },
    { fields: ['inventoryType'] },
    { fields: ['operationType'] },
    { fields: ['operatorId'] },
    { fields: ['createdAt'] },
    { fields: ['relatedOrderId'] }
  ]
});

FlightInventoryLog.belongsTo(FlightInventory, { foreignKey: 'inventoryId', as: 'inventory' });
FlightInventoryLog.belongsTo(Flight, { foreignKey: 'flightId', as: 'flight' });
FlightInventory.hasMany(FlightInventoryLog, { foreignKey: 'inventoryId', as: 'logs' });

module.exports = FlightInventoryLog;
