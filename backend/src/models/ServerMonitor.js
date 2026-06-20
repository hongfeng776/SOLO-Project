const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const ServerMonitor = sequelize.define(
  'ServerMonitor',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: '监控记录ID'
    },
    serverId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '服务器ID'
    },
    serverName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '服务器名称'
    },
    serverIp: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '服务器IP地址'
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '部署区域'
    },
    environment: {
      type: DataTypes.ENUM('production', 'staging', 'testing', 'development'),
      allowNull: false,
      defaultValue: 'production',
      comment: '环境：production生产、staging预发布、testing测试、development开发'
    },
    monitorType: {
      type: DataTypes.ENUM('snapshot', 'interval', 'alert', 'peak'),
      allowNull: false,
      defaultValue: 'interval',
      comment: '监控类型：snapshot快照、interval定时、alert预警、peak峰值'
    },
    cpuUsage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: 'CPU使用率(%)'
    },
    cpuCores: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: 'CPU核心数'
    },
    cpuLoad1: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '1分钟平均负载'
    },
    cpuLoad5: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '5分钟平均负载'
    },
    cpuLoad15: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '15分钟平均负载'
    },
    memoryTotal: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: false,
      comment: '内存总量(字节)'
    },
    memoryUsed: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: false,
      comment: '内存使用量(字节)'
    },
    memoryUsage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '内存使用率(%)'
    },
    memoryBuffers: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: true,
      comment: '内存Buffers(字节)'
    },
    memoryCached: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: true,
      comment: '内存Cached(字节)'
    },
    memorySwapTotal: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: true,
      comment: 'Swap总量(字节)'
    },
    memorySwapUsed: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: true,
      comment: 'Swap使用量(字节)'
    },
    diskTotal: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: false,
      comment: '磁盘总量(字节)'
    },
    diskUsed: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: false,
      comment: '磁盘使用量(字节)'
    },
    diskUsage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '磁盘使用率(%)'
    },
    diskReadIO: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: true,
      comment: '磁盘读IO(次/秒)'
    },
    diskWriteIO: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: true,
      comment: '磁盘写IO(次/秒)'
    },
    diskReadBytes: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: true,
      comment: '磁盘读带宽(字节/秒)'
    },
    diskWriteBytes: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: true,
      comment: '磁盘写带宽(字节/秒)'
    },
    networkIn: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: true,
      comment: '入站流量(字节/秒)'
    },
    networkOut: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: true,
      comment: '出站流量(字节/秒)'
    },
    networkConnections: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '网络连接数'
    },
    apiTotalRequests: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: 'API总请求数'
    },
    apiSuccessRequests: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: 'API成功请求数'
    },
    apiFailedRequests: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: 'API失败请求数'
    },
    apiAvgResponseTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: 'API平均响应时间(ms)'
    },
    apiP95ResponseTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: 'API P95响应时间(ms)'
    },
    apiP99ResponseTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: 'API P99响应时间(ms)'
    },
    apiQps: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: true,
      comment: 'API QPS(每秒请求数)'
    },
    apiLoadLevel: {
      type: DataTypes.ENUM('low', 'normal', 'medium', 'high', 'overload'),
      defaultValue: 'normal',
      allowNull: true,
      comment: '接口负载等级：low低、normal正常、medium中、high高、overload过载'
    },
    processCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '进程数'
    },
    threadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '线程数'
    },
    uptime: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: true,
      comment: '系统运行时长(秒)'
    },
    hasAlert: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否有预警'
    },
    alertType: {
      type: DataTypes.ENUM('none', 'cpu', 'memory', 'disk', 'network', 'api', 'system'),
      defaultValue: 'none',
      allowNull: false,
      comment: '预警类型：none无、cpu CPU、memory内存、disk磁盘、network网络、api接口、system系统'
    },
    alertLevel: {
      type: DataTypes.ENUM('none', 'info', 'warning', 'critical'),
      defaultValue: 'none',
      allowNull: false,
      comment: '预警级别：none无、info提示、warning警告、critical严重'
    },
    alertMessage: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      comment: '预警消息'
    },
    alertThreshold: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '预警阈值配置(JSON)'
    },
    alertValue: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '触发预警的实际值'
    },
    alertResolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
      comment: '预警是否已解决'
    },
    alertResolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '预警解决时间'
    },
    businessVolume: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '业务访问量'
    },
    loadMatchScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100,
      allowNull: true,
      comment: '负载匹配评分(0-100)'
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'low',
      allowNull: true,
      comment: '运维风险等级'
    },
    traceId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '链路追踪ID'
    },
    isPeak: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否为峰值数据'
    },
    peakType: {
      type: DataTypes.ENUM('none', 'cpu', 'memory', 'disk', 'network', 'api'),
      defaultValue: 'none',
      allowNull: true,
      comment: '峰值类型'
    },
    extraInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '扩展信息(JSON)'
    }
  },
  {
    tableName: 'server_monitors',
    comment: '服务器运维监控数据表',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['serverId'] },
      { fields: ['serverName'] },
      { fields: ['serverIp'] },
      { fields: ['environment'] },
      { fields: ['monitorType'] },
      { fields: ['createdAt'] },
      { fields: ['hasAlert'] },
      { fields: ['alertType'] },
      { fields: ['alertLevel'] },
      { fields: ['apiLoadLevel'] },
      { fields: ['riskLevel'] },
      { fields: ['isPeak'] },
      { fields: ['peakType'] },
      { fields: ['serverId', 'createdAt'] }
    ]
  }
)

module.exports = ServerMonitor
