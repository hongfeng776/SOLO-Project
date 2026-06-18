export enum DriverStatus {
  NORMAL = 0,
  RESTRICTED = 1,
  TEMP_BAN = 2,
  PERMANENT_BAN = 3
}

export const DriverStatusMap: Record<number, string> = {
  [DriverStatus.NORMAL]: '正常',
  [DriverStatus.RESTRICTED]: '限制接单',
  [DriverStatus.TEMP_BAN]: '临时封禁',
  [DriverStatus.PERMANENT_BAN]: '永久封禁'
}

export const DriverStatusColorMap: Record<number, string> = {
  [DriverStatus.NORMAL]: '#67c23a',
  [DriverStatus.RESTRICTED]: '#e6a23c',
  [DriverStatus.TEMP_BAN]: '#f56c6c',
  [DriverStatus.PERMANENT_BAN]: '#909399'
}

export const DriverStatusTypeMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
  [DriverStatus.NORMAL]: 'success',
  [DriverStatus.RESTRICTED]: 'warning',
  [DriverStatus.TEMP_BAN]: 'danger',
  [DriverStatus.PERMANENT_BAN]: 'info'
}

export enum AccountRiskLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const AccountRiskLevelMap: Record<number, string> = {
  [AccountRiskLevel.LOW]: '低风险',
  [AccountRiskLevel.MEDIUM]: '中风险',
  [AccountRiskLevel.HIGH]: '高风险'
}

export const AccountRiskLevelColorMap: Record<number, string> = {
  [AccountRiskLevel.LOW]: '#67c23a',
  [AccountRiskLevel.MEDIUM]: '#e6a23c',
  [AccountRiskLevel.HIGH]: '#f56c6c'
}

export const AccountRiskLevelTypeMap: Record<number, 'success' | 'warning' | 'danger'> = {
  [AccountRiskLevel.LOW]: 'success',
  [AccountRiskLevel.MEDIUM]: 'warning',
  [AccountRiskLevel.HIGH]: 'danger'
}

export enum StatusOperationType {
  STATUS_CHANGE = 1,
  BATCH_STATUS_CHANGE = 2,
  AUTO_JUDGE = 3,
  ABNORMAL_INTERCEPT = 4,
  UNBAN = 5,
  RECTIFICATION_REMIND = 6
}

export const StatusOperationTypeMap: Record<number, string> = {
  [StatusOperationType.STATUS_CHANGE]: '状态修改',
  [StatusOperationType.BATCH_STATUS_CHANGE]: '批量状态修改',
  [StatusOperationType.AUTO_JUDGE]: '自动判定',
  [StatusOperationType.ABNORMAL_INTERCEPT]: '异常拦截',
  [StatusOperationType.UNBAN]: '解封操作',
  [StatusOperationType.RECTIFICATION_REMIND]: '整改提醒'
}

export const StatusOperationTypeColorMap: Record<number, string> = {
  [StatusOperationType.STATUS_CHANGE]: '#409eff',
  [StatusOperationType.BATCH_STATUS_CHANGE]: '#909399',
  [StatusOperationType.AUTO_JUDGE]: '#67c23a',
  [StatusOperationType.ABNORMAL_INTERCEPT]: '#f56c6c',
  [StatusOperationType.UNBAN]: '#67c23a',
  [StatusOperationType.RECTIFICATION_REMIND]: '#e6a23c'
}

export enum DriverAuditStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  EXCEPTION = 3,
  EXPIRED = 4,
  REVIEW = 5
}

export const DriverAuditStatusMap: Record<number, string> = {
  [DriverAuditStatus.PENDING]: '待审核',
  [DriverAuditStatus.APPROVED]: '已通过',
  [DriverAuditStatus.REJECTED]: '已拒绝',
  [DriverAuditStatus.EXCEPTION]: '审核异常',
  [DriverAuditStatus.EXPIRED]: '资质过期',
  [DriverAuditStatus.REVIEW]: '待复核'
}

export const DriverAuditStatusColorMap: Record<number, string> = {
  [DriverAuditStatus.PENDING]: '#e6a23c',
  [DriverAuditStatus.APPROVED]: '#67c23a',
  [DriverAuditStatus.REJECTED]: '#f56c6c',
  [DriverAuditStatus.EXCEPTION]: '#909399',
  [DriverAuditStatus.EXPIRED]: '#f56c6c',
  [DriverAuditStatus.REVIEW]: '#e6a23c'
}

export enum DriverLevel {
  NEW = 1,
  EXPERIENCED = 2
}

export const DriverLevelMap: Record<number, string> = {
  [DriverLevel.NEW]: '新手司机',
  [DriverLevel.EXPERIENCED]: '老司机'
}

export enum ReputationLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const ReputationLevelMap: Record<number, string> = {
  [ReputationLevel.LOW]: '低信誉',
  [ReputationLevel.MEDIUM]: '中信誉',
  [ReputationLevel.HIGH]: '高信誉'
}

export const ReputationLevelColorMap: Record<number, string> = {
  [ReputationLevel.LOW]: '#f56c6c',
  [ReputationLevel.MEDIUM]: '#e6a23c',
  [ReputationLevel.HIGH]: '#67c23a'
}

export enum QualificationStatus {
  UNCHECKED = 0,
  PASSED = 1,
  FAILED = 2
}

export const QualificationStatusMap: Record<number, string> = {
  [QualificationStatus.UNCHECKED]: '未校验',
  [QualificationStatus.PASSED]: '校验通过',
  [QualificationStatus.FAILED]: '校验不通过'
}

export enum FaceVerifyResult {
  UNCHECKED = 0,
  PASSED = 1,
  FAILED = 2
}

export const FaceVerifyResultMap: Record<number, string> = {
  [FaceVerifyResult.UNCHECKED]: '未核验',
  [FaceVerifyResult.PASSED]: '核验通过',
  [FaceVerifyResult.FAILED]: '核验不通过'
}

export enum OperationType {
  SUBMIT = 1,
  MODIFY = 2,
  APPROVE = 3,
  REJECT = 4,
  REVIEW = 5,
  URGENT = 6,
  REMIND = 7,
  EXPIRED = 8
}

export const OperationTypeMap: Record<number, string> = {
  [OperationType.SUBMIT]: '资料提交',
  [OperationType.MODIFY]: '资料修改',
  [OperationType.APPROVE]: '审核通过',
  [OperationType.REJECT]: '审核驳回',
  [OperationType.REVIEW]: '资料复核',
  [OperationType.URGENT]: '加急审核',
  [OperationType.REMIND]: '提醒补全',
  [OperationType.EXPIRED]: '资质过期'
}

export const VehicleTypeMap: Record<string, string> = {
  'luxury': '豪华型',
  'comfort': '舒适型',
  'economy': '经济型',
  'default': '标准型'
}

export const CityMap: Record<string, string> = {
  'beijing': '北京',
  'shanghai': '上海',
  'guangzhou': '广州',
  'shenzhen': '深圳',
  'default': '其他城市'
}

export enum DriverServiceLevel {
  EXCELLENT = 1,
  NORMAL = 2,
  NEED_RECTIFICATION = 3,
  POOR = 4
}

export const DriverServiceLevelMap: Record<number, string> = {
  [DriverServiceLevel.EXCELLENT]: '优质',
  [DriverServiceLevel.NORMAL]: '普通',
  [DriverServiceLevel.NEED_RECTIFICATION]: '待整改',
  [DriverServiceLevel.POOR]: '劣质'
}

export const DriverServiceLevelColorMap: Record<number, string> = {
  [DriverServiceLevel.EXCELLENT]: '#67c23a',
  [DriverServiceLevel.NORMAL]: '#409eff',
  [DriverServiceLevel.NEED_RECTIFICATION]: '#e6a23c',
  [DriverServiceLevel.POOR]: '#f56c6c'
}

export const DriverServiceLevelTypeMap: Record<number, 'success' | 'primary' | 'warning' | 'danger'> = {
  [DriverServiceLevel.EXCELLENT]: 'success',
  [DriverServiceLevel.NORMAL]: 'primary',
  [DriverServiceLevel.NEED_RECTIFICATION]: 'warning',
  [DriverServiceLevel.POOR]: 'danger'
}

export enum StatPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom'
}

export const StatPeriodMap: Record<string, string> = {
  [StatPeriod.DAY]: '今日',
  [StatPeriod.WEEK]: '本周',
  [StatPeriod.MONTH]: '本月',
  [StatPeriod.CUSTOM]: '自定义'
}

export enum ServiceOperationType {
  DATA_UPDATE = 1,
  LEVEL_CHANGE = 2,
  DATA_CORRECTION = 3,
  ABNORMAL_DETECTION = 4,
  DATA_EXPORT = 5
}

export const ServiceOperationTypeMap: Record<number, string> = {
  [ServiceOperationType.DATA_UPDATE]: '数据更新',
  [ServiceOperationType.LEVEL_CHANGE]: '等级变更',
  [ServiceOperationType.DATA_CORRECTION]: '数据修正',
  [ServiceOperationType.ABNORMAL_DETECTION]: '异常检测',
  [ServiceOperationType.DATA_EXPORT]: '数据导出'
}

export const ServiceOperationTypeColorMap: Record<number, string> = {
  [ServiceOperationType.DATA_UPDATE]: '#409eff',
  [ServiceOperationType.LEVEL_CHANGE]: '#67c23a',
  [ServiceOperationType.DATA_CORRECTION]: '#e6a23c',
  [ServiceOperationType.ABNORMAL_DETECTION]: '#f56c6c',
  [ServiceOperationType.DATA_EXPORT]: '#909399'
}

export enum SubsidyLevel {
  HIGH = 1,
  NORMAL = 2,
  NONE = 3
}

export const SubsidyLevelMap: Record<number, string> = {
  [SubsidyLevel.HIGH]: '高补贴',
  [SubsidyLevel.NORMAL]: '正常补贴',
  [SubsidyLevel.NONE]: '无补贴'
}

export enum OrderPriority {
  HIGHEST = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4
}

export const OrderPriorityMap: Record<number, string> = {
  [OrderPriority.HIGHEST]: '最高优先级',
  [OrderPriority.HIGH]: '较高优先级',
  [OrderPriority.NORMAL]: '普通优先级',
  [OrderPriority.LOW]: '较低优先级'
}

export const ServiceSortFieldOptions = [
  { value: 'totalOrders', label: '接单量' },
  { value: 'completedOrders', label: '完单量' },
  { value: 'completionRate', label: '完单率' },
  { value: 'serviceScore', label: '服务评分' },
  { value: 'complaintRate', label: '投诉率' },
  { value: 'totalIncome', label: '收入' },
  { value: 'onlineHours', label: '在线时长' }
]

export const ExportFieldCategories = [
  { key: 'basic', label: '基础信息', fields: ['name', 'phone', 'city', 'vehicleType'] },
  { key: 'service', label: '服务数据', fields: ['totalOrders', 'completedOrders', 'completionRate', 'serviceScore', 'complaintRate', 'onlineHours'] },
  { key: 'finance', label: '财务数据', fields: ['totalIncome', 'avgOrderAmount'] },
  { key: 'sensitive', label: '敏感信息', fields: ['idCard', 'driverLicenseNo'], permissionRequired: true }
]
