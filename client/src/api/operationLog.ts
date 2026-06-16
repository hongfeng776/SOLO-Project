import { get } from '@utils/request'
import type { IOperationLog, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export interface ILogListParams extends IPageParams {
  username?: string
  module?: string
  action?: string
  status?: string
  startDate?: string
  endDate?: string
}

export function getLogList(params: ILogListParams): Promise<IApiResponse<IPaginatedData<IOperationLog>>> {
  return get<IPaginatedData<IOperationLog>>('/api/operation-logs', params)
}

export function getLogById(id: number): Promise<IApiResponse<IOperationLog>> {
  return get<IOperationLog>(`/api/operation-logs/${id}`)
}

export function exportLogList(params: Record<string, any>): Promise<IApiResponse<Blob>> {
  return get<Blob>('/api/operation-logs/export', params, { responseType: 'blob' })
}
