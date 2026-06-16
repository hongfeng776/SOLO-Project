import { http } from '@/utils/request'
import type { DashboardStats, PlayTrendItem, AuditEfficiencyItem, RevenueOverviewItem } from '@/types'

export const getDashboardStatsApi = (): Promise<DashboardStats> => {
  return http.get<DashboardStats>('/api/v1/dashboard/stats')
}

export const getPlayTrendApi = (days?: number): Promise<PlayTrendItem[]> => {
  return http.get<PlayTrendItem[]>('/api/v1/dashboard/play-trend', days ? { days } : {})
}

export const getAuditEfficiencyApi = (days?: number): Promise<AuditEfficiencyItem[]> => {
  return http.get<AuditEfficiencyItem[]>('/api/v1/dashboard/audit-efficiency', days ? { days } : {})
}

export const getRevenueOverviewApi = (days?: number): Promise<RevenueOverviewItem[]> => {
  return http.get<RevenueOverviewItem[]>('/api/v1/dashboard/revenue-overview', days ? { days } : {})
}
