const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plateNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '车牌号'
  },
  brand: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '品牌'
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '型号'
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '颜色'
  },
  capacityType: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '运力类型：1快车 2专车 3豪华车 4拼车 5出租车'
  },
  seats: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: '座位数'
  },
  vehicleImg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '车辆照片'
  },
  registrationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '注册日期'
  },
  inspectionDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '年检有效期'
  },
  insuranceDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '保险有效期'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0空闲 1运营中 2维修中 3已报废'
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
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '绑定司机ID'
  },
  driverName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '绑定司机姓名'
  }
}, {
  tableName: 'biz_vehicle',
  comment: '车辆表',
  indexes: [
    { fields: ['plateNumber'] },
    { fields: ['status'] },
    { fields: ['auditStatus'] },
    { fields: ['capacityType'] }
  ]
})

module.exports = Vehicle
