import { get, put } from '@utils/request'
import type { IApiResponse, IPaginatedData, IRiskAlert } from '@/types/api'

export interface IAlertListParams {
  page: number
  pageSize: number
  keyword?: string
  alertType?: string
  alertLevel?: string
  alertStatus?: string
  startDate?: string
  endDate?: string
}

export function getAlertList(params: IAlertListParams): Promise<IApiResponse<IPaginatedData<IRiskAlert>>> {
  return get<IPaginatedData<IRiskAlert>>('/api/alert/list', params)
}

export function getAlertById(id: number): Promise<IApiResponse<IRiskAlert>> {
  return get<IRiskAlert>(`/api/alert/${id}`)
}

export function confirmAlert(id: number): Promise<IApiResponse<IRiskAlert>> {
  return put<IRiskAlert>(`/api/alert/${id}/confirm`)
}

export function resolveAlert(id: number, opinion: string): Promise<IApiResponse<IRiskAlert>> {
  return put<IRiskAlert>(`/api/alert/${id}/resolve`, { opinion })
}

export function ignoreAlert(id: number): Promise<IApiResponse<IRiskAlert>> {
  return put<IRiskAlert>(`/api/alert/${id}/ignore`)
}

export function batchConfirmAlert(ids: number[]): Promise<IApiResponse<void>> {
  return put<void>('/api/alert/batch-confirm', { ids })
}

export function exportAlertList(params: Record<string, any>): Promise<IApiResponse<Blob>> {
  return get<Blob>('/api/alert/export', params, { responseType: 'blob' })
}

export function getAlertStats(): Promise<IApiResponse<{
  pendingCount: number
  highRiskCount: number
  todayCount: number
  monthCount: number
}>> {
  return get('/api/alert/stats')
}

export function getRecentAlerts(limit = 10): Promise<IApiResponse<IRiskAlert[]>> {
  return get<IRiskAlert[]>('/api/alert/recent', { limit })
}
