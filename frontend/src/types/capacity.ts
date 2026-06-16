export interface CapacityType {
  id: number
  name: string
  code: string
  basePrice: number
  perKmPrice: number
  perMinPrice: number
  minCharge: number
  description: string
  status: number
  createTime: string
  updateTime: string
}

export interface CapacityMonitor {
  totalOnline: number
  totalInOrder: number
  totalIdle: number
  typeDistribution: Array<{
    type: number
    typeName: string
    onlineCount: number
    inOrderCount: number
  }>
  hotAreas: Array<{
    area: string
    orderCount: number
    driverCount: number
  }>
}
