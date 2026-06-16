const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const OperationLog = sequelize.define('OperationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '操作人ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作人账号'
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作人昵称'
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '模块'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作'
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: '请求方法'
  },
  url: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '请求路径'
  },
  ip: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'IP地址'
  },
  userAgent: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '用户代理'
  },
  params: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '请求参数'
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '返回结果'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '状态：1成功 0失败'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '耗时(ms)'
  },
  errorMsg: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '错误信息'
  }
}, {
  tableName: 'sys_operation_log',
  comment: '操作日志表',
  indexes: [
    { fields: ['userId'] },
    { fields: ['module'] },
    { fields: ['status'] },
    { fields: ['createTime'] }
  ]
})

module.exports = OperationLog
