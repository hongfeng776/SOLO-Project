const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const QualityAssessmentLog = sequelize.define(
  'QualityAssessmentLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID'
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
    assessType: {
      type: DataTypes.ENUM('auto', 'manual', 'batch', 'recheck'),
      defaultValue: 'auto',
      allowNull: false,
      comment: '评估类型：auto自动/manual人工/batch批量/recheck复核'
    },
    oldQualityLevel: {
      type: DataTypes.ENUM('excellent', 'good', 'normal', 'low_quality', 'violation'),
      allowNull: true,
      comment: '原质量等级'
    },
    newQualityLevel: {
      type: DataTypes.ENUM('excellent', 'good', 'normal', 'low_quality', 'violation'),
      allowNull: false,
      comment: '新质量等级'
    },
    oldQualityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '原综合评分'
    },
    newQualityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: '新综合评分'
    },
    resolutionScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '画质评分'
    },
    contentScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '内容质量评分'
    },
    compositionScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '构图评分'
    },
    complianceScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '合规性评分'
    },
    authorQualityScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '作者历史作品质量加成'
    },
    qualityFlags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '质量问题标记（低俗/违规/低质等）'
    },
    assessBasis: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '评估依据详情'
    },
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作人ID（自动评估为null）'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人名称'
    },
    operatorRole: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '操作人角色'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作IP'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '用户代理'
    },
    beforeSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '变更前快照'
    },
    afterSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '变更后快照'
    },
    isMisjudgment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否误判（经复核标记）'
    },
    misjudgmentNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '误判说明'
    }
  },
  {
    tableName: 'quality_assessment_logs',
    comment: '内容质量评估日志表',
    indexes: [
      { fields: ['resourceId'] },
      { fields: ['assessType'] },
      { fields: ['newQualityLevel'] },
      { fields: ['operatorId'] },
      { fields: ['createdAt'] },
      { fields: ['resourceId', 'createdAt'] },
      { fields: ['newQualityLevel', 'assessType'] },
      { fields: ['isMisjudgment'] },
      { fields: ['operatorId', 'createdAt'] }
    ]
  }
)

module.exports = QualityAssessmentLog
