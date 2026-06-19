const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const SystemLog = sequelize.define(
  'SystemLog',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID'
    },
    traceId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '链路追踪ID'
    },
    logType: {
      type: DataTypes.ENUM('system', 'api', 'error', 'performance', 'security', 'cron'),
      allowNull: false,
      comment: '日志类型：system系统运行、api接口访问、error错误异常、performance性能、security安全、cron定时任务'
    },
    logLevel: {
      type: DataTypes.ENUM('info', 'warning', 'error', 'debug', 'critical'),
      allowNull: false,
      defaultValue: 'info',
      comment: '日志级别：info正常、warning警告、error错误、debug调试、critical严重'
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '所属模块'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '日志标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '日志内容'
    },
    stackTrace: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误堆栈信息'
    },
    requestMethod: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: '请求方法：GET/POST/PUT/DELETE等'
    },
    requestUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '请求URL'
    },
    requestParams: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '请求参数(JSON)'
    },
    requestBody: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '请求体(JSON)'
    },
    responseStatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '响应状态码'
    },
    responseData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '响应数据(JSON)'
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '执行耗时(ms)'
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
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP地址'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '浏览器UA'
    },
    serverName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '服务器名称'
    },
    processId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '进程ID'
    },
    threadId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '线程ID'
    },
    errorCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '错误码'
    },
    errorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '错误名称'
    },
    isHighRisk: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否高危日志(禁止清理)'
    },
    isRetained: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否已备份留存'
    },
    retentionDays: {
      type: DataTypes.INTEGER,
      defaultValue: 90,
      allowNull: true,
      comment: '保留天数'
    },
    expireAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '过期时间(用于自动清理)'
    },
    backupFile: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '备份文件路径'
    },
    backupAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '备份时间'
    },
    extraInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '扩展信息(JSON)'
    }
  },
  {
    tableName: 'system_logs',
    comment: '系统运行日志表',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['logType'] },
      { fields: ['logLevel'] },
      { fields: ['module'] },
      { fields: ['createdAt'] },
      { fields: ['traceId'] },
      { fields: ['requestUrl'] },
      { fields: ['responseStatus'] },
      { fields: ['userId'] },
      { fields: ['isHighRisk'] },
      { fields: ['isRetained'] },
      { fields: ['expireAt'] }
    ]
  }
)

module.exports = SystemLog
