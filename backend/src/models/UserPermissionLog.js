const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const CHANGE_TYPES = ['assign_role', 'unassign_role', 'add_perm', 'remove_perm', 'batch_assign', 'override_perm', 'sync', 'clear_expired']
const CHANGE_TYPE_LABELS = {
  assign_role: '分配角色',
  unassign_role: '移除角色',
  add_perm: '新增权限',
  remove_perm: '移除权限',
  batch_assign: '批量分配',
  override_perm: '覆盖权限',
  sync: '权限同步',
  clear_expired: '清理过期'
}

const CHECK_RESULTS = ['pass', 'duplicate', 'overreach', 'conflict', 'redundant', 'status_block']
const CHECK_RESULT_LABELS = {
  pass: '通过',
  duplicate: '重复分配',
  overreach: '越权配置',
  conflict: '权限冲突',
  redundant: '权限冗余',
  status_block: '状态拦截'
}

const UserPermissionLog = sequelize.define(
  'UserPermissionLog',
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
      comment: '目标用户ID'
    },
    userUid: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '目标用户UID(快照)'
    },
    userName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '目标用户名称(快照)'
    },
    changeType: {
      type: DataTypes.ENUM(...CHANGE_TYPES),
      allowNull: false,
      comment: '变更类型'
    },
    oldRoleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '变更前角色ID'
    },
    newRoleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '变更后角色ID'
    },
    oldRoleName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '变更前角色名(快照)'
    },
    newRoleName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '变更后角色名(快照)'
    },
    addedPermissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '新增的权限(含来源)'
    },
    removedPermissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '移除的权限(含来源)'
    },
    overridePermissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '覆盖的权限列表'
    },
    checkResults: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '校验结果详情'
    },
    permissionSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '变更后权限快照'
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
      comment: '操作原因'
    },
    tookEffectAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '生效时间'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作IP'
    }
  },
  {
    tableName: 'user_permission_logs',
    comment: '用户权限分配日志表'
  }
)

UserPermissionLog.CHANGE_TYPES = CHANGE_TYPES
UserPermissionLog.CHANGE_TYPE_LABELS = CHANGE_TYPE_LABELS
UserPermissionLog.CHECK_RESULTS = CHECK_RESULTS
UserPermissionLog.CHECK_RESULT_LABELS = CHECK_RESULT_LABELS

module.exports = UserPermissionLog
