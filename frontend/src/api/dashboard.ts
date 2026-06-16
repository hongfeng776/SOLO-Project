import request from '@/utils/request'

export interface StatisticsData {
  resourceCount: number
  templateCount: number
  userCount: number
  memberCount: number
  pendingAuditCount: number
  todayResourceCount: number
  todayUserCount: number
}

export interface ResourceStatsItem {
  date: string
  count: number
}

export interface StatusDistribution {
  draft: number
  pending: number
  approved: number
  rejected: number
  published: number
  offline: number
}

export const getStatistics = () => {
  return request.get<StatisticsData>('/dashboard/statistics')
}

export const getResourceStats = (days = 7) => {
  return request.get<ResourceStatsItem[]>('/dashboard/resource-stats', { days })
}

export const getStatusDistribution = () => {
  return request.get<StatusDistribution>('/dashboard/status-distribution')
}

export const getRecentResources = (limit = 10) => {
  return request.get<any[]>('/dashboard/recent-resources', { limit })
}

export const getRecentAudits = (limit = 10) => {
  return request.get<any[]>('/dashboard/recent-audits', { limit })
}
