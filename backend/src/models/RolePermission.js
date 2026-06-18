const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const RolePermission = sequelize.define(
  'RolePermission',
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
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '权限菜单ID'
    },
    isCore: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否核心权限(核心权限不可删除)'
    }
  },
  {
    tableName: 'role_permissions',
    comment: '角色权限关联表',
    indexes: [
      {
        unique: true,
        fields: ['roleId', 'permissionId']
      }
    ]
  }
)

module.exports = RolePermission
