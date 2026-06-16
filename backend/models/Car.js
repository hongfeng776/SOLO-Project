const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Merchant = require('./Merchant');

const Car = sequelize.define('Car', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '租车ID'
  },
  brand: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '品牌'
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '型号'
  },
  plateNo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '车牌号'
  },
  pricePerDay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '日租价格'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 1-可租, 0-已租出'
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
  tableName: 'cars',
  comment: '租车表'
});

Car.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Merchant.hasMany(Car, { foreignKey: 'merchantId', as: 'cars' });

module.exports = Car;
