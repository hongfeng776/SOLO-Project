import request from '@/utils/request'
import type {
  DashboardStatistics,
  ResourceStatsItem,
  HotRankItem,
  UserActivityStats,
  MemberStatsData,
  CategoryStatsItem,
  ViolationOverviewData,
  OperationLogStatsData,
  ConversionStatsData
} from '@/types'

export const getStatistics = () => {
  return request.get<DashboardStatistics>('/dashboard/statistics')
}

export const getResourceStats = (days = 7) => {
  return request.get<ResourceStatsItem[]>('/dashboard/resource-stats', { days })
}

export const getStatusDistribution = () => {
  return request.get<Record<string, number>>('/dashboard/status-distribution')
}

export const getRecentResources = (limit = 10) => {
  return request.get<any[]>('/dashboard/recent-resources', { limit })
}

export const getRecentAudits = (limit = 10) => {
  return request.get<any[]>('/dashboard/recent-audits', { limit })
}

export const getResourceHotRank = (limit = 10) => {
  return request.get<HotRankItem[]>('/dashboard/hot-rank', { limit })
}

export const getUserActivityStats = (days = 7) => {
  return request.get<UserActivityStats[]>('/dashboard/user-activity', { days })
}

export const getMemberStats = () => {
  return request.get<MemberStatsData>('/dashboard/member-stats')
}

export const getCategoryStats = () => {
  return request.get<CategoryStatsItem[]>('/dashboard/category-stats')
}

export const getViolationOverview = () => {
  return request.get<ViolationOverviewData>('/dashboard/violation-overview')
}

export const getOperationLogStats = (days = 7) => {
  return request.get<OperationLogStatsData>('/dashboard/log-stats', { days })
}

export const getConversionStats = (days = 7) => {
  return request.get<ConversionStatsData>('/dashboard/conversion', { days })
}
