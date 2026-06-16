export interface Vehicle {
  id: number
  plateNumber: string
  brand: string
  model: string
  color: string
  capacityType: number
  seats: number
  vehicleImg: string
  registrationDate: string
  inspectionDate: string
  insuranceDate: string
  status: number
  auditStatus: number
  driverId: number | null
  driverName: string | null
  createTime: string
  updateTime: string
}

export interface VehicleQueryParams {
  page?: number
  pageSize?: number
  plateNumber?: string
  brand?: string
  capacityType?: number
  status?: number
  auditStatus?: number
}
