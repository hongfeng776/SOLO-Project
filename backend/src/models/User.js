const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const SENSITIVE_WORDS = [
  '管理员', 'admin', '系统', '官方', '客服', '客服中心',
  '违规', '色情', '赌博', '诈骗', '传销', '代开发票',
  '刷单', '办证', '黑客', '破解', '外挂', '私服'
]

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '用户ID'
    },
    uid: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      comment: '用户唯一标识UID'
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
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '用户标签'
    },
    permissionGroup: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'default',
      comment: '基础权限分组'
    },
    status: {
      type: DataTypes.ENUM('active', 'disabled', 'frozen', 'banned'),
      defaultValue: 'active',
      allowNull: false,
      comment: '状态: active-正常 disabled-禁用 frozen-冻结 banned-封禁'
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

User.SENSITIVE_WORDS = SENSITIVE_WORDS

module.exports = User
