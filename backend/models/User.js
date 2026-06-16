const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Role = require('./Role');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码(加密后)'
  },
  nickname: {
    type: DataTypes.STRING(50),
    comment: '昵称'
  },
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: Role,
      key: 'id'
    },
    comment: '角色ID'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 1-启用, 0-禁用'
  },
  avatar: {
    type: DataTypes.STRING(255),
    comment: '头像URL'
  }
}, {
  tableName: 'users',
  comment: '用户表'
});

User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

module.exports = User;
