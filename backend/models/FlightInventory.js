const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Flight = require('./Flight');

const FlightInventory = sequelize.define('FlightInventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '库存ID'
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
    comment: '舱位等级: economy-经济舱, business-商务舱, first-头等舱, special-特惠舱'
  },
  inventoryType: {
    type: DataTypes.STRING(50),
    defaultValue: 'fixed',
    comment: '库存类型: fixed-固定库存, dynamic-动态库存, reserved-预留库存, supplement-补录库存'
  },
  totalStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总库存数'
  },
  occupiedStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已占用库存（已下单未支付）'
  },
  soldStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已售出库存（已支付）'
  },
  reservedStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '预留库存'
  },
  lockedStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '锁定库存'
  },
  availableStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '可用库存（总库存 - 已占用 - 已售出 - 预留 - 锁定）'
  },
  reserveRatio: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    comment: '预留比例(%)'
  },
  reserveExpireTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '预留库存到期时间'
  },
  isLocked: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否锁定: 0-否, 1-是'
  },
  lockReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '锁定原因'
  },
  lockTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '锁定时间'
  },
  unlockTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '解锁时间'
  },
  isActive: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否启用: 0-停用, 1-启用'
  },
  inventoryStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '库存状态: 1-充足, 2-紧张, 3-即将售罄, 4-已售罄'
  },
  lowStockThreshold: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: '低库存预警阈值'
  },
  soldOutThreshold: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    comment: '即将售罄阈值'
  },
  supplementSource: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '补录库存来源'
  },
  supplementRemark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '补录备注'
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
  createdAt: {
    type: DataTypes.DATE,
    comment: '创建时间'
  },
  updatedAt: {
    type: DataTypes.DATE,
    comment: '更新时间'
  }
}, {
  tableName: 'flight_inventories',
  comment: '机票库存配置表',
  indexes: [
    { fields: ['flightId'] },
    { fields: ['flightNo'] },
    { fields: ['cabinClass'] },
    { fields: ['inventoryType'] },
    { fields: ['inventoryStatus'] },
    { fields: ['isActive'] },
    { fields: ['isLocked'] },
    { fields: ['reserveExpireTime'] },
    { unique: true, fields: ['flightId', 'cabinClass', 'inventoryType'] }
  ]
});

FlightInventory.belongsTo(Flight, { foreignKey: 'flightId', as: 'flight' });
Flight.hasMany(FlightInventory, { foreignKey: 'flightId', as: 'inventories' });

module.exports = FlightInventory;
