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
    comment: '总库存基数'
  },
  soldStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '已售库存'
  },
  reservedStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '预留库存数量'
  },
  lockedStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '锁定库存数量'
  },
  availableStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '可售库存 = 总库存 - 已售 - 预留 - 锁定'
  },
  reservedRatio: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    comment: '预留比例(%)，预留库存占总库存的比例'
  },
  minStockWarning: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: '最低库存预警值'
  },
  maxStockLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 500,
    comment: '最大库存上限'
  },
  reserveExpireTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '预留库存到期时间'
  },
  isAutoRelease: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否自动释放预留库存: 0-否, 1-是'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '库存状态: 0-停用, 1-正常, 2-预警, 3-售罄'
  },
  inventorySource: {
    type: DataTypes.STRING(50),
    defaultValue: 'manual',
    comment: '库存来源: manual-手动录入, system-系统生成, batch-批量导入, api-API同步'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
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
  lastSyncTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后同步时间'
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
  comment: '机票库存表',
  indexes: [
    { fields: ['flightId'] },
    { fields: ['flightNo'] },
    { fields: ['cabinClass'] },
    { fields: ['inventoryType'] },
    { fields: ['status'] },
    { fields: ['availableStock'] },
    { fields: ['reserveExpireTime'] },
    { unique: true, fields: ['flightId', 'cabinClass', 'inventoryType'] }
  ]
});

FlightInventory.belongsTo(Flight, { foreignKey: 'flightId', as: 'flight' });
Flight.hasMany(FlightInventory, { foreignKey: 'flightId', as: 'inventories' });

module.exports = FlightInventory;
