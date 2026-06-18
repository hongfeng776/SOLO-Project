const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const ACCOUNT_CHANGE_TYPES = [
  'assign_role', 'revoke_role', 'add_permission', 'remove_permission',
  'batch_assign_role', 'batch_add_permission', 'sync_role_perms',
  'cleanup_redundant', 'conflict_resolve'
]
const ACCOUNT_CHANGE_TYPE_LABELS = {
  assign_role: '分配角色',
  revoke_role: '撤销角色',
  add_permission: '增加权限',
  remove_permission: '移除权限',
  batch_assign_role: '批量分配角色',
  batch_add_permission: '批量增加权限',
  sync_role_perms: '同步角色权限',
  cleanup_redundant: '清理冗余权限',
  conflict_resolve: '冲突解决'
}

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
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '用户UID(快照)'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '用户名(快照)'
    },
    changeType: {
      type: DataTypes.ENUM(...ACCOUNT_CHANGE_TYPES),
      allowNull: false,
      comment: '变更类型'
    },
    beforeSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '变更前权限快照'
    },
    afterSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '变更后权限快照'
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '涉及角色ID'
    },
    roleName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '涉及角色名称(快照)'
    },
    addedPermissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '新增权限ID列表'
    },
    removedPermissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '移除权限ID列表'
    },
    conflictInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '冲突信息记录'
    },
    batchId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '批量操作批次ID'
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
      comment: '变更原因'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作IP'
    }
  },
  {
    tableName: 'account_permission_logs',
    comment: '账号权限分配日志表'
  }
)

AccountPermissionLog.ACCOUNT_CHANGE_TYPES = ACCOUNT_CHANGE_TYPES
AccountPermissionLog.ACCOUNT_CHANGE_TYPE_LABELS = ACCOUNT_CHANGE_TYPE_LABELS

module.exports = AccountPermissionLog
