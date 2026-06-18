const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const ROLE_TYPES = ['super_admin', 'admin', 'auditor', 'operator', 'member']

const ROLE_LABELS = {
  super_admin: '超级管理员',
  admin: '管理员',
  auditor: '审核员',
  operator: '运营员',
  member: '普通用户'
}

const Role = sequelize.define(
  'Role',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '角色ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '角色名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '角色编码'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '角色描述'
    },
    type: {
      type: DataTypes.ENUM(...ROLE_TYPES),
      allowNull: false,
      defaultValue: 'member',
      comment: '角色类型'
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否系统内置角色(超级管理员等不可修改)'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '角色层级: 数值越大层级越高'
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    }
  },
  {
    tableName: 'roles',
    comment: '角色表'
  }
)

Role.ROLE_TYPES = ROLE_TYPES
Role.ROLE_LABELS = ROLE_LABELS

module.exports = Role
