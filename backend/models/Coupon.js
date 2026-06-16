const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '优惠券ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '优惠券名称'
  },
  code: {
    type: DataTypes.STRING(50),
    unique: true,
    comment: '券码'
  },
  type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '类型: 1-满减, 2-折扣, 3-立减'
  },
  category: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '适用品类: flight/hotel/car/ticket/all'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '面额/折扣'
  },
  minAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '最低消费'
  },
  totalStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总库存'
  },
  usedStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已使用'
  },
  remainStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '剩余库存'
  },
  startTime: {
    type: DataTypes.DATE,
    comment: '有效期开始'
  },
  endTime: {
    type: DataTypes.DATE,
    comment: '有效期结束'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态: 0-未开始, 1-进行中, 2-已结束, 3-已作废'
  }
}, {
  tableName: 'coupons',
  comment: '优惠券表',
  timestamps: true,
  paranoid: true
});

module.exports = Coupon;
