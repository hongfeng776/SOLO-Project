import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

export interface DashboardOverview {
  todayGmv: number
  todayOrders: number
  todayUsers: number
  todayRefundRate: number
  todayConversionRate: number
  todayAvgOrderValue: number
  yesterdayGmv: number
  yesterdayOrders: number
  yesterdayUsers: number
  gmvGrowth: number
  ordersGrowth: number
  usersGrowth: number
}

export interface SalesTrendItem {
  date: string
  amount: number
  orders: number
  visitors: number
}

export interface HotGoodsItem {
  id: number
  name: string
  image: string
  sales: number
  amount: number
  stock: number
}

export interface UserStatistics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  levelDistribution: { level: number; levelName: string; count: number }[]
  growthTrend: { date: string; count: number }[]
}

export interface OrderStatistics {
  totalOrders: number
  pendingPayment: number
  pendingShipment: number
  shipped: number
  completed: number
  cancelled: number
  statusDistribution: { status: number; statusName: string; count: number }[]
  amountDistribution: { range: string; count: number }[]
}

export interface MarketingStatistics {
  campaigns: {
    id: number
    name: string
    type: string
    cost: number
    revenue: number
    roi: number
    orders: number
  }[]
  totalCost: number
  totalRevenue: number
  totalRoi: number
}

export interface AftersaleStatistics {
  totalRequests: number
  pending: number
  processing: number
  completed: number
  rejected: number
  refundAmount: number
  typeDistribution: { type: number; typeName: string; count: number }[]
}

export interface MerchantStatistics {
  totalMerchants: number
  activeMerchants: number
  pendingReview: number
  newMerchants: number
  salesRanking: { id: number; name: string; amount: number; orders: number }[]
  categoryDistribution: { category: string; count: number }[]
}

export interface RealtimeOrder {
  id: number
  orderNo: string
  username: string
  goodsName: string
  amount: number
  status: number
  statusName: string
  createdAt: string
}

export function getDashboardOverview(): Promise<ApiResponse<DashboardOverview>> {
  return request.get<DashboardOverview>('/statistics/dashboard/overview')
}

export function getSalesTrend(days: number = 7): Promise<ApiResponse<SalesTrendItem[]>> {
  return request.get<SalesTrendItem[]>('/statistics/sales/trend', { params: { days } })
}

export function getHotGoods(limit: number = 10): Promise<ApiResponse<HotGoodsItem[]>> {
  return request.get<HotGoodsItem[]>('/statistics/goods/hot', { params: { limit } })
}

export function getUserStatistics(days: number = 30): Promise<ApiResponse<UserStatistics>> {
  return request.get<UserStatistics>('/statistics/user', { params: { days } })
}

export function getOrderStatistics(days: number = 30): Promise<ApiResponse<OrderStatistics>> {
  return request.get<OrderStatistics>('/statistics/order', { params: { days } })
}

export function getMarketingStatistics(days: number = 30): Promise<ApiResponse<MarketingStatistics>> {
  return request.get<MarketingStatistics>('/statistics/marketing', { params: { days } })
}

export function getAftersaleStatistics(days: number = 30): Promise<ApiResponse<AftersaleStatistics>> {
  return request.get<AftersaleStatistics>('/statistics/aftersale', { params: { days } })
}

export function getMerchantStatistics(days: number = 30): Promise<ApiResponse<MerchantStatistics>> {
  return request.get<MerchantStatistics>('/statistics/merchant', { params: { days } })
}

export function getRealtimeOrders(limit: number = 10): Promise<ApiResponse<RealtimeOrder[]>> {
  return request.get<RealtimeOrder[]>('/statistics/order/realtime', { params: { limit } })
}
