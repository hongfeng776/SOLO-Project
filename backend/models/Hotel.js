const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Merchant = require('./Merchant');

const Hotel = sequelize.define('Hotel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '酒店ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '酒店名称'
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '地址'
  },
  star: {
    type: DataTypes.TINYINT,
    comment: '星级: 1-5'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '价格'
  },
  rooms: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '剩余房间数'
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
  tableName: 'hotels',
  comment: '酒店表'
});

Hotel.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Merchant.hasMany(Hotel, { foreignKey: 'merchantId', as: 'hotels' });

module.exports = Hotel;
