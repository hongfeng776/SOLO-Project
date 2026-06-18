const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PassengerTravelRisk = sequelize.define('PassengerTravelRisk', {
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
  riskType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '风险类型：fraud_brush-恶意刷单 frequent_cancel-频繁取消 fake_complaint-虚假投诉 late-频繁迟到 abnormal_route-异常路线'
  },
  riskLevel: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '风险等级：1低 2中 3高 4严重'
  },
  riskScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '风险分值'
  },
  relatedOrderIds: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '关联订单ID列表'
  },
  relatedOrderNos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '关联订单号列表'
  },
  triggerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '触发次数'
  },
  detectionDetail: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '检测详情：包含检测规则、阈值、实际值等'
  },
  evidenceData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '证据数据'
  },
  restrictionActions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '限制措施：[{action, duration, startTime, endTime}]'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0待处理 1处理中 2已处理 3已解除 4已忽略'
  },
  handlerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '处理人ID'
  },
  handlerName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '处理人姓名'
  },
  handleResult: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '处理结果'
  },
  handleTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处理时间'
  },
  reportPath: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '风险报告文件路径'
  },
  firstDetectTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '首次检测时间'
  },
  lastDetectTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最近检测时间'
  },
  expireTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '风险过期时间'
  }
}, {
  tableName: 'biz_passenger_travel_risk',
  comment: '乘客出行风险记录表',
  indexes: [
    { fields: ['passengerId'] },
    { fields: ['riskType'] },
    { fields: ['riskLevel'] },
    { fields: ['status'] },
    { fields: ['firstDetectTime'] },
    { fields: ['createTime'] }
  ]
})

module.exports = PassengerTravelRisk
