export interface Driver {
  id: number
  name: string
  phone: string
  idCard: string
  avatar: string
  driverLicenseNo: string
  driverLicenseImg: string
  status: number
  auditStatus: number
  totalOrders: number
  totalIncome: number
  rating: number
  createTime: string
  updateTime: string
}

export interface DriverQueryParams {
  page?: number
  pageSize?: number
  name?: string
  phone?: string
  status?: number
  auditStatus?: number
}
