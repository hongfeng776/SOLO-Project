const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const MarketingAudienceLog = sequelize.define('MarketingAudienceLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联营销活动ID'
  },
  action: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '操作类型：preview预览 import导入 exclude剔除 tagUpdate标签更新 weightUpdate权重更新 ruleUpdate规则更新 check校验拦截 participate参与 verify核销 fraud欺诈'
  },
  actionLabel: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作描述'
  },
  audiencePurpose: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '人群目的：1拉新 2促活 3维稳 0通用'
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
  operatorRole: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人角色'
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作IP地址'
  },
  beforeRule: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '变更前人群筛选规则'
  },
  afterRule: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '变更后人群筛选规则'
  },
  diffFields: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '规则差异对比 [{field, before, after, type}]'
  },
  affectedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '影响用户数量'
  },
  validCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '有效用户数（排除风险/封禁后）'
  },
  excludedRiskCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排除高风险用户数'
  },
  excludedBlockedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排除封禁用户数'
  },
  excludedInvalidCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '剔除无效用户数'
  },
  coveragePreview: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '覆盖预览统计 {total, byLevel:[{level,count}], byCity:[{city,count}], byActivity:[{level,count}]}'
  },
  weightConfig: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '用户差异化权重配置 {tags:[{tag,weight}], levels:[{level,weight}], cities:[{city,weight}]}'
  },
  riskLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '风险等级：0正常 1低 2中 3高（拦截）'
  },
  validateResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '人群定向校验结果 {valid, errors:[{field,message,blocking}], warnings:[], passed:[]}'
  },
  interceptionReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '拦截原因'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联用户ID（参与/核销/欺诈场景使用）'
  },
  userPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '用户手机号'
  },
  userLevel: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '用户等级'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '用户标签快照'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'biz_marketing_audience_log',
  comment: '营销人群定向操作日志',
  indexes: [
    { fields: ['campaignId'] },
    { fields: ['action'] },
    { fields: ['audiencePurpose'] },
    { fields: ['userId'] },
    { fields: ['riskLevel'] },
    { fields: ['operatorId'] },
    { fields: ['createdAt'] }
  ]
})

module.exports = MarketingAudienceLog
