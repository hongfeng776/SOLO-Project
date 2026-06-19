const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const CronLog = sequelize.define(
  'CronLog',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID'
    },
    taskName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '任务名称'
    },
    taskType: {
      type: DataTypes.ENUM('data_sync', 'data_cleanup', 'report_generate', 'backup', 'monitor', 'notification', 'cache_refresh', 'statistic', 'custom'),
      allowNull: false,
      defaultValue: 'custom',
      comment: '任务类型：data_sync数据同步、data_cleanup数据清理、report_generate报告生成、backup备份、monitor监控、notification通知、cache_refresh缓存刷新、statistic统计、custom自定义'
    },
    taskGroup: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '任务分组'
    },
    cronExpression: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Cron表达式'
    },
    executeStatus: {
      type: DataTypes.ENUM('pending', 'running', 'success', 'failed', 'timeout', 'skipped', 'retrying'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '执行状态：pending待执行、running执行中、success成功、failed失败、timeout超时、skipped跳过、retrying重试中'
    },
    executeResult: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '执行结果详情(JSON)'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息'
    },
    errorStack: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误堆栈'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '开始执行时间'
    },
    finishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '执行完成时间'
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '执行耗时(ms)'
    },
    timeoutThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 3600000,
      allowNull: true,
      comment: '超时阈值(ms)'
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '已重试次数'
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      allowNull: true,
      comment: '最大重试次数'
    },
    retryStrategy: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '重试策略：immediate/fixed/interval/exponential'
    },
    retryRecords: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '重试记录(JSON数组)'
    },
    nextRetryAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '下次重试时间'
    },
    taskConfig: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '任务配置参数(JSON)'
    },
    isTaskValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: '任务配置是否有效'
    },
    invalidReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '配置无效原因'
    },
    triggerType: {
      type: DataTypes.ENUM('cron', 'manual', 'api', 'dependency', 'event'),
      allowNull: false,
      defaultValue: 'cron',
      comment: '触发类型：cron定时触发、manual手动触发、api接口触发、dependency依赖触发、event事件触发'
    },
    triggerBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '触发人/来源'
    },
    serverName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '执行服务器名称'
    },
    processId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '进程ID'
    },
    cpuUsage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'CPU占用率(%)'
    },
    memoryUsage: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '内存占用(bytes)'
    },
    diskIo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '磁盘IO信息(JSON)'
    },
    networkIo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '网络IO信息(JSON)'
    },
    isDuplicate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否重复执行'
    },
    isMissed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否漏执行'
    },
    isOvertime: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否超时执行'
    },
    anomalyType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '异常类型：duplicate/overtime/missed/config_invalid/resource_high'
    },
    affectRows: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '影响行数'
    },
    outputData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '输出数据(JSON)'
    },
    extraInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '扩展信息(JSON)'
    }
  },
  {
    tableName: 'cron_logs',
    comment: '定时任务日志表',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['taskName'] },
      { fields: ['taskType'] },
      { fields: ['executeStatus'] },
      { fields: ['startedAt'] },
      { fields: ['createdAt'] },
      { fields: ['taskGroup'] },
      { fields: ['triggerType'] },
      { fields: ['isDuplicate'] },
      { fields: ['isMissed'] },
      { fields: ['isOvertime'] },
      { fields: ['anomalyType'] },
      { fields: ['duration'] }
    ]
  }
)

module.exports = CronLog
