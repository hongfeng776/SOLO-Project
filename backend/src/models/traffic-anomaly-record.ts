import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum TrafficAnomalyType {
  MACHINE_EXPOSURE = 'machine_exposure',
  BATCH_DRAINAGE = 'batch_drainage',
  ABNORMAL_POUR = 'abnormal_pour',
  IP_CLUSTER = 'ip_cluster',
  DEVICE_ABNORMAL = 'device_abnormal',
  TRAFFIC_HIJACK = 'traffic_hijack',
  FAKE_RETENTION = 'fake_retention'
}

export const TRAFFIC_ANOMALY_TYPE_NAMES: Record<TrafficAnomalyType, string> = {
  [TrafficAnomalyType.MACHINE_EXPOSURE]: '机器刷曝光',
  [TrafficAnomalyType.BATCH_DRAINAGE]: '批量引流',
  [TrafficAnomalyType.ABNORMAL_POUR]: '异常流量灌入',
  [TrafficAnomalyType.IP_CLUSTER]: 'IP聚集',
  [TrafficAnomalyType.DEVICE_ABNORMAL]: '设备异常',
  [TrafficAnomalyType.TRAFFIC_HIJACK]: '流量劫持',
  [TrafficAnomalyType.FAKE_RETENTION]: '虚假流量留存'
}

export const TRAFFIC_ANOMALY_TYPE_COLORS: Record<TrafficAnomalyType, string> = {
  [TrafficAnomalyType.MACHINE_EXPOSURE]: '#f56c6c',
  [TrafficAnomalyType.BATCH_DRAINAGE]: '#e6a23c',
  [TrafficAnomalyType.ABNORMAL_POUR]: '#c45656',
  [TrafficAnomalyType.IP_CLUSTER]: '#f56c6c',
  [TrafficAnomalyType.DEVICE_ABNORMAL]: '#e6a23c',
  [TrafficAnomalyType.TRAFFIC_HIJACK]: '#c45656',
  [TrafficAnomalyType.FAKE_RETENTION]: '#f56c6c'
}

export enum TrafficAnomalyRiskLevel {
  NORMAL = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const TRAFFIC_ANOMALY_RISK_LEVEL_NAMES: Record<TrafficAnomalyRiskLevel, string> = {
  [TrafficAnomalyRiskLevel.NORMAL]: '正常',
  [TrafficAnomalyRiskLevel.LOW]: '轻微异常',
  [TrafficAnomalyRiskLevel.MEDIUM]: '中度异常',
  [TrafficAnomalyRiskLevel.HIGH]: '重度异常'
}

export const TRAFFIC_ANOMALY_RISK_LEVEL_COLORS: Record<TrafficAnomalyRiskLevel, string> = {
  [TrafficAnomalyRiskLevel.NORMAL]: '#67c23a',
  [TrafficAnomalyRiskLevel.LOW]: '#e6a23c',
  [TrafficAnomalyRiskLevel.MEDIUM]: '#f56c6c',
  [TrafficAnomalyRiskLevel.HIGH]: '#c45656'
}

export enum TrafficAnomalyStatus {
  PENDING = 0,
  INTERCEPTED = 1,
  FLOW_LIMITED = 2,
  ACCOUNT_DOWNGRADED = 3,
  RELEASED = 4,
  PERMANENT_BANNED = 5
}

export const TRAFFIC_ANOMALY_STATUS_NAMES: Record<TrafficAnomalyStatus, string> = {
  [TrafficAnomalyStatus.PENDING]: '待处置',
  [TrafficAnomalyStatus.INTERCEPTED]: '已拦截',
  [TrafficAnomalyStatus.FLOW_LIMITED]: '已限流',
  [TrafficAnomalyStatus.ACCOUNT_DOWNGRADED]: '账号降权',
  [TrafficAnomalyStatus.RELEASED]: '已解封',
  [TrafficAnomalyStatus.PERMANENT_BANNED]: '永久封禁'
}

export const TRAFFIC_ANOMALY_STATUS_COLORS: Record<TrafficAnomalyStatus, string> = {
  [TrafficAnomalyStatus.PENDING]: '#e6a23c',
  [TrafficAnomalyStatus.INTERCEPTED]: '#f56c6c',
  [TrafficAnomalyStatus.FLOW_LIMITED]: '#e6a23c',
  [TrafficAnomalyStatus.ACCOUNT_DOWNGRADED]: '#f56c6c',
  [TrafficAnomalyStatus.RELEASED]: '#67c23a',
  [TrafficAnomalyStatus.PERMANENT_BANNED]: '#c45656'
}

export enum TrafficAnomalySource {
  SYSTEM_DETECT = 'system_detect',
  MANUAL_REPORT = 'manual_report',
  EXTERNAL_FEEDBACK = 'external_feedback'
}

export const TRAFFIC_ANOMALY_SOURCE_NAMES: Record<TrafficAnomalySource, string> = {
  [TrafficAnomalySource.SYSTEM_DETECT]: '系统识别',
  [TrafficAnomalySource.MANUAL_REPORT]: '人工上报',
  [TrafficAnomalySource.EXTERNAL_FEEDBACK]: '外部反馈'
}

export const ANOMALY_EXPOSURE_FREQUENCY_THRESHOLD = 1000
export const ANOMALY_SAME_IP_THRESHOLD = 50
export const ANOMALY_SAME_DEVICE_THRESHOLD = 20
export const ANOMALY_SHORT_WINDOW_MS = 5 * 60 * 1000
export const ANOMALY_CONFIDENCE_THRESHOLD = 0.7
export const ANOMALY_AUTO_INTERCEPT_LEVEL = TrafficAnomalyRiskLevel.HIGH

class TrafficAnomalyRecord extends Model<InferAttributes<TrafficAnomalyRecord>, InferCreationAttributes<TrafficAnomalyRecord>> {
  declare id: CreationOptional<number>
  declare contentId: CreationOptional<number>
  declare contentTitle: CreationOptional<string>
  declare userId: number
  declare userName: string
  declare anomalyType: TrafficAnomalyType
  declare riskLevel: TrafficAnomalyRiskLevel
  declare status: TrafficAnomalyStatus
  declare source: TrafficAnomalySource
  declare exposureCount: CreationOptional<number>
  declare exposureFrequency: CreationOptional<number>
  declare uniqueUserCount: CreationOptional<number>
  declare uniqueIpCount: CreationOptional<number>
  declare uniqueDeviceCount: CreationOptional<number>
  declare ipAddress: CreationOptional<string>
  declare ipLocation: CreationOptional<string>
  declare deviceInfo: CreationOptional<string>
  declare userSource: CreationOptional<string>
  declare frequencyData: CreationOptional<string>
  declare behaviorDetail: CreationOptional<string>
  declare traceData: CreationOptional<string>
  declare confidence: CreationOptional<number>
  declare affectedContentCount: CreationOptional<number>
  declare affectedUserCount: CreationOptional<number>
  declare estimatedLoss: CreationOptional<number>
  declare autoHandled: CreationOptional<number>
  declare handleResult: CreationOptional<string>
  declare handledAt: CreationOptional<Date>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare detectTime: Date
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

TrafficAnomalyRecord.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    contentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '内容ID'
    },
    contentTitle: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '内容标题'
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '用户ID'
    },
    userName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '用户名'
    },
    anomalyType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '异常类型'
    },
    riskLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '风险等级 0正常 1轻微 2中度 3重度'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '处置状态 0待处置 1已拦截 2已限流 3账号降权 4已解封 5永久封禁'
    },
    source: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'system_detect',
      comment: '来源'
    },
    exposureCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: '总曝光量'
    },
    exposureFrequency: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: '曝光频次(次/小时)'
    },
    uniqueUserCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: '独立用户数'
    },
    uniqueIpCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: '独立IP数'
    },
    uniqueDeviceCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: '独立设备数'
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '主要IP地址'
    },
    ipLocation: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'IP归属地'
    },
    deviceInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '设备信息JSON'
    },
    userSource: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '用户来源渠道'
    },
    frequencyData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '频次数据JSON'
    },
    behaviorDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '行为详情JSON'
    },
    traceData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '溯源轨迹JSON'
    },
    confidence: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '置信度 0-1'
    },
    affectedContentCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: '影响内容数'
    },
    affectedUserCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: '影响用户数'
    },
    estimatedLoss: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
      comment: '预估损失'
    },
    autoHandled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否自动处理 0否 1是'
    },
    handleResult: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '处理结果'
    },
    handledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '处理时间'
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
    detectTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '检测时间'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'traffic_anomaly_record',
    modelName: 'TrafficAnomalyRecord',
    indexes: [
      { fields: ['userId'] },
      { fields: ['anomalyType'] },
      { fields: ['riskLevel'] },
      { fields: ['status'] },
      { fields: ['detectTime'] },
      { fields: ['ipAddress'] }
    ]
  }
)

export default TrafficAnomalyRecord
