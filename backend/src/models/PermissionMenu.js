const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const MENU_LEVELS = ['module', 'page', 'action']

const MENU_LEVEL_LABELS = {
  module: '模块级',
  page: '页面级',
  action: '操作级'
}

const MUTEX_GROUPS = {
  audit_approve: { keys: ['audit:approve', 'audit:reject'], description: '审核通过和审核拒绝互斥' },
  user_ban: { keys: ['user:ban', 'user:active'], description: '封禁和激活互斥' },
  resource_publish: { keys: ['resource:publish', 'resource:offline'], description: '发布和下架互斥' }
}

const PermissionMenu = sequelize.define(
  'PermissionMenu',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '权限菜单ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '权限名称'
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '权限编码(如 resource:view)'
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: '父级权限ID'
    },
    level: {
      type: DataTypes.ENUM(...MENU_LEVELS),
      allowNull: false,
      defaultValue: 'action',
      comment: '权限层级: module-模块级 page-页面级 action-操作级'
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '所属模块(如 resource, user, audit)'
    },
    isCore: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否核心权限(核心权限禁止批量修改)'
    },
    mutexGroup: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '互斥组标识(同组内权限互斥)'
    },
    requiredLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '所需最低角色层级'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '权限描述'
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    }
  },
  {
    tableName: 'permission_menus',
    comment: '权限菜单表'
  }
)

PermissionMenu.MENU_LEVELS = MENU_LEVELS
PermissionMenu.MENU_LEVEL_LABELS = MENU_LEVEL_LABELS
PermissionMenu.MUTEX_GROUPS = MUTEX_GROUPS

module.exports = PermissionMenu
