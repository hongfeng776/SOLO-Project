export enum VehicleStatus {
  IDLE = 0,
  IN_SERVICE = 1,
  MAINTENANCE = 2,
  SCRAPPED = 3,
  LOCKED = 4
}

export const VehicleStatusMap: Record<number, string> = {
  [VehicleStatus.IDLE]: '空闲',
  [VehicleStatus.IN_SERVICE]: '运营中',
  [VehicleStatus.MAINTENANCE]: '维修中',
  [VehicleStatus.SCRAPPED]: '已报废',
  [VehicleStatus.LOCKED]: '已锁定'
}

export const VehicleStatusColorMap: Record<number, string> = {
  [VehicleStatus.IDLE]: '#67c23a',
  [VehicleStatus.IN_SERVICE]: '#409eff',
  [VehicleStatus.MAINTENANCE]: '#e6a23c',
  [VehicleStatus.SCRAPPED]: '#909399',
  [VehicleStatus.LOCKED]: '#f56c6c'
}

export enum VehicleAuditStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  EXPIRED = 3
}

export const VehicleAuditStatusMap: Record<number, string> = {
  [VehicleAuditStatus.PENDING]: '待审核',
  [VehicleAuditStatus.APPROVED]: '已备案',
  [VehicleAuditStatus.REJECTED]: '已驳回',
  [VehicleAuditStatus.EXPIRED]: '已过期'
}

export const VehicleAuditStatusTypeMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
  [VehicleAuditStatus.PENDING]: 'warning',
  [VehicleAuditStatus.APPROVED]: 'success',
  [VehicleAuditStatus.REJECTED]: 'danger',
  [VehicleAuditStatus.EXPIRED]: 'info'
}

export enum OperationLevel {
  S = 1,
  A = 2,
  B = 3,
  C = 4
}

export const OperationLevelMap: Record<number, string> = {
  [OperationLevel.S]: 'S级',
  [OperationLevel.A]: 'A级',
  [OperationLevel.B]: 'B级',
  [OperationLevel.C]: 'C级'
}

export const OperationLevelColorMap: Record<number, string> = {
  [OperationLevel.S]: '#ffd700',
  [OperationLevel.A]: '#409eff',
  [OperationLevel.B]: '#67c23a',
  [OperationLevel.C]: '#909399'
}

export enum EmissionStandard {
  I = 1,
  II = 2,
  III = 3,
  IV = 4,
  V = 5,
  VI = 6
}

export const EmissionStandardMap: Record<number, string> = {
  [EmissionStandard.I]: '国一',
  [EmissionStandard.II]: '国二',
  [EmissionStandard.III]: '国三',
  [EmissionStandard.IV]: '国四',
  [EmissionStandard.V]: '国五',
  [EmissionStandard.VI]: '国六'
}

export const EmissionStandardColorMap: Record<number, string> = {
  [EmissionStandard.I]: '#f56c6c',
  [EmissionStandard.II]: '#f56c6c',
  [EmissionStandard.III]: '#e6a23c',
  [EmissionStandard.IV]: '#e6a23c',
  [EmissionStandard.V]: '#67c23a',
  [EmissionStandard.VI]: '#67c23a'
}

export enum VehicleType {
  SEDAN = 1,
  SUV = 2,
  VAN = 3,
  TRUCK = 4,
  MPV = 5
}

export const VehicleTypeMap: Record<number, string> = {
  [VehicleType.SEDAN]: '轿车',
  [VehicleType.SUV]: 'SUV',
  [VehicleType.VAN]: '面包车',
  [VehicleType.TRUCK]: '货车',
  [VehicleType.MPV]: 'MPV'
}

export enum RiskLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const RiskLevelMap: Record<number, string> = {
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险'
}

export const RiskLevelColorMap: Record<number, string> = {
  [RiskLevel.LOW]: '#67c23a',
  [RiskLevel.MEDIUM]: '#e6a23c',
  [RiskLevel.HIGH]: '#f56c6c'
}

export enum OperationType {
  CREATE = 1,
  UPDATE = 2,
  APPROVE = 3,
  REJECT = 4,
  BATCH_REVIEW = 5,
  MARK_EXPIRED = 6,
  LOCK = 7,
  UNLOCK = 8,
  REVIEW = 9,
  FRAUD_BLOCK = 10,
  DUPLICATE_BLOCK = 11,
  DOCUMENT_FORGERY_BLOCK = 12,
  OPERATION_STATUS_CHANGE = 13,
  INITIATE_MAINTENANCE = 14,
  VIOLATION_RECORD = 15,
  BATCH_RESTORE = 16,
  BATCH_MAINTENANCE = 17,
  BATCH_REMIND_RENEWAL = 18,
  ANOMALY_INTERCEPT = 19,
  AUTO_DETERMINE = 20
}

export const OperationTypeMap: Record<number, string> = {
  [OperationType.CREATE]: '新增备案',
  [OperationType.UPDATE]: '修改备案',
  [OperationType.APPROVE]: '审核通过',
  [OperationType.REJECT]: '审核驳回',
  [OperationType.BATCH_REVIEW]: '批量复核',
  [OperationType.MARK_EXPIRED]: '标记过期',
  [OperationType.LOCK]: '车辆锁定',
  [OperationType.UNLOCK]: '车辆解锁',
  [OperationType.REVIEW]: '资料复核',
  [OperationType.FRAUD_BLOCK]: '虚假备案拦截',
  [OperationType.DUPLICATE_BLOCK]: '重复备案拦截',
  [OperationType.DOCUMENT_FORGERY_BLOCK]: '证件造假拦截',
  [OperationType.OPERATION_STATUS_CHANGE]: '运营状态变更',
  [OperationType.INITIATE_MAINTENANCE]: '发起检修',
  [OperationType.VIOLATION_RECORD]: '违规记录',
  [OperationType.BATCH_RESTORE]: '批量恢复运营',
  [OperationType.BATCH_MAINTENANCE]: '批量发起检修',
  [OperationType.BATCH_REMIND_RENEWAL]: '批量提醒换证',
  [OperationType.ANOMALY_INTERCEPT]: '异常拦截',
  [OperationType.AUTO_DETERMINE]: '自动状态判定'
}

export const OperationTypeColorMap: Record<number, string> = {
  [OperationType.CREATE]: '#409eff',
  [OperationType.UPDATE]: '#e6a23c',
  [OperationType.APPROVE]: '#67c23a',
  [OperationType.REJECT]: '#f56c6c',
  [OperationType.BATCH_REVIEW]: '#909399',
  [OperationType.MARK_EXPIRED]: '#909399',
  [OperationType.LOCK]: '#f56c6c',
  [OperationType.UNLOCK]: '#67c23a',
  [OperationType.REVIEW]: '#e6a23c',
  [OperationType.FRAUD_BLOCK]: '#f56c6c',
  [OperationType.DUPLICATE_BLOCK]: '#f56c6c',
  [OperationType.DOCUMENT_FORGERY_BLOCK]: '#f56c6c',
  [OperationType.OPERATION_STATUS_CHANGE]: '#409eff',
  [OperationType.INITIATE_MAINTENANCE]: '#e6a23c',
  [OperationType.VIOLATION_RECORD]: '#f56c6c',
  [OperationType.BATCH_RESTORE]: '#67c23a',
  [OperationType.BATCH_MAINTENANCE]: '#e6a23c',
  [OperationType.BATCH_REMIND_RENEWAL]: '#409eff',
  [OperationType.ANOMALY_INTERCEPT]: '#f56c6c',
  [OperationType.AUTO_DETERMINE]: '#909399'
}

export enum OperationStatus {
  NORMAL = 1,
  MAINTENANCE = 2,
  DOCUMENT_EXPIRED = 3,
  BANNED = 4
}

export const OperationStatusMap: Record<number, string> = {
  [OperationStatus.NORMAL]: '正常运营',
  [OperationStatus.MAINTENANCE]: '停运检修',
  [OperationStatus.DOCUMENT_EXPIRED]: '证件过期',
  [OperationStatus.BANNED]: '违规封禁'
}

export const OperationStatusColorMap: Record<number, string> = {
  [OperationStatus.NORMAL]: '#67c23a',
  [OperationStatus.MAINTENANCE]: '#e6a23c',
  [OperationStatus.DOCUMENT_EXPIRED]: '#f56c6c',
  [OperationStatus.BANNED]: '#909399'
}

export const OperationStatusTypeMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
  [OperationStatus.NORMAL]: 'success',
  [OperationStatus.MAINTENANCE]: 'warning',
  [OperationStatus.DOCUMENT_EXPIRED]: 'danger',
  [OperationStatus.BANNED]: 'info'
}

export enum MaintenanceType {
  ROUTINE = 1,
  ANNUAL_INSPECTION = 2,
  MAJOR_REPAIR = 3,
  ACCIDENT_REPAIR = 4,
  PART_REPLACEMENT = 5
}

export const MaintenanceTypeMap: Record<number, string> = {
  [MaintenanceType.ROUTINE]: '常规保养',
  [MaintenanceType.ANNUAL_INSPECTION]: '年检',
  [MaintenanceType.MAJOR_REPAIR]: '大修',
  [MaintenanceType.ACCIDENT_REPAIR]: '事故维修',
  [MaintenanceType.PART_REPLACEMENT]: '更换零件'
}

export enum MaintenanceStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3
}

export const MaintenanceStatusMap: Record<number, string> = {
  [MaintenanceStatus.PENDING]: '待检修',
  [MaintenanceStatus.IN_PROGRESS]: '检修中',
  [MaintenanceStatus.COMPLETED]: '已完成',
  [MaintenanceStatus.CANCELLED]: '已取消'
}

export enum ViolationType {
  SPEEDING = 1,
  ILLEGAL_ORDER = 2,
  FAKE_OPERATION = 3,
  REFUSAL = 4,
  DETOUR = 5,
  OTHER = 6
}

export const ViolationTypeMap: Record<number, string> = {
  [ViolationType.SPEEDING]: '超速',
  [ViolationType.ILLEGAL_ORDER]: '违规接单',
  [ViolationType.FAKE_OPERATION]: '虚假运营',
  [ViolationType.REFUSAL]: '拒载',
  [ViolationType.DETOUR]: '绕路',
  [ViolationType.OTHER]: '其他'
}

export enum ViolationLevel {
  MINOR = 1,
  MODERATE = 2,
  SEVERE = 3
}

export const ViolationLevelMap: Record<number, string> = {
  [ViolationLevel.MINOR]: '轻微',
  [ViolationLevel.MODERATE]: '一般',
  [ViolationLevel.SEVERE]: '严重'
}

export const ViolationLevelColorMap: Record<number, string> = {
  [ViolationLevel.MINOR]: '#e6a23c',
  [ViolationLevel.MODERATE]: '#f56c6c',
  [ViolationLevel.SEVERE]: '#f56c6c'
}

export enum ViolationStatus {
  PENDING = 0,
  PROCESSING = 1,
  RESOLVED = 2,
  APPEALED = 3
}

export const ViolationStatusMap: Record<number, string> = {
  [ViolationStatus.PENDING]: '待处理',
  [ViolationStatus.PROCESSING]: '处理中',
  [ViolationStatus.RESOLVED]: '已处理',
  [ViolationStatus.APPEALED]: '已申诉'
}

export enum PenaltyType {
  WARNING = 1,
  FINE = 2,
  SUSPEND = 3,
  TEMP_BAN = 4,
  PERM_BAN = 5
}

export const PenaltyTypeMap: Record<number, string> = {
  [PenaltyType.WARNING]: '警告',
  [PenaltyType.FINE]: '罚款',
  [PenaltyType.SUSPEND]: '暂停运营',
  [PenaltyType.TEMP_BAN]: '临时封禁',
  [PenaltyType.PERM_BAN]: '永久封禁'
}

export enum BannedType {
  NONE = 0,
  TEMPORARY = 1,
  PERMANENT = 2
}

export const BannedTypeMap: Record<number, string> = {
  [BannedType.NONE]: '未封禁',
  [BannedType.TEMPORARY]: '临时封禁',
  [BannedType.PERMANENT]: '永久封禁'
}

export enum MaintenanceWarningLevel {
  NONE = 0,
  APPROACHING = 1,
  URGENT = 2,
  OVERDUE = 3
}

export const MaintenanceWarningLevelMap: Record<number, string> = {
  [MaintenanceWarningLevel.NONE]: '无预警',
  [MaintenanceWarningLevel.APPROACHING]: '临近检修',
  [MaintenanceWarningLevel.URGENT]: '紧急检修',
  [MaintenanceWarningLevel.OVERDUE]: '已过期'
}

export const MaintenanceWarningColorMap: Record<number, string> = {
  [MaintenanceWarningLevel.NONE]: '#67c23a',
  [MaintenanceWarningLevel.APPROACHING]: '#e6a23c',
  [MaintenanceWarningLevel.URGENT]: '#f56c6c',
  [MaintenanceWarningLevel.OVERDUE]: '#f56c6c'
}

export enum StatusChangeType {
  OPERATION_STATUS = 1,
  MAINTENANCE_STATUS = 2,
  VIOLATION_STATUS = 3,
  BAN_STATUS = 4,
  WARNING_TRIGGER = 5,
  ANOMALY_INTERCEPT = 6,
  AUTO_DETERMINE = 7
}

export const StatusChangeTypeMap: Record<number, string> = {
  [StatusChangeType.OPERATION_STATUS]: '运营状态变更',
  [StatusChangeType.MAINTENANCE_STATUS]: '检修状态变更',
  [StatusChangeType.VIOLATION_STATUS]: '违规状态变更',
  [StatusChangeType.BAN_STATUS]: '封禁状态变更',
  [StatusChangeType.WARNING_TRIGGER]: '预警触发',
  [StatusChangeType.ANOMALY_INTERCEPT]: '异常拦截',
  [StatusChangeType.AUTO_DETERMINE]: '自动状态判定'
}

export enum TriggerType {
  MANUAL = 1,
  SYSTEM = 2,
  SCHEDULED = 3,
  THRESHOLD = 4
}

export const TriggerTypeMap: Record<number, string> = {
  [TriggerType.MANUAL]: '手动操作',
  [TriggerType.SYSTEM]: '系统自动',
  [TriggerType.SCHEDULED]: '定时任务',
  [TriggerType.THRESHOLD]: '阈值触发'
}
