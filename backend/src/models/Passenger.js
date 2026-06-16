const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Passenger = sequelize.define('Passenger', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '昵称'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '手机号码'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像'
  },
  gender: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '性别：0未知 1男 2女'
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总订单数'
  },
  totalSpend: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '总消费'
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '账户余额'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.0,
    comment: '评分'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1正常 0禁用'
  },
  registerTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '注册时间'
  }
}, {
  tableName: 'biz_passenger',
  comment: '乘客表',
  indexes: [
    { fields: ['phone'] },
    { fields: ['status'] }
  ]
})

module.exports = Passenger
