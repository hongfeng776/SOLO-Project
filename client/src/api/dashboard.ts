import { get } from '@utils/request'
import type { IApiResponse, IDashboardStats, IAssetTrend, IFundFlow, IRiskAlert } from '@/types/api'

export interface IRecentFlow extends IFundFlow {
  customerName: string
}

export interface IRecentAlert extends IRiskAlert {
  targetName: string
}

export function getStats(): Promise<IApiResponse<IDashboardStats>> {
  return get<IDashboardStats>('/api/dashboard/stats')
}

export function getRecentFlows(limit = 10): Promise<IApiResponse<IRecentFlow[]>> {
  return get<IRecentFlow[]>('/api/dashboard/recent-flows', { limit })
}

export function getRecentAlerts(limit = 10): Promise<IApiResponse<IRecentAlert[]>> {
  return get<IRecentAlert[]>('/api/dashboard/recent-alerts', { limit })
}

export function getAssetTrend(days = 7): Promise<IApiResponse<IAssetTrend[]>> {
  return get<IAssetTrend[]>('/api/dashboard/asset-trend', { days })
}
