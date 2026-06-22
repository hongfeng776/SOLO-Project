import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum TrafficAnomalyHandleType {
  INTERCEPT_FLOW = 'intercept_flow',
  CONTENT_FLOW_LIMIT = 'content_flow_limit',
  ACCOUNT_DOWNGRADE = 'account_downgrade',
  PERMANENT_BAN = 'permanent_ban',
  CLEAN_DATA = 'clean_data',
  RELEASE_CONTROL = 'release_control',
  BATCH_CLEAN = 'batch_clean',
  BATCH_RELEASE = 'batch_release',
  BATCH_BAN = 'batch_ban'
}

export const TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES: Record<TrafficAnomalyHandleType, string> = {
  [TrafficAnomalyHandleType.INTERCEPT_FLOW]: '拦截流量',
  [TrafficAnomalyHandleType.CONTENT_FLOW_LIMIT]: '内容限流',
  [TrafficAnomalyHandleType.ACCOUNT_DOWNGRADE]: '账号降权',
  [TrafficAnomalyHandleType.PERMANENT_BAN]: '永久封禁',
  [TrafficAnomalyHandleType.CLEAN_DATA]: '清理异常数据',
  [TrafficAnomalyHandleType.RELEASE_CONTROL]: '解除风控',
  [TrafficAnomalyHandleType.BATCH_CLEAN]: '批量清理',
  [TrafficAnomalyHandleType.BATCH_RELEASE]: '批量解除',
  [TrafficAnomalyHandleType.BATCH_BAN]: '批量封禁'
}

export const TRAFFIC_ANOMALY_HANDLE_TYPE_COLORS: Record<TrafficAnomalyHandleType, string> = {
  [TrafficAnomalyHandleType.INTERCEPT_FLOW]: '#f56c6c',
  [TrafficAnomalyHandleType.CONTENT_FLOW_LIMIT]: '#e6a23c',
  [TrafficAnomalyHandleType.ACCOUNT_DOWNGRADE]: '#f56c6c',
  [TrafficAnomalyHandleType.PERMANENT_BAN]: '#c45656',
  [TrafficAnomalyHandleType.CLEAN_DATA]: '#67c23a',
  [TrafficAnomalyHandleType.RELEASE_CONTROL]: '#67c23a',
  [TrafficAnomalyHandleType.BATCH_CLEAN]: '#67c23a',
  [TrafficAnomalyHandleType.BATCH_RELEASE]: '#67c23a',
  [TrafficAnomalyHandleType.BATCH_BAN]: '#c45656'
}

export enum TrafficAnomalyHandleStatus {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
  PARTIAL = 3
}

export const TRAFFIC_ANOMALY_HANDLE_STATUS_NAMES: Record<TrafficAnomalyHandleStatus, string> = {
  [TrafficAnomalyHandleStatus.PENDING]: '待处理',
  [TrafficAnomalyHandleStatus.SUCCESS]: '处理成功',
  [TrafficAnomalyHandleStatus.FAILED]: '处理失败',
  [TrafficAnomalyHandleStatus.PARTIAL]: '部分成功'
}

export const TRAFFIC_ANOMALY_HANDLE_STATUS_COLORS: Record<TrafficAnomalyHandleStatus, string> = {
  [TrafficAnomalyHandleStatus.PENDING]: '#e6a23c',
  [TrafficAnomalyHandleStatus.SUCCESS]: '#67c23a',
  [TrafficAnomalyHandleStatus.FAILED]: '#f56c6c',
  [TrafficAnomalyHandleStatus.PARTIAL]: '#e6a23c'
}

export enum TrafficAnomalyBlockReason {
  AUTO_INTERCEPT = 'auto_intercept',
  HIGH_RISK = 'high_risk',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  DUPLICATE_ANOMALY = 'duplicate_anomaly',
  FAKE_DATA = 'fake_data',
  MALICIOUS_OPERATION = 'malicious_operation',
  DATA_INCONSISTENCY = 'data_inconsistency',
  COMPLIANCE_VIOLATION = 'compliance_violation'
}

export const TRAFFIC_ANOMALY_BLOCK_REASON_NAMES: Record<TrafficAnomalyBlockReason, string> = {
  [TrafficAnomalyBlockReason.AUTO_INTERCEPT]: '系统自动拦截',
  [TrafficAnomalyBlockReason.HIGH_RISK]: '高风险异常',
  [TrafficAnomalyBlockReason.SUSPICIOUS_PATTERN]: '可疑行为模式',
  [TrafficAnomalyBlockReason.DUPLICATE_ANOMALY]: '重复异常流量',
  [TrafficAnomalyBlockReason.FAKE_DATA]: '虚假流量数据',
  [TrafficAnomalyBlockReason.MALICIOUS_OPERATION]: '恶意操作',
  [TrafficAnomalyBlockReason.DATA_INCONSISTENCY]: '数据不一致',
  [TrafficAnomalyBlockReason.COMPLIANCE_VIOLATION]: '合规性违规'
}

class TrafficAnomalyHandleLog extends Model<InferAttributes<TrafficAnomalyHandleLog>, InferCreationAttributes<TrafficAnomalyHandleLog>> {
  declare id: CreationOptional<number>
  declare anomalyId: number
  declare handleType: TrafficAnomalyHandleType
  declare handleStatus: TrafficAnomalyHandleStatus
  declare oldStatus: CreationOptional<number>
  declare newStatus: CreationOptional<number>
  declare handleReason: CreationOptional<string>
  declare handleDetail: CreationOptional<string>
  declare blockReason: CreationOptional<TrafficAnomalyBlockReason>
  declare blockDetail: CreationOptional<string>
  declare affectedContentIds: CreationOptional<string>
  declare affectedUserIds: CreationOptional<string>
  declare cleanedExposureCount: CreationOptional<number>
  declare authenticityScore: CreationOptional<number>
  declare complianceScore: CreationOptional<number>
  declare handleCost: CreationOptional<number>
  declare handleResult: CreationOptional<string>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare operatorIp: CreationOptional<string>
  declare userAgent: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

TrafficAnomalyHandleLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    anomalyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '异常记录ID'
    },
    handleType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '处置类型'
    },
    handleStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '处置状态 0待处理 1成功 2失败 3部分成功'
    },
    oldStatus: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '原处置状态'
    },
    newStatus: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '新处置状态'
    },
    handleReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '处置原因'
    },
    handleDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '处置详情JSON'
    },
    blockReason: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '拦截原因'
    },
    blockDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '拦截详情JSON'
    },
    affectedContentIds: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '影响内容ID列表JSON'
    },
    affectedUserIds: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '影响用户ID列表JSON'
    },
    cleanedExposureCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: '清理曝光量'
    },
    authenticityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '真实性评分 0-100'
    },
    complianceScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '合规性评分 0-100'
    },
    handleCost: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: '处置耗时(ms)'
    },
    handleResult: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '处置结果'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人名称'
    },
    operatorIp: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人IP'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'UA信息'
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'traffic_anomaly_handle_log',
    modelName: 'TrafficAnomalyHandleLog',
    indexes: [
      { fields: ['anomalyId'] },
      { fields: ['handleType'] },
      { fields: ['handleStatus'] },
      { fields: ['operatorId'] },
      { fields: ['createTime'] }
    ]
  }
)

export default TrafficAnomalyHandleLog
