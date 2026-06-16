import { get } from '@/utils/axios'

export interface DashboardStatistics {
  totalOrders: number
  totalAmount: number
  totalUsers: number
  totalCommission: number
  todayOrders: number
  todayAmount: number
  weekGrowth: number
  monthGrowth: number
}

export interface OrderTrendItem {
  date: string
  orders: number
  amount: number
}

export interface ChannelDistributionItem {
  name: string
  value: number
}

export function getStatisticsApi(): Promise<DashboardStatistics> {
  return get<DashboardStatistics>('/dashboard/statistics')
}

export function getOrderTrendApi(days: number = 7): Promise<OrderTrendItem[]> {
  return get<OrderTrendItem[]>('/dashboard/order-trend', { days })
}

export function getChannelDistributionApi(): Promise<ChannelDistributionItem[]> {
  return get<ChannelDistributionItem[]>('/dashboard/channel-distribution')
}
