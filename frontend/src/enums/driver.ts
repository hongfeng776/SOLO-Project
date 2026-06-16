export enum DriverStatus {
  OFFLINE = 0,
  ONLINE = 1,
  IN_ORDER = 2,
  SUSPENDED = 3
}

export const DriverStatusMap: Record<number, string> = {
  [DriverStatus.OFFLINE]: '离线',
  [DriverStatus.ONLINE]: '在线',
  [DriverStatus.IN_ORDER]: '接单中',
  [DriverStatus.SUSPENDED]: '已封禁'
}

export const DriverStatusColorMap: Record<number, string> = {
  [DriverStatus.OFFLINE]: '#909399',
  [DriverStatus.ONLINE]: '#67c23a',
  [DriverStatus.IN_ORDER]: '#409eff',
  [DriverStatus.SUSPENDED]: '#f56c6c'
}

export enum DriverAuditStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2
}

export const DriverAuditStatusMap: Record<number, string> = {
  [DriverAuditStatus.PENDING]: '待审核',
  [DriverAuditStatus.APPROVED]: '已通过',
  [DriverAuditStatus.REJECTED]: '已拒绝'
}
