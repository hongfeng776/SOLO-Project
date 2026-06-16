export interface Passenger {
  id: number
  nickname: string
  phone: string
  avatar: string
  gender: number
  totalOrders: number
  totalSpend: number
  rating: number
  status: number
  createTime: string
  updateTime: string
}

export interface PassengerQueryParams {
  page?: number
  pageSize?: number
  nickname?: string
  phone?: string
  status?: number
}
