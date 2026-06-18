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
