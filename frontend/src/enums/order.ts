export enum OrderStatus {
  PENDING = 1,
  DISPATCHED = 2,
  PICKING_UP = 3,
  IN_PROGRESS = 4,
  COMPLETED = 5,
  CANCELLED = 6,
  EXPIRED = 7
}

export const OrderStatusMap: Record<number, string> = {
  [OrderStatus.PENDING]: '待接单',
  [OrderStatus.DISPATCHED]: '已派单',
  [OrderStatus.PICKING_UP]: '接驾中',
  [OrderStatus.IN_PROGRESS]: '行程中',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.EXPIRED]: '已过期'
}

export const OrderStatusColorMap: Record<number, string> = {
  [OrderStatus.PENDING]: '#e6a23c',
  [OrderStatus.DISPATCHED]: '#409eff',
  [OrderStatus.PICKING_UP]: '#67c23a',
  [OrderStatus.IN_PROGRESS]: '#909399',
  [OrderStatus.COMPLETED]: '#67c23a',
  [OrderStatus.CANCELLED]: '#f56c6c',
  [OrderStatus.EXPIRED]: '#909399'
}
