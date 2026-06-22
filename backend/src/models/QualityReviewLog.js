const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const QualityReviewLog = sequelize.define(
  'QualityReviewLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '复核ID'
    },
    assessmentLogId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '关联的评估日志ID'
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资源ID'
    },
    resourceTitle: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '资源标题'
    },
    oldQualityLevel: {
      type: DataTypes.ENUM('excellent', 'good', 'normal', 'low_quality', 'violation'),
      allowNull: false,
      comment: '复核前质量等级'
    },
    newQualityLevel: {
      type: DataTypes.ENUM('excellent', 'good', 'normal', 'low_quality', 'violation'),
      allowNull: true,
      comment: '复核后质量等级（不通过则不修改）'
    },
    reviewResult: {
      type: DataTypes.ENUM('approved', 'rejected', 'locked'),
      defaultValue: 'approved',
      allowNull: false,
      comment: '复核结果：approved通过/rejected不通过/locked锁定'
    },
    reviewReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '复核原因/意见'
    },
    reviewBasis: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '复核依据（多维度校验结果）'
    },
    reviewerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '复核人ID'
    },
    reviewerName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '复核人名称'
    },
    reviewerRole: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '复核人角色'
    },
    consistencyScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '判定标准一致性评分(0-100)'
    },
    misjudgmentFound: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否发现误判'
    },
    omissionsFound: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否发现漏判'
    },
    ruleOptimizationNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '规则优化建议'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '复核IP'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '用户代理'
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '复核时间'
    }
  },
  {
    tableName: 'quality_review_logs',
    comment: '内容质量复核日志表',
    indexes: [
      { fields: ['resourceId'] },
      { fields: ['assessmentLogId'] },
      { fields: ['reviewResult'] },
      { fields: ['reviewerId'] },
      { fields: ['oldQualityLevel'] },
      { fields: ['newQualityLevel'] },
      { fields: ['createdAt'] },
      { fields: ['resourceId', 'createdAt'] },
      { fields: ['misjudgmentFound'] },
      { fields: ['omissionsFound'] }
    ]
  }
)

module.exports = QualityReviewLog
