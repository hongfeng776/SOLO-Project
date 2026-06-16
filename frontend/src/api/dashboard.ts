import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

export interface DashboardStats {
  todayOrders: number
  todaySales: number
  todayUsers: number
  todayVisits: number
  weekSales: { date: string; amount: number }[]
  orderStatusStats: { status: number; count: number }[]
  topGoods: { name: string; sales: number; amount: number }[]
  userGrowth: { date: string; count: number }[]
}

export function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return request.get<DashboardStats>('/dashboard/stats')
}
