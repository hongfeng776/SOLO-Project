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
    taskId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '任务ID'
    },
    taskName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '任务名称'
    },
    taskType: {
      type: DataTypes.ENUM('data_sync', 'backup', 'cleanup', 'report', 'notification', 'statistics', 'health_check', 'other'),
      allowNull: false,
      comment: '任务类型：data_sync数据同步、backup备份、cleanup清理、report报表、notification通知、statistics统计、health_check健康检查、other其他'
    },
    taskGroup: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '任务分组'
    },
    triggerType: {
      type: DataTypes.ENUM('scheduled', 'manual', 'retry', 'api'),
      allowNull: false,
      defaultValue: 'scheduled',
      comment: '触发类型：scheduled定时、manual手动、retry重试、api接口触发'
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'success', 'failed', 'timeout', 'skipped', 'killed'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '执行状态：pending等待中、running执行中、success成功、failed失败、timeout超时、skipped跳过、killed终止'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '计划执行时间'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '实际开始时间'
    },
    finishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '实际结束时间'
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
      comment: '重试次数'
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      allowNull: false,
      comment: '最大重试次数'
    },
    retryStrategy: {
      type: DataTypes.ENUM('exponential', 'fixed', 'linear', 'none'),
      defaultValue: 'exponential',
      allowNull: false,
      comment: '重试策略：exponential指数退避、fixed固定间隔、linear线性递增、none不重试'
    },
    retryInterval: {
      type: DataTypes.INTEGER,
      defaultValue: 60000,
      allowNull: true,
      comment: '重试间隔(ms)'
    },
    retryHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '重试历史记录(JSON数组)'
    },
    parentLogId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '父日志ID(用于关联重试)'
    },
    resultData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '执行结果数据(JSON)'
    },
    output: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '任务输出日志'
    },
    errorMessage: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      comment: '错误信息'
    },
    errorStack: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误堆栈'
    },
    errorCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '错误码'
    },
    configParams: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '任务配置参数(JSON)'
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
      comment: 'CPU使用率(%)'
    },
    memoryUsage: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '内存使用量(字节)'
    },
    memoryUsagePercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '内存使用率(%)'
    },
    affectedRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '影响记录数'
    },
    processedRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '处理记录数'
    },
    failedRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '失败记录数'
    },
    isTimeout: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否超时'
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
    anomalyType: {
      type: DataTypes.ENUM('none', 'duplicate', 'timeout', 'missed', 'resource_exceeded', 'config_error'),
      defaultValue: 'none',
      allowNull: false,
      comment: '异常类型：none无、duplicate重复执行、timeout超时、missed漏执行、resource_exceeded资源超限、config_error配置错误'
    },
    anomalyDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否检测到异常'
    },
    anomalyMessage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '异常说明'
    },
    optimizationSuggestion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '优化建议'
    },
    cronExpression: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Cron表达式'
    },
    nextRunAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '下次执行时间'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '创建人ID'
    },
    createdByName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '创建人名称'
    },
    traceId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '链路追踪ID'
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
      { fields: ['taskId'] },
      { fields: ['taskName'] },
      { fields: ['taskType'] },
      { fields: ['status'] },
      { fields: ['scheduledAt'] },
      { fields: ['startedAt'] },
      { fields: ['finishedAt'] },
      { fields: ['createdAt'] },
      { fields: ['triggerType'] },
      { fields: ['isTimeout'] },
      { fields: ['isDuplicate'] },
      { fields: ['isMissed'] },
      { fields: ['anomalyDetected'] },
      { fields: ['anomalyType'] },
      { fields: ['parentLogId'] },
      { fields: ['traceId'] }
    ]
  }
)

module.exports = CronLog
