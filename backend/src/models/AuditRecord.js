const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const AuditRecord = sequelize.define(
  'AuditRecord',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '审核记录ID'
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资源ID'
    },
    resourceType: {
      type: DataTypes.ENUM('image', 'video', 'template', 'audio'),
      defaultValue: 'image',
      allowNull: false,
      comment: '资源类型'
    },
    resourceTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '资源标题'
    },
    auditorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '审核员ID'
    },
    auditorName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '审核员名称'
    },
    auditLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      comment: '审核层级'
    },
    auditResult: {
      type: DataTypes.ENUM('approved', 'rejected'),
      allowNull: false,
      comment: '审核结果'
    },
    auditOpinion: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '审核意见'
    },
    auditTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      comment: '审核时间'
    }
  },
  {
    tableName: 'audit_records',
    comment: '审核记录表',
    timestamps: false
  }
)

module.exports = AuditRecord
