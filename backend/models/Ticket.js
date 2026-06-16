const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Merchant = require('./Merchant');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '票务ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '票名'
  },
  scenicSpot: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '景点名称'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '价格'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '库存'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 1-在售, 0-下架'
  },
  merchantId: {
    type: DataTypes.INTEGER,
    references: {
      model: Merchant,
      key: 'id'
    },
    comment: '商家ID'
  }
}, {
  tableName: 'tickets',
  comment: '文旅票务表'
});

Ticket.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Merchant.hasMany(Ticket, { foreignKey: 'merchantId', as: 'tickets' });

module.exports = Ticket;
