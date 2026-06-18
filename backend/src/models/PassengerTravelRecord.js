const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PassengerTravelRecord = sequelize.define('PassengerTravelRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  passengerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '乘客ID'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '订单号'
  },
  travelDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '出行日期'
  },
  travelTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '出行时间'
  },
  departureCity: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '出发城市'
  },
  departureAddress: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '出发地址'
  },
  departureLng: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: '出发经度'
  },
  departureLat: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: '出发纬度'
  },
  arrivalCity: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '到达城市'
  },
  arrivalAddress: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '到达地址'
  },
  arrivalLng: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: '到达经度'
  },
  arrivalLat: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: '到达纬度'
  },
  vehicleType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '车型：1快车 2专车 3豪华车 4拼车 5出租车'
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
  vehiclePlate: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '车牌号'
  },
  distance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '行驶距离(公里)'
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '行驶时长(分钟)'
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '原价'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '优惠金额'
  },
  actualAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '实付金额'
  },
  couponId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '使用优惠券ID'
  },
  orderStatus: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '订单状态：1待接单 2已派单 3接驾中 4行程中 5已完成 6已取消 7已过期'
  },
  cancelReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '取消原因'
  },
  cancelRole: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '取消方：1乘客 2司机 3系统'
  },
  isPassengerLate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '乘客是否迟到'
  },
  lateMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '迟到分钟数'
  },
  hasComplaint: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否有投诉'
  },
  complaintType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '投诉类型'
  },
  isMaliciousComplaint: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否恶意投诉'
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    comment: '乘客评分：1-5'
  },
  reviewContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '评价内容'
  },
  travelTrack: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '行驶轨迹点列表'
  },
  behaviorTags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '行为标签'
  },
  isAbnormal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否异常订单'
  },
  abnormalType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '异常类型：fraud_brush-恶意刷单 frequent_cancel-频繁取消 fake_complaint-虚假投诉'
  }
}, {
  tableName: 'biz_passenger_travel_record',
  comment: '乘客出行记录表',
  indexes: [
    { fields: ['passengerId'] },
    { fields: ['orderId'] },
    { fields: ['orderNo'] },
    { fields: ['travelDate'] },
    { fields: ['departureCity'] },
    { fields: ['arrivalCity'] },
    { fields: ['vehicleType'] },
    { fields: ['orderStatus'] },
    { fields: ['isAbnormal'] },
    { fields: ['createTime'] }
  ]
})

module.exports = PassengerTravelRecord
