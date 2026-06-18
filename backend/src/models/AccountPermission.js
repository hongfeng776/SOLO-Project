const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const BINDING_TYPES = ['core_role', 'auxiliary']
const BINDING_TYPE_LABELS = {
  core_role: '核心角色',
  auxiliary: '附属权限'
}

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
      comment: '绑定角色ID(核心角色绑定时有值)'
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '单独绑定权限ID(附属权限绑定时有值)'
    },
    bindingType: {
      type: DataTypes.ENUM(...BINDING_TYPES),
      allowNull: false,
      comment: '绑定类型: core_role-核心角色 auxiliary-附属权限'
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '来源: role(角色继承) / manual(手动分配) / batch(批量分配)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否生效'
    }
  },
  {
    tableName: 'account_permissions',
    comment: '账号权限绑定表',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'bindingType', 'roleId', 'permissionId'],
        name: 'uk_user_binding'
      },
      {
        fields: ['userId']
      }
    ]
  }
)

AccountPermission.BINDING_TYPES = BINDING_TYPES
AccountPermission.BINDING_TYPE_LABELS = BINDING_TYPE_LABELS

module.exports = AccountPermission
