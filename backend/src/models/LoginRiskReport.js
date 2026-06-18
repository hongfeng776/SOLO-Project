const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const LoginRiskReport = sequelize.define(
  'LoginRiskReport',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, comment: '报告ID' },
    loginLogId: { type: DataTypes.BIGINT, allowNull: true, comment: '关联登录日志ID' },
    userId: { type: DataTypes.INTEGER, allowNull: true, comment: '用户ID' },
    uid: { type: DataTypes.STRING(32), allowNull: true },
    username: { type: DataTypes.STRING(50), allowNull: false },
    ip: { type: DataTypes.STRING(50), allowNull: false },
    deviceId: { type: DataTypes.STRING(128), allowNull: true },

    overallScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, comment: '综合风险评分(0-100，越高越危险)' },
    riskLevel: {
      type: DataTypes.ENUM('none', 'low', 'medium', 'high', 'critical'),
      defaultValue: 'none',
      allowNull: false
    },
    finalDecision: {
      type: DataTypes.ENUM('pass', 'verify', 'block'),
      defaultValue: 'pass',
      allowNull: false,
      comment: '最终决策: 通过/需二次验证/拦截'
    },

    deviceChecks: { type: DataTypes.JSON, allowNull: true, comment: '设备维度检测项' },
    ipChecks: { type: DataTypes.JSON, allowNull: true, comment: 'IP维度检测项' },
    frequencyChecks: { type: DataTypes.JSON, allowNull: true, comment: '频次维度检测项' },
    behaviorChecks: { type: DataTypes.JSON, allowNull: true, comment: '行为维度检测项(脚本/伪造等)' },
    geoChecks: { type: DataTypes.JSON, allowNull: true, comment: '地理位置检测项' },

    riskRulesTriggered: { type: DataTypes.JSON, defaultValue: [], comment: '触发的风险规则列表' },
    riskScoreDetails: { type: DataTypes.JSON, defaultValue: [], comment: '各子项打分明细' },

    deviceRiskScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    ipRiskScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    frequencyRiskScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    behaviorRiskScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    geoRiskScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },

    historicalContext: { type: DataTypes.JSON, allowNull: true, comment: '历史上下文对比' },
    userBaseline: { type: DataTypes.JSON, allowNull: true, comment: '用户基线数据(常用地/设备/IP等)' },

    suggestion: { type: DataTypes.STRING(500), allowNull: true, comment: '系统处理建议' },
    processedBy: { type: DataTypes.INTEGER, allowNull: true, comment: '处理人ID(人工复核)' },
    processedByName: { type: DataTypes.STRING(50), allowNull: true },
    processedAt: { type: DataTypes.DATE, allowNull: true },
    processingResult: { type: DataTypes.STRING(30), allowNull: true, comment: '人工处理结果' },
    remark: { type: DataTypes.STRING(500), allowNull: true }
  },
  { tableName: 'login_risk_reports', comment: '登录风控报告表', indexes: [
    { fields: ['loginLogId'] }, { fields: ['userId'] }, { fields: ['riskLevel'] },
    { fields: ['finalDecision'] }, { fields: ['createdAt'] }
  ]}
)

LoginRiskReport.DECISIONS = ['pass', 'verify', 'block']

module.exports = LoginRiskReport
