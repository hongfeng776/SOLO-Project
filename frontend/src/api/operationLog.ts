import { http } from '@/utils/request'
import type { OperationLogItem, PaginationParams, PaginationResult } from '@/types'

export const getOperationLogListApi = (params: PaginationParams): Promise<PaginationResult<OperationLogItem>> => {
  return http.get<PaginationResult<OperationLogItem>>('/api/v1/operation-logs', params)
}

export const getOperationLogDetailApi = (id: number): Promise<OperationLogItem> => {
  return http.get<OperationLogItem>(`/api/v1/operation-logs/${id}`)
}

export const getOperationStatsApi = (params?: PaginationParams): Promise<Record<string, any>> => {
  return http.get<Record<string, any>>('/api/v1/operation-logs/stats', params)
}

export const exportOperationLogsApi = (params?: PaginationParams): Promise<any> => {
  return http.get<any>('/api/v1/operation-logs/export', params)
}
