const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '订单号'
  },
  passengerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '乘客ID'
  },
  passengerName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '乘客姓名'
  },
  passengerPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '乘客电话'
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '司机ID'
  },
  driverName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '司机姓名'
  },
  driverPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '司机电话'
  },
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '车辆ID'
  },
  vehiclePlate: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '车牌号'
  },
  capacityType: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '运力类型：1快车 2专车 3豪华车 4拼车 5出租车'
  },
  startAddress: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '起点地址'
  },
  startLng: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: '起点经度'
  },
  startLat: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: '起点纬度'
  },
  endAddress: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '终点地址'
  },
  endLng: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: '终点经度'
  },
  endLat: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: '终点纬度'
  },
  distance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '距离(公里)'
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '预计时长(分钟)'
  },
  estimatedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '预估价格'
  },
  actualPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '实际价格'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1待接单 2已派单 3接驾中 4行程中 5已完成 6已取消 7已过期'
  },
  acceptTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '接单时间'
  },
  pickupTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '接驾时间'
  },
  completeTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '完成时间'
  },
  cancelTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '取消时间'
  },
  cancelReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '取消原因'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'biz_order',
  comment: '订单表',
  indexes: [
    { fields: ['orderNo'] },
    { fields: ['passengerId'] },
    { fields: ['driverId'] },
    { fields: ['status'] },
    { fields: ['createTime'] }
  ]
})

module.exports = Order
