const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '优惠券名称'
  },
  code: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '券码'
  },
  type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '类型：1满减 2折扣 3立减'
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '优惠额度'
  },
  minAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '最低消费'
  },
  totalCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '发放总量'
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已使用数量'
  },
  perLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '每人限领'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '生效时间'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '失效时间'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1启用 0禁用'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '描述'
  }
}, {
  tableName: 'biz_coupon',
  comment: '优惠券表',
  indexes: [
    { fields: ['code'] },
    { fields: ['status'] },
    { fields: ['startTime'] }
  ]
})

module.exports = Coupon
