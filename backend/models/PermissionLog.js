const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const PermissionLog = sequelize.define('PermissionLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '目标用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    comment: '目标用户名'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    comment: '操作人姓名'
  },
  operatorRole: {
    type: DataTypes.STRING(30),
    comment: '操作人角色'
  },
  action: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '操作类型: grant-授予, revoke-收回, update-修改, batch_grant-批量授予, batch_revoke-批量收回, reset-重置, expire-过期'
  },
  permissionType: {
    type: DataTypes.STRING(30),
    comment: '权限类型'
  },
  permissionKey: {
    type: DataTypes.STRING(50),
    comment: '权限标识'
  },
  permissionName: {
    type: DataTypes.STRING(50),
    comment: '权限名称'
  },
  beforeValue: {
    type: DataTypes.TEXT,
    comment: '变更前值'
  },
  afterValue: {
    type: DataTypes.TEXT,
    comment: '变更后值'
  },
  validFrom: {
    type: DataTypes.DATE,
    comment: '生效开始时间'
  },
  validTo: {
    type: DataTypes.DATE,
    comment: '生效结束时间'
  },
  reason: {
    type: DataTypes.STRING(500),
    comment: '变更原因'
  },
  source: {
    type: DataTypes.STRING(30),
    defaultValue: 'manual',
    comment: '操作来源'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常: 0-正常, 1-异常'
  },
  abnormalType: {
    type: DataTypes.STRING(30),
    comment: '异常类型: abuse-权限滥用, mismatch-错配, over_range-超范围'
  },
  abnormalRemark: {
    type: DataTypes.STRING(500),
    comment: '异常说明'
  },
  ip: {
    type: DataTypes.STRING(50),
    comment: '操作IP'
  }
}, {
  tableName: 'permission_logs',
  comment: '权限变更日志表',
  indexes: [
    { fields: ['userId'] },
    { fields: ['operatorId'] },
    { fields: ['action'] },
    { fields: ['createdAt'] }
  ]
});

PermissionLog.belongsTo(User, { foreignKey: 'userId', as: 'targetUser' });

module.exports = PermissionLog;
