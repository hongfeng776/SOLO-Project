const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const AccountPermissionLog = sequelize.define(
  'AccountPermissionLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    userUid: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '用户UID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '用户名'
    },
    changeType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '变更类型'
    },
    beforeSnapshot: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更前快照'
    },
    afterSnapshot: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更后快照'
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '角色ID'
    },
    roleName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '角色名称'
    },
    addedPermissions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '新增权限'
    },
    removedPermissions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '移除权限'
    },
    conflictInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '冲突信息'
    },
    batchId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '批次ID'
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
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人角色'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '原因'
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP地址'
    }
  },
  {
    tableName: 'account_permission_logs',
    comment: '账号权限日志表'
  }
)

module.exports = AccountPermissionLog
