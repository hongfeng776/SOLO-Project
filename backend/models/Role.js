const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Role = sequelize.define('Role', {
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
    type: DataTypes.STRING(255),
    comment: '角色描述'
  },
  permissions: {
    type: DataTypes.TEXT,
    comment: '权限列表(JSON格式存储)'
  }
}, {
  tableName: 'roles',
  comment: '角色表'
});

module.exports = Role;
