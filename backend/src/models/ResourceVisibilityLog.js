const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const ResourceVisibilityLog = sequelize.define(
  'ResourceVisibilityLog',
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
    oldVisibility: {
      type: DataTypes.ENUM('public', 'private', 'friends_only', 'violation_hidden'),
      allowNull: true,
      comment: '原可见性状态'
    },
    newVisibility: {
      type: DataTypes.ENUM('public', 'private', 'friends_only', 'violation_hidden'),
      allowNull: false,
      comment: '新可见性状态'
    },
    changeType: {
      type: DataTypes.ENUM('manual', 'auto', 'batch', 'audit'),
      defaultValue: 'manual',
      allowNull: false,
      comment: '变更类型：manual手动/auto自动/batch批量/audit审核'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '变更原因'
    },
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作人ID'
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
    auditStatus: {
      type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
      defaultValue: 'none',
      allowNull: false,
      comment: '审核状态'
    },
    auditorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '审核人ID'
    },
    auditorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '审核人名称'
    },
    auditOpinion: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '审核意见'
    },
    auditTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '审核时间'
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
    changeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      comment: '当日变更次序'
    },
    isHighFrequency: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否高频操作'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    }
  },
  {
    tableName: 'resource_visibility_logs',
    comment: '资源可见性状态变更日志表',
    indexes: [
      { fields: ['resourceId'] },
      { fields: ['operatorId'] },
      { fields: ['oldVisibility'] },
      { fields: ['newVisibility'] },
      { fields: ['changeType'] },
      { fields: ['auditStatus'] },
      { fields: ['createdAt'] },
      { fields: ['resourceId', 'createdAt'] },
      { fields: ['operatorId', 'createdAt'] },
      { fields: ['newVisibility', 'auditStatus'] },
      { fields: ['isHighFrequency'] }
    ]
  }
)

module.exports = ResourceVisibilityLog
