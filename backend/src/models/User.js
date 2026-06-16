const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const User = sequelize.define(
  'User',
  {
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
      comment: '密码'
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '昵称'
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '头像'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号'
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'auditor', 'operator', 'member'),
      defaultValue: 'member',
      allowNull: false,
      comment: '角色'
    },
    status: {
      type: DataTypes.ENUM('active', 'disabled'),
      defaultValue: 'active',
      allowNull: false,
      comment: '状态'
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
  },
  {
    tableName: 'users',
    comment: '用户表'
  }
)

module.exports = User
