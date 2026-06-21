export enum RealNameStatus {
  UNVERIFIED = 0,
  PENDING = 1,
  VERIFIED = 2,
  FAILED = 3
}

export const RealNameStatusMap: Record<number, string> = {
  [RealNameStatus.UNVERIFIED]: '未实名',
  [RealNameStatus.PENDING]: '审核中',
  [RealNameStatus.VERIFIED]: '已实名',
  [RealNameStatus.FAILED]: '实名失败'
}

export const RealNameStatusColorMap: Record<number, string> = {
  [RealNameStatus.UNVERIFIED]: '#909399',
  [RealNameStatus.PENDING]: '#e6a23c',
  [RealNameStatus.VERIFIED]: '#67c23a',
  [RealNameStatus.FAILED]: '#f56c6c'
}

export enum PassengerLevel {
  NORMAL = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4,
  DIAMOND = 5
}

export const PassengerLevelMap: Record<number, string> = {
  [PassengerLevel.NORMAL]: '普通',
  [PassengerLevel.SILVER]: '银卡',
  [PassengerLevel.GOLD]: '金卡',
  [PassengerLevel.PLATINUM]: '铂金',
  [PassengerLevel.DIAMOND]: '钻石'
}

export const PassengerLevelColorMap: Record<number, string> = {
  [PassengerLevel.NORMAL]: '#909399',
  [PassengerLevel.SILVER]: '#c0c4cc',
  [PassengerLevel.GOLD]: '#e6a23c',
  [PassengerLevel.PLATINUM]: '#64b5f6',
  [PassengerLevel.DIAMOND]: '#26c6da'
}

export enum SecurityLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const SecurityLevelMap: Record<number, string> = {
  [SecurityLevel.LOW]: '低',
  [SecurityLevel.MEDIUM]: '中',
  [SecurityLevel.HIGH]: '高'
}

export const SecurityLevelColorMap: Record<number, string> = {
  [SecurityLevel.LOW]: '#67c23a',
  [SecurityLevel.MEDIUM]: '#e6a23c',
  [SecurityLevel.HIGH]: '#f56c6c'
}

export enum AuditOperationType {
  INFO_EDIT = 1,
  REALNAME_AUDIT = 2,
  BIND_CHANGE = 3,
  LEVEL_CHANGE = 4,
  TAG_CHANGE = 5,
  RISK_MARK = 6,
  STATUS_CHANGE = 7
}

export const AuditOperationTypeMap: Record<number, string> = {
  [AuditOperationType.INFO_EDIT]: '信息修改',
  [AuditOperationType.REALNAME_AUDIT]: '实名审核',
  [AuditOperationType.BIND_CHANGE]: '绑定变更',
  [AuditOperationType.LEVEL_CHANGE]: '等级变更',
  [AuditOperationType.TAG_CHANGE]: '标签变更',
  [AuditOperationType.RISK_MARK]: '风险标记',
  [AuditOperationType.STATUS_CHANGE]: '状态变更'
}

export const AuditOperationTypeColorMap: Record<number, string> = {
  [AuditOperationType.INFO_EDIT]: '#409eff',
  [AuditOperationType.REALNAME_AUDIT]: '#67c23a',
  [AuditOperationType.BIND_CHANGE]: '#909399',
  [AuditOperationType.LEVEL_CHANGE]: '#e6a23c',
  [AuditOperationType.TAG_CHANGE]: '#26c6da',
  [AuditOperationType.RISK_MARK]: '#f56c6c',
  [AuditOperationType.STATUS_CHANGE]: '#9c27b0'
}

export enum OperationType {
  PHONE_EDIT = 1,
  REALNAME_EDIT = 2,
  ADDRESS_EDIT = 3,
  PASSWORD_EDIT = 4,
  WECHAT_BIND = 5,
  ALIPAY_BIND = 6
}

export const OperationTypeMap: Record<number, string> = {
  [OperationType.PHONE_EDIT]: '修改手机号',
  [OperationType.REALNAME_EDIT]: '修改实名',
  [OperationType.ADDRESS_EDIT]: '修改地址',
  [OperationType.PASSWORD_EDIT]: '修改密码',
  [OperationType.WECHAT_BIND]: '绑定微信',
  [OperationType.ALIPAY_BIND]: '绑定支付宝'
}

export const OperationTypeColorMap: Record<number, string> = {
  [OperationType.PHONE_EDIT]: '#409eff',
  [OperationType.REALNAME_EDIT]: '#67c23a',
  [OperationType.ADDRESS_EDIT]: '#909399',
  [OperationType.PASSWORD_EDIT]: '#e6a23c',
  [OperationType.WECHAT_BIND]: '#07c160',
  [OperationType.ALIPAY_BIND]: '#1677ff'
}

export enum OperatorType {
  USER = 1,
  ADMIN = 2,
  SYSTEM = 3
}

export const OperatorTypeMap: Record<number, string> = {
  [OperatorType.USER]: '用户自己',
  [OperatorType.ADMIN]: '管理员',
  [OperatorType.SYSTEM]: '系统'
}

export const OperatorTypeColorMap: Record<number, string> = {
  [OperatorType.USER]: '#409eff',
  [OperatorType.ADMIN]: '#9c27b0',
  [OperatorType.SYSTEM]: '#909399'
}

export enum BatchOperationType {
  WAKEUP = 'wakeup',
  VERIFY = 'verify',
  RISK_MARK = 'risk_mark'
}

export const BatchOperationTypeMap: Record<string, string> = {
  [BatchOperationType.WAKEUP]: '发送唤醒福利',
  [BatchOperationType.VERIFY]: '账号核验',
  [BatchOperationType.RISK_MARK]: '风险标记'
}

export const BatchOperationTypeColorMap: Record<string, string> = {
  [BatchOperationType.WAKEUP]: '#67c23a',
  [BatchOperationType.VERIFY]: '#409eff',
  [BatchOperationType.RISK_MARK]: '#f56c6c'
}

export enum PassengerTagType {
  NEW_REGISTER = 'new_register',
  HIGH_FREQUENCY = 'high_frequency',
  LOW_FREQUENCY = 'low_frequency',
  HIGH_RISK = 'high_risk',
  VIP = 'vip',
  FIRST_ORDER = 'first_order',
  COMPLAINT = 'complaint'
}

export const PassengerTagTypeMap: Record<string, string> = {
  [PassengerTagType.NEW_REGISTER]: '新注册',
  [PassengerTagType.HIGH_FREQUENCY]: '高频下单',
  [PassengerTagType.LOW_FREQUENCY]: '低频沉睡',
  [PassengerTagType.HIGH_RISK]: '高风险',
  [PassengerTagType.VIP]: 'VIP用户',
  [PassengerTagType.FIRST_ORDER]: '首单用户',
  [PassengerTagType.COMPLAINT]: '投诉用户'
}

export const PassengerTagTypeColorMap: Record<string, string> = {
  [PassengerTagType.NEW_REGISTER]: '#409eff',
  [PassengerTagType.HIGH_FREQUENCY]: '#67c23a',
  [PassengerTagType.LOW_FREQUENCY]: '#909399',
  [PassengerTagType.HIGH_RISK]: '#f56c6c',
  [PassengerTagType.VIP]: '#e6a23c',
  [PassengerTagType.FIRST_ORDER]: '#26c6da',
  [PassengerTagType.COMPLAINT]: '#ff9800'
}

export enum TravelRiskLevel {
  NORMAL = 1,
  WATCH = 2,
  WARNING = 3,
  RESTRICT = 4,
  BANNED = 5
}

export const TravelRiskLevelMap: Record<number, string> = {
  [TravelRiskLevel.NORMAL]: '正常',
  [TravelRiskLevel.WATCH]: '关注',
  [TravelRiskLevel.WARNING]: '警告',
  [TravelRiskLevel.RESTRICT]: '限制',
  [TravelRiskLevel.BANNED]: '封禁'
}

export const TravelRiskLevelColorMap: Record<number, string> = {
  [TravelRiskLevel.NORMAL]: '#67c23a',
  [TravelRiskLevel.WATCH]: '#909399',
  [TravelRiskLevel.WARNING]: '#e6a23c',
  [TravelRiskLevel.RESTRICT]: '#f56c6c',
  [TravelRiskLevel.BANNED]: '#9c27b0'
}

export enum TravelRiskType {
  MALICIOUS_ORDER = 1,
  FREQUENT_CANCEL = 2,
  FAKE_COMPLAINT = 3,
  LATE_NOSHOW = 4,
  ABNORMAL_BEHAVIOR = 5
}

export const TravelRiskTypeMap: Record<number, string> = {
  [TravelRiskType.MALICIOUS_ORDER]: '恶意刷单',
  [TravelRiskType.FREQUENT_CANCEL]: '频繁取消',
  [TravelRiskType.FAKE_COMPLAINT]: '虚假投诉',
  [TravelRiskType.LATE_NOSHOW]: '迟到爽约',
  [TravelRiskType.ABNORMAL_BEHAVIOR]: '异常行为'
}

export const TravelRiskTypeColorMap: Record<number, string> = {
  [TravelRiskType.MALICIOUS_ORDER]: '#f56c6c',
  [TravelRiskType.FREQUENT_CANCEL]: '#e6a23c',
  [TravelRiskType.FAKE_COMPLAINT]: '#9c27b0',
  [TravelRiskType.LATE_NOSHOW]: '#ff9800',
  [TravelRiskType.ABNORMAL_BEHAVIOR]: '#f56c6c'
}

export enum RiskSeverityLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export const RiskSeverityLevelMap: Record<number, string> = {
  [RiskSeverityLevel.LOW]: '低',
  [RiskSeverityLevel.MEDIUM]: '中',
  [RiskSeverityLevel.HIGH]: '高',
  [RiskSeverityLevel.CRITICAL]: '严重'
}

export const RiskSeverityLevelColorMap: Record<number, string> = {
  [RiskSeverityLevel.LOW]: '#67c23a',
  [RiskSeverityLevel.MEDIUM]: '#e6a23c',
  [RiskSeverityLevel.HIGH]: '#f56c6c',
  [RiskSeverityLevel.CRITICAL]: '#9c27b0'
}

export enum TravelRiskStatus {
  PENDING = 0,
  CONFIRMED = 1,
  IGNORED = 2,
  APPEALED = 3
}

export const TravelRiskStatusMap: Record<number, string> = {
  [TravelRiskStatus.PENDING]: '待处理',
  [TravelRiskStatus.CONFIRMED]: '已确认',
  [TravelRiskStatus.IGNORED]: '已忽略',
  [TravelRiskStatus.APPEALED]: '已申诉'
}

export const TravelRiskStatusColorMap: Record<number, string> = {
  [TravelRiskStatus.PENDING]: '#e6a23c',
  [TravelRiskStatus.CONFIRMED]: '#67c23a',
  [TravelRiskStatus.IGNORED]: '#909399',
  [TravelRiskStatus.APPEALED]: '#409eff'
}

export enum ExportStatus {
  PENDING = 0,
  PROCESSING = 1,
  COMPLETED = 2,
  FAILED = 3
}

export const ExportStatusMap: Record<number, string> = {
  [ExportStatus.PENDING]: '待处理',
  [ExportStatus.PROCESSING]: '处理中',
  [ExportStatus.COMPLETED]: '已完成',
  [ExportStatus.FAILED]: '已失败'
}

export const ExportStatusColorMap: Record<number, string> = {
  [ExportStatus.PENDING]: '#909399',
  [ExportStatus.PROCESSING]: '#409eff',
  [ExportStatus.COMPLETED]: '#67c23a',
  [ExportStatus.FAILED]: '#f56c6c'
}

export enum ExportType {
  TRAVEL_BEHAVIOR = 1,
  RISK_RECORD = 2,
  USER_PROFILE = 3
}

export const ExportTypeMap: Record<number, string> = {
  [ExportType.TRAVEL_BEHAVIOR]: '出行行为数据',
  [ExportType.RISK_RECORD]: '风险记录数据',
  [ExportType.USER_PROFILE]: '用户画像数据'
}

export const ExportTypeColorMap: Record<number, string> = {
  [ExportType.TRAVEL_BEHAVIOR]: '#409eff',
  [ExportType.RISK_RECORD]: '#f56c6c',
  [ExportType.USER_PROFILE]: '#e6a23c'
}

export enum ActivityLevel {
  DORMANT = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5
}

export const ActivityLevelMap: Record<number, string> = {
  [ActivityLevel.DORMANT]: '沉睡',
  [ActivityLevel.LOW]: '低',
  [ActivityLevel.MEDIUM]: '中',
  [ActivityLevel.HIGH]: '高',
  [ActivityLevel.VERY_HIGH]: '非常活跃'
}

export const ActivityLevelColorMap: Record<number, string> = {
  [ActivityLevel.DORMANT]: '#909399',
  [ActivityLevel.LOW]: '#67c23a',
  [ActivityLevel.MEDIUM]: '#409eff',
  [ActivityLevel.HIGH]: '#e6a23c',
  [ActivityLevel.VERY_HIGH]: '#f56c6c'
}

export enum ConsumptionLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  ULTRA = 4
}

export const ConsumptionLevelMap: Record<number, string> = {
  [ConsumptionLevel.LOW]: '低消费',
  [ConsumptionLevel.MEDIUM]: '中消费',
  [ConsumptionLevel.HIGH]: '高消费',
  [ConsumptionLevel.ULTRA]: '超高消费'
}

export const ConsumptionLevelColorMap: Record<number, string> = {
  [ConsumptionLevel.LOW]: '#909399',
  [ConsumptionLevel.MEDIUM]: '#409eff',
  [ConsumptionLevel.HIGH]: '#e6a23c',
  [ConsumptionLevel.ULTRA]: '#f56c6c'
}

export enum ReportStatus {
  PENDING_REVIEW = 0,
  REVIEWED = 1,
  EXECUTED = 2,
  ARCHIVED = 3
}

export const ReportStatusMap: Record<number, string> = {
  [ReportStatus.PENDING_REVIEW]: '待审阅',
  [ReportStatus.REVIEWED]: '已审阅',
  [ReportStatus.EXECUTED]: '已执行',
  [ReportStatus.ARCHIVED]: '已归档'
}

export const ReportStatusColorMap: Record<number, string> = {
  [ReportStatus.PENDING_REVIEW]: '#e6a23c',
  [ReportStatus.REVIEWED]: '#409eff',
  [ReportStatus.EXECUTED]: '#67c23a',
  [ReportStatus.ARCHIVED]: '#909399'
}

export enum ReportType {
  AUTO = 1,
  MANUAL = 2
}

export const ReportTypeMap: Record<number, string> = {
  [ReportType.AUTO]: '自动生成',
  [ReportType.MANUAL]: '手动生成'
}

export const ReportTypeColorMap: Record<number, string> = {
  [ReportType.AUTO]: '#409eff',
  [ReportType.MANUAL]: '#e6a23c'
}
