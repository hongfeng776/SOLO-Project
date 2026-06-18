const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const OperationLog = sequelize.define(
  'OperationLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID'
    },
    traceId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '全链路追踪ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作用户ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作用户名'
    },
    userRole: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: '操作用户角色'
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作模块'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '操作动作'
    },
    target: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '操作目标'
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '目标ID'
    },
    targetType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '目标类型'
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作详情(JSON)'
    },
    beforeData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作前数据(JSON)'
    },
    afterData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作后数据(JSON)'
    },
    changedFields: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更字段列表(JSON)'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP地址'
    },
    ipLocation: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'IP归属地'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '浏览器UA'
    },
    deviceInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '设备信息(JSON)'
    },
    os: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作系统'
    },
    browser: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '浏览器'
    },
    requestId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '请求ID'
    },
    parentLogId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '父级日志ID(用于链路追踪)'
    },
    step: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: true,
      comment: '操作步骤序号'
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '操作耗时(ms)'
    },
    result: {
      type: DataTypes.ENUM('success', 'fail'),
      defaultValue: 'success',
      allowNull: false,
      comment: '操作结果'
    },
    failReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '失败原因'
    },
    isMalicious: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否恶意操作'
    },
    isTampered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否被篡改'
    },
    tamperCheck: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '篡改校验哈希'
    },
    riskLevel: {
      type: DataTypes.ENUM('none', 'low', 'medium', 'high', 'critical'),
      defaultValue: 'none',
      allowNull: true,
      comment: '风险等级'
    },
    verifyStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'warning', 'violation'),
      defaultValue: 'pending',
      allowNull: true,
      comment: '合法性校验状态'
    },
    evidenceHash: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: '溯源凭证哈希'
    }
  },
  {
    tableName: 'operation_logs',
    comment: '操作日志表',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['username'] },
      { fields: ['module'] },
      { fields: ['action'] },
      { fields: ['createdAt'] },
      { fields: ['traceId'] },
      { fields: ['targetId', 'targetType'] },
      { fields: ['result'] },
      { fields: ['riskLevel'] },
      { fields: ['isMalicious'] }
    ]
  }
)

module.exports = OperationLog
