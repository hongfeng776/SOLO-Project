const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PassengerTravelTrace = sequelize.define('PassengerTravelTrace', {
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
  traceType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '溯源类型：1订单详情 2行为轨迹 3操作记录 4评价内容 5支付记录 6投诉记录'
  },
  operatorType: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '操作方：1乘客 2司机 3系统 4客服 5运营'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人姓名'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '操作动作'
  },
  actionDetail: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '操作详情'
  },
  beforeData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '操作前数据'
  },
  afterData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '操作后数据'
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'IP地址'
  },
  deviceInfo: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '设备信息'
  },
  locationInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '位置信息：{lng, lat, city, address}'
  },
  tracePoints: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '轨迹点列表：[{lng, lat, timestamp, speed}]'
  },
  isRiskOperation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否风险操作'
  },
  riskFlag: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '风险标记'
  },
  riskDescription: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '风险描述'
  },
  verifyStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '校验状态：0未校验 1校验通过 2校验异常'
  },
  verifyDetail: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '校验详情'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'biz_passenger_travel_trace',
  comment: '乘客出行行为溯源表',
  indexes: [
    { fields: ['passengerId'] },
    { fields: ['orderId'] },
    { fields: ['orderNo'] },
    { fields: ['traceType'] },
    { fields: ['isRiskOperation'] },
    { fields: ['createTime'] }
  ]
})

module.exports = PassengerTravelTrace
