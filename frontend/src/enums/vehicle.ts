export enum VehicleStatus {
  IDLE = 0,
  IN_SERVICE = 1,
  MAINTENANCE = 2,
  SCRAPPED = 3
}

export const VehicleStatusMap: Record<number, string> = {
  [VehicleStatus.IDLE]: '空闲',
  [VehicleStatus.IN_SERVICE]: '运营中',
  [VehicleStatus.MAINTENANCE]: '维修中',
  [VehicleStatus.SCRAPPED]: '已报废'
}

export const VehicleStatusColorMap: Record<number, string> = {
  [VehicleStatus.IDLE]: '#67c23a',
  [VehicleStatus.IN_SERVICE]: '#409eff',
  [VehicleStatus.MAINTENANCE]: '#e6a23c',
  [VehicleStatus.SCRAPPED]: '#909399'
}

export enum VehicleAuditStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2
}

export const VehicleAuditStatusMap: Record<number, string> = {
  [VehicleAuditStatus.PENDING]: '待审核',
  [VehicleAuditStatus.APPROVED]: '已通过',
  [VehicleAuditStatus.REJECTED]: '已拒绝'
}
