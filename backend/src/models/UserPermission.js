const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const PERMISSION_SOURCES = ['role_inherit', 'direct_assign', 'batch_assign', 'auto_grant']
const PERMISSION_SOURCE_LABELS = {
  role_inherit: '角色继承',
  direct_assign: '直接分配',
  batch_assign: '批量分配',
  auto_grant: '自动授予'
}

const UserPermission = sequelize.define(
  'UserPermission',
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
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '权限菜单ID'
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '来源角色ID(角色继承时填写)'
    },
    source: {
      type: DataTypes.ENUM(...PERMISSION_SOURCES),
      allowNull: false,
      defaultValue: 'direct_assign',
      comment: '权限来源: role_inherit-角色继承 direct_assign-直接分配 batch_assign-批量分配 auto_grant-自动授予'
    },
    isCore: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否核心权限(核心权限不可单独删除)'
    },
    isOverride: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否为角色权限覆盖(用户级覆盖角色级)'
    },
    overrideType: {
      type: DataTypes.ENUM('grant', 'deny'),
      allowNull: true,
      comment: '覆盖类型: grant-额外授予 deny-拒绝(角色有但用户没有)'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '权限过期时间(null表示永久)'
    }
  },
  {
    tableName: 'user_permissions',
    comment: '用户权限关联表',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'permissionId', 'source']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['roleId']
      },
      {
        fields: ['permissionId']
      }
    ]
  }
)

UserPermission.PERMISSION_SOURCES = PERMISSION_SOURCES
UserPermission.PERMISSION_SOURCE_LABELS = PERMISSION_SOURCE_LABELS

module.exports = UserPermission
