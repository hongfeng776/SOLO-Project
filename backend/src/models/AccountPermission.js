const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const AccountPermission = sequelize.define(
  'AccountPermission',
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
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '角色ID'
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '权限ID'
    },
    bindingType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '绑定类型'
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '来源'
    }
  },
  {
    tableName: 'account_permissions',
    comment: '账号权限表'
  }
)

module.exports = AccountPermission
