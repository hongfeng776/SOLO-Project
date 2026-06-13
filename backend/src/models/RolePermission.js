const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
  role_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    comment: '角色ID'
  },
  permission_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    comment: '权限ID'
  }
}, {
  tableName: 'role_permissions',
  comment: '角色权限关联表',
  timestamps: false
});

module.exports = RolePermission;
