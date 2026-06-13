const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OperationLog = sequelize.define('OperationLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '操作人ID',
    index: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作人用户名'
  },
  module: {
    type: DataTypes.STRING(50),
    comment: '操作模块',
    index: true
  },
  operation: {
    type: DataTypes.STRING(50),
    comment: '操作类型：create/update/delete/query/other'
  },
  method: {
    type: DataTypes.STRING(20),
    comment: '请求方法：GET/POST/PUT/DELETE'
  },
  path: {
    type: DataTypes.STRING(255),
    comment: '请求路径'
  },
  params: {
    type: DataTypes.TEXT,
    comment: '请求参数（JSON）'
  },
  ip: {
    type: DataTypes.STRING(50),
    comment: '操作IP'
  },
  user_agent: {
    type: DataTypes.STRING(500),
    comment: '浏览器标识'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '操作状态 1-成功 0-失败'
  },
  error_msg: {
    type: DataTypes.STRING(500),
    comment: '错误信息'
  },
  cost_time: {
    type: DataTypes.INTEGER,
    comment: '耗时(ms)'
  },
  description: {
    type: DataTypes.STRING(500),
    comment: '操作描述'
  }
}, {
  tableName: 'operation_logs',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['module'] },
    { fields: ['created_at'] }
  ]
});

module.exports = OperationLog;
