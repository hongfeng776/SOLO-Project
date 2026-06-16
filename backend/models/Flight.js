const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Flight = sequelize.define('Flight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '机票ID'
  },
  flightNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '航班号'
  },
  airline: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '航空公司'
  },
  departure: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '出发地'
  },
  arrival: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '目的地'
  },
  departureTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '出发时间'
  },
  arrivalTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '到达时间'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '价格'
  },
  seats: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '剩余座位数'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 1-在售, 0-下架'
  }
}, {
  tableName: 'flights',
  comment: '机票表'
});

module.exports = Flight;
