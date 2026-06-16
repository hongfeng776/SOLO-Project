const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    comment: '密码'
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '昵称'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '手机号'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '邮箱'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像'
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '角色ID'
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'operator',
    comment: '角色标识'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1启用 0禁用'
  },
  lastLoginTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  },
  lastLoginIp: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '最后登录IP'
  }
}, {
  tableName: 'sys_user',
  comment: '系统用户表'
})

module.exports = User
