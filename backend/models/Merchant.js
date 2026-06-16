const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Merchant = sequelize.define('Merchant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '商家ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商家名称'
  },
  contact: {
    type: DataTypes.STRING(50),
    comment: '联系人'
  },
  phone: {
    type: DataTypes.STRING(20),
    comment: '联系电话'
  },
  address: {
    type: DataTypes.STRING(255),
    comment: '地址'
  },
  auditStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '审核状态: 0-待审核, 1-已通过, 2-已拒绝'
  },
  businessLicense: {
    type: DataTypes.STRING(255),
    comment: '营业执照图片URL'
  }
}, {
  tableName: 'merchants',
  comment: '商家表'
});

module.exports = Merchant;
