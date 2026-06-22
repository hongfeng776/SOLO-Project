import { get, post, put, del } from '@utils/request'
import type { IStockStatusSyncRecord, IStockStatusAnnouncement, IStockStatusValidateResult, IStockStatusLockResult, IStockStatusBatchResult, IStockStatusTraceData, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export function getSyncRecords(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IStockStatusSyncRecord>>> {
  return get<IPaginatedData<IStockStatusSyncRecord>>('/api/stock-status-sync/records', params)
}

export function getAnnouncements(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IStockStatusAnnouncement>>> {
  return get<IPaginatedData<IStockStatusAnnouncement>>('/api/stock-status-sync/announcements', params)
}

export function getUnsyncedAnnouncements(): Promise<IApiResponse<IStockStatusAnnouncement[]>> {
  return get<IStockStatusAnnouncement[]>('/api/stock-status-sync/announcements/unsynced')
}

export function validateStatusChange(data: { stockCode: string; toStatus: string; syncSource: string }): Promise<IApiResponse<IStockStatusValidateResult>> {
  return post<IStockStatusValidateResult>('/api/stock-status-sync/validate', data)
}

export function executeStatusChange(data: {
  stockCode: string
  fromStatus: string
  toStatus: string
  changeType: string
  syncSource: string
  announcementId?: string
  effectiveTime?: string
  auditStatus?: string
  remark?: string
}): Promise<IApiResponse<IStockStatusLockResult>> {
  return post<IStockStatusLockResult>('/api/stock-status-sync/execute', data)
}

export function batchSyncAnnouncements(data: { announcementIds: string[]; skipValidation?: boolean }): Promise<IApiResponse<IStockStatusBatchResult>> {
  return post<IStockStatusBatchResult>('/api/stock-status-sync/batch-sync', data)
}

export function batchManualSync(data: {
  stockCodes: string[]
  targetStatus: string
  syncSource: string
  effectiveTime?: string
}): Promise<IApiResponse<IStockStatusBatchResult>> {
  return post<IStockStatusBatchResult>('/api/stock-status-sync/batch-manual', data)
}

export function getSyncRecordById(id: number): Promise<IApiResponse<IStockStatusSyncRecord>> {
  return get<IStockStatusSyncRecord>(`/api/stock-status-sync/records/${id}`)
}

export function getTrace(stockCode: string): Promise<IApiResponse<IStockStatusTraceData>> {
  return get<IStockStatusTraceData>(`/api/stock-status-sync/trace/${stockCode}`)
}

export function syncLatestFromExchange(stockCode: string): Promise<IApiResponse<IStockStatusAnnouncement>> {
  return post<IStockStatusAnnouncement>(`/api/stock-status-sync/sync-latest/${stockCode}`)
}

export function syncAllAnnouncements(exchange?: string): Promise<IApiResponse<{ fetched: number; matched: number }>> {
  return post<{ fetched: number; matched: number }>('/api/stock-status-sync/sync-all', { exchange })
}

export function getLockResult(syncCode: string): Promise<IApiResponse<IStockStatusLockResult>> {
  return get<IStockStatusLockResult>(`/api/stock-status-sync/lock-result/${syncCode}`)
}

export function auditSyncRecord(id: number, data: { auditStatus: string; auditRemark?: string }): Promise<IApiResponse<IStockStatusSyncRecord>> {
  return put<IStockStatusSyncRecord>(`/api/stock-status-sync/records/${id}/audit`, data)
}
