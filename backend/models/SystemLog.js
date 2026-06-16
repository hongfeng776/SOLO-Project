const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SystemLog = sequelize.define('SystemLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    comment: '操作用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    comment: '操作用户名'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作类型'
  },
  module: {
    type: DataTypes.STRING(50),
    comment: '操作模块'
  },
  target: {
    type: DataTypes.STRING(100),
    comment: '操作对象'
  },
  detail: {
    type: DataTypes.TEXT,
    comment: '操作详情'
  },
  ip: {
    type: DataTypes.STRING(50),
    comment: 'IP地址'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    comment: '用户代理'
  }
}, {
  tableName: 'system_logs',
  comment: '系统日志表'
});

module.exports = SystemLog;
