const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Flight = require('./Flight');

const FlightPrice = sequelize.define('FlightPrice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '价格配置ID'
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
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '基准票价'
  },
  currentPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '当前售价'
  },
  discount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100.00,
    comment: '折扣比例(%)，100表示不打折'
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    comment: '税费比例(%)'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: '税费金额'
  },
  surcharge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: '附加费(机场建设费、燃油费等)'
  },
  premiumLimit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: '溢价上限，超过此价格将被拦截'
  },
  minDiscount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    comment: '最低折扣限制(%)，禁止低于此折扣'
  },
  effectiveStartTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '价格生效开始时间'
  },
  effectiveEndTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '价格生效结束时间'
  },
  isDynamicPricing: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否启用动态定价: 0-否, 1-是'
  },
  dynamicRuleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '动态定价规则ID'
  },
  priceSource: {
    type: DataTypes.STRING(50),
    defaultValue: 'manual',
    comment: '价格来源: manual-手动配置, dynamic-动态定价, batch-批量调整, import-批量导入'
  },
  priceReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '价格调整原因'
  },
  isActive: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否生效: 0-未生效, 1-已生效'
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
  tableName: 'flight_prices',
  comment: '机票价格配置表',
  indexes: [
    { fields: ['flightId'] },
    { fields: ['flightNo'] },
    { fields: ['cabinClass'] },
    { fields: ['isActive'] },
    { fields: ['effectiveStartTime', 'effectiveEndTime'] },
    { unique: true, fields: ['flightId', 'cabinClass', 'effectiveStartTime'] }
  ]
});

FlightPrice.belongsTo(Flight, { foreignKey: 'flightId', as: 'flight' });
Flight.hasMany(FlightPrice, { foreignKey: 'flightId', as: 'prices' });

module.exports = FlightPrice;
