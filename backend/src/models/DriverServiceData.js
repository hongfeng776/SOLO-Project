const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const DriverServiceData = sequelize.define('DriverServiceData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '司机ID'
  },
  statDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '统计日期'
  },
  statType: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '统计类型：1日 2周 3月'
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '接单量'
  },
  completedOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '完单量'
  },
  completionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100,
    comment: '完单率（%）'
  },
  cancelledOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '取消订单数'
  },
  complaintCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '投诉数'
  },
  complaintRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '投诉率（%）'
  },
  serviceScore: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.0,
    comment: '服务评分'
  },
  totalIncome: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '总收入'
  },
  onlineHours: {
    type: DataTypes.DECIMAL(5, 1),
    defaultValue: 0,
    comment: '在线时长（小时）'
  },
  orderAcceptRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100,
    comment: '接单率（%）'
  },
  avgOrderAmount: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    comment: '平均客单价'
  },
  mileage: {
    type: DataTypes.DECIMAL(8, 1),
    defaultValue: 0,
    comment: '行驶里程（公里）'
  },
  driverLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '司机等级：1优质 2普通 3待整改 4劣质'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常数据：0否 1是'
  },
  abnormalType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '异常类型：abnormal_score评分异常 abnormal_completion完单异常 abnormal_complaint投诉异常'
  },
  abnormalReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '异常原因'
  },
  dataSources: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '数据来源详情'
  },
  trafficWeight: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 1.0,
    comment: '流量权重'
  },
  subsidyLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '补贴等级：1高补贴 2正常补贴 3无补贴'
  },
  orderPriority: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '接单优先级：1最高 2较高 3普通 4较低'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updateTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  tableName: 'biz_driver_service_data',
  comment: '司机服务数据统计表',
  indexes: [
    { fields: ['driverId'] },
    { fields: ['statDate'] },
    { fields: ['statType'] },
    { fields: ['driverLevel'] },
    { fields: ['serviceScore'] },
    { fields: ['isAbnormal'] },
    { unique: true, fields: ['driverId', 'statDate', 'statType'] }
  ]
})

module.exports = DriverServiceData
