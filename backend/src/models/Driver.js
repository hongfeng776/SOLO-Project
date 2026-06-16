const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Driver = sequelize.define('Driver', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '司机姓名'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '手机号码'
  },
  idCard: {
    type: DataTypes.STRING(18),
    allowNull: true,
    comment: '身份证号'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像'
  },
  driverLicenseNo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '驾驶证号'
  },
  driverLicenseImg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '驾驶证照片'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0离线 1在线 2接单中 3已封禁'
  },
  auditStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '审核状态：0待审核 1已通过 2已拒绝'
  },
  auditRemark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '审核备注'
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总订单数'
  },
  totalIncome: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '总收入'
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
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '绑定车辆ID'
  },
  registerTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '注册时间'
  }
}, {
  tableName: 'biz_driver',
  comment: '司机表',
  indexes: [
    { fields: ['phone'] },
    { fields: ['status'] },
    { fields: ['auditStatus'] }
  ]
})

module.exports = Driver
