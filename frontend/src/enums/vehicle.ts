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
  DOCUMENT_FORGERY_BLOCK = 12
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
  [OperationType.DOCUMENT_FORGERY_BLOCK]: '证件造假拦截'
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
  [OperationType.DOCUMENT_FORGERY_BLOCK]: '#f56c6c'
}
