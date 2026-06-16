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
  },
  violationLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '违规等级: 0-正常, 1-轻微, 2-一般, 3-严重'
  },
  violationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '违规次数'
  },
  lastViolationTime: {
    type: DataTypes.DATE,
    comment: '最近违规时间'
  },
  businessType: {
    type: DataTypes.STRING(20),
    comment: '业务类型: flight/hotel/car/ticket'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 0-禁用, 1-启用'
  },
  email: {
    type: DataTypes.STRING(100),
    comment: '邮箱'
  },
  scope: {
    type: DataTypes.STRING(255),
    comment: '经营范围'
  },
  settledAt: {
    type: DataTypes.DATE,
    comment: '入驻时间'
  }
}, {
  tableName: 'merchants',
  comment: '商家表',
  timestamps: true,
  paranoid: true
});

module.exports = Merchant;
