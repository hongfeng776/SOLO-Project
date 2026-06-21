const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PassengerBehaviorReport = sequelize.define('PassengerBehaviorReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reportNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '报告编号'
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
  reportType: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '报告类型：1自动生成 2手动生成'
  },
  triggerType: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '触发类型：1恶意刷单 2频繁取消 3虚假投诉 4综合异常'
  },
  periodStart: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '统计周期开始'
  },
  periodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '统计周期结束'
  },
  statistics: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '统计数据：订单数、取消数、投诉数等'
  },
  abnormalBehaviors: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '异常行为列表'
  },
  riskAssessment: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '风险评估结果'
  },
  recommendations: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '处理建议'
  },
  overallRiskLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '综合风险等级：1正常 2关注 3警告 4高风险'
  },
  overallRiskScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '综合风险评分'
  },
  suggestedActions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '建议采取的措施'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0待审阅 1已审阅 2已执行 3已归档'
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '审阅人ID'
  },
  reviewerName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '审阅人姓名'
  },
  reviewRemark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '审阅意见'
  },
  reviewTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审阅时间'
  },
  executedActions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '已执行的措施'
  }
}, {
  tableName: 'biz_passenger_behavior_report',
  comment: '乘客行为风险报告表',
  indexes: [
    { fields: ['reportNo'] },
    { fields: ['passengerId'] },
    { fields: ['overallRiskLevel'] },
    { fields: ['status'] },
    { fields: ['createTime'] }
  ]
})

module.exports = PassengerBehaviorReport
