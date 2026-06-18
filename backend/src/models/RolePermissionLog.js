const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const CHANGE_TYPES = ['create', 'edit', 'delete', 'batch_copy', 'batch_modify', 'sync']
const CHANGE_TYPE_LABELS = {
  create: '创建角色',
  edit: '编辑权限',
  delete: '删除角色',
  batch_copy: '批量复制模板',
  batch_modify: '批量修改权限',
  sync: '权限同步'
}

const RolePermissionLog = sequelize.define(
  'RolePermissionLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID'
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '角色ID'
    },
    roleName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '角色名称(快照)'
    },
    changeType: {
      type: DataTypes.ENUM(...CHANGE_TYPES),
      allowNull: false,
      comment: '变更类型'
    },
    addedPermissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '新增的权限ID列表'
    },
    removedPermissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '移除的权限ID列表'
    },
    permissionSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '变更后权限快照'
    },
    conflictResolution: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '冲突解决记录'
    },
    affectedUserIds: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '受影响的用户ID列表'
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
    tableName: 'role_permission_logs',
    comment: '角色权限配置日志表'
  }
)

RolePermissionLog.CHANGE_TYPES = CHANGE_TYPES
RolePermissionLog.CHANGE_TYPE_LABELS = CHANGE_TYPE_LABELS

module.exports = RolePermissionLog
