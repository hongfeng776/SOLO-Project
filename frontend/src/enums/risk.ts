export enum RiskRuleType {
  ORDER = 1,
  DRIVER = 2,
  PASSENGER = 3,
  VEHICLE = 4
}

export const RiskRuleTypeMap: Record<number, string> = {
  [RiskRuleType.ORDER]: '订单',
  [RiskRuleType.DRIVER]: '司机',
  [RiskRuleType.PASSENGER]: '乘客',
  [RiskRuleType.VEHICLE]: '车辆'
}

export enum RiskCategory {
  FRAUD = 1,
  ABUSE = 2,
  SAFETY = 3,
  PAYMENT = 4,
  ACCOUNT = 5
}

export const RiskCategoryMap: Record<number, string> = {
  [RiskCategory.FRAUD]: '欺诈',
  [RiskCategory.ABUSE]: '滥用',
  [RiskCategory.SAFETY]: '安全',
  [RiskCategory.PAYMENT]: '支付',
  [RiskCategory.ACCOUNT]: '账号'
}

export enum RiskAction {
  ALERT = 1,
  BLOCK = 2,
  REVIEW = 3,
  FREEZE = 4
}

export const RiskActionMap: Record<number, string> = {
  [RiskAction.ALERT]: '告警',
  [RiskAction.BLOCK]: '拦截',
  [RiskAction.REVIEW]: '人工审核',
  [RiskAction.FREEZE]: '冻结'
}

export enum RiskSeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const RiskSeverityMap: Record<number, string> = {
  [RiskSeverity.LOW]: '低',
  [RiskSeverity.MEDIUM]: '中',
  [RiskSeverity.HIGH]: '高'
}

export const RiskSeverityColorMap: Record<number, string> = {
  [RiskSeverity.LOW]: '#67c23a',
  [RiskSeverity.MEDIUM]: '#e6a23c',
  [RiskSeverity.HIGH]: '#f56c6c'
}

export enum RiskRecordStatus {
  PENDING = 0,
  PROCESSED = 1,
  IGNORED = 2
}

export const RiskRecordStatusMap: Record<number, string> = {
  [RiskRecordStatus.PENDING]: '待处理',
  [RiskRecordStatus.PROCESSED]: '已处理',
  [RiskRecordStatus.IGNORED]: '已忽略'
}

export enum RiskTargetType {
  ORDER = 1,
  DRIVER = 2,
  PASSENGER = 3,
  VEHICLE = 4
}

export const RiskTargetTypeMap: Record<number, string> = {
  [RiskTargetType.ORDER]: '订单',
  [RiskTargetType.DRIVER]: '司机',
  [RiskTargetType.PASSENGER]: '乘客',
  [RiskTargetType.VEHICLE]: '车辆'
}
