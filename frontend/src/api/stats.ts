import { get } from '@utils/request'
import type { OverviewStats, TrendDataItem } from '@/types/business'

export const getOverviewStats = (): Promise<OverviewStats> => {
  return get<OverviewStats>('/stats/overview')
}

export const getContentStats = (): Promise<Record<string, number>> => {
  return get<Record<string, number>>('/stats/content')
}

export const getCreatorStats = (): Promise<Record<string, number>> => {
  return get<Record<string, number>>('/stats/creator')
}

export const getOrderStats = (): Promise<Record<string, number>> => {
  return get<Record<string, number>>('/stats/order')
}

export const getTrendStats = (params: {
  type: string
  startDate: string
  endDate: string
}): Promise<TrendDataItem[]> => {
  return get<TrendDataItem[]>('/stats/trend', params)
}
