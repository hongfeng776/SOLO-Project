import { get } from '@utils/request'

export interface DashboardStatistics {
  todayTransactionAmount: number
  todayTransactionCount: number
  pendingAuditCount: number
  activeUserCount: number
  totalProductCount: number
  totalChannelCount: number
}

export interface ChannelStatItem {
  channelCode: string
  channelName: string
  amount: number
  count: number
  percentage: number
}

export interface BusinessTrendItem {
  date: string
  amount: number
  count: number
}

export interface AuditStatItem {
  status: string
  count: number
  percentage: number
}

export function getDashboardStatisticsApi() {
  return get<DashboardStatistics>('/dashboard/statistics')
}

export function getChannelStatisticsApi() {
  return get<ChannelStatItem[]>('/dashboard/channelStatistics')
}

export function getBusinessTrendApi(days: number = 7) {
  return get<BusinessTrendItem[]>(`/dashboard/businessTrend?days=${days}`)
}

export function getAuditStatisticsApi() {
  return get<AuditStatItem[]>('/dashboard/auditStatistics')
}
