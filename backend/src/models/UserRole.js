const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserRole = sequelize.define('UserRole', {
  user_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    comment: '用户ID'
  },
  role_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    comment: '角色ID'
  }
}, {
  tableName: 'user_roles',
  comment: '用户角色关联表',
  timestamps: false
});

module.exports = UserRole;
