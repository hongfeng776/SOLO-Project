import { http } from '@/utils/request'
import type {
  CopyrightItem,
  CopyrightDetail,
  CopyrightFormData,
  CopyrightConflictCheckResult,
  CopyrightVerifyResult,
  CopyrightTraceQuery,
  CopyrightTraceItem,
  BatchCopyrightImportResult,
  BatchCopyrightRenewParams,
  BatchCopyrightInvalidParams,
  BatchCopyrightProgress,
  CopyrightAuditSyncData,
  PaginationParams,
  PaginationResult,
} from '@/types'

export const getCopyrightListApi = (params: PaginationParams): Promise<PaginationResult<CopyrightItem>> => {
  return http.get<PaginationResult<CopyrightItem>>('/api/v1/copyrights', params)
}

export const getCopyrightDetailApi = (id: number): Promise<CopyrightDetail> => {
  return http.get<CopyrightDetail>(`/api/v1/copyrights/${id}`)
}

export const checkCopyrightConflictApi = (data: {
  code?: string
  contentIds?: number[]
  excludeId?: number
}): Promise<CopyrightConflictCheckResult> => {
  return http.post<CopyrightConflictCheckResult>('/api/v1/copyrights/check-conflict', data)
}

export const verifyQualificationFilesApi = (data: {
  copyrightCertificate?: string
  authorizationAgreement?: string
  ownershipProof?: string
  qualificationFiles?: any[]
  startDate?: string
  endDate?: string
}): Promise<CopyrightVerifyResult> => {
  return http.post<CopyrightVerifyResult>('/api/v1/copyrights/verify-qualification', data)
}

export const createCopyrightApi = (data: Partial<CopyrightFormData>): Promise<{ id: number; syncData: CopyrightAuditSyncData }> => {
  return http.post<{ id: number; syncData: CopyrightAuditSyncData }>('/api/v1/copyrights', data)
}

export const updateCopyrightApi = (
  id: number,
  data: Partial<CopyrightFormData>
): Promise<{ syncData: CopyrightAuditSyncData }> => {
  return http.put<{ syncData: CopyrightAuditSyncData }>(`/api/v1/copyrights/${id}`, data)
}

export const deleteCopyrightApi = (id: number): Promise<void> => {
  return http.delete<void>(`/api/v1/copyrights/${id}`)
}

export const batchImportCopyrightApi = (
  rows: Partial<CopyrightFormData>[]
): Promise<BatchCopyrightImportResult> => {
  return http.post<BatchCopyrightImportResult>('/api/v1/copyrights/batch/import', { rows })
}

export const batchRenewCopyrightApi = (
  params: BatchCopyrightRenewParams
): Promise<{ progress: BatchCopyrightProgress; details: any[] }> => {
  return http.post<{ progress: BatchCopyrightProgress; details: any[] }>(
    '/api/v1/copyrights/batch/renew',
    params
  )
}

export const batchInvalidCopyrightApi = (
  params: BatchCopyrightInvalidParams
): Promise<{ progress: BatchCopyrightProgress; details: any[] }> => {
  return http.post<{ progress: BatchCopyrightProgress; details: any[] }>(
    '/api/v1/copyrights/batch/invalid',
    params
  )
}

export const traceCopyrightApi = (
  params: CopyrightTraceQuery & PaginationParams
): Promise<PaginationResult<CopyrightTraceItem>> => {
  return http.get<PaginationResult<CopyrightTraceItem>>('/api/v1/copyrights/trace/list', params)
}

export const syncCopyrightToModulesApi = (
  id: number,
  action: 'create' | 'update' | 'expire' | 'renew' | 'invalid'
): Promise<CopyrightAuditSyncData> => {
  return http.post<CopyrightAuditSyncData>(`/api/v1/copyrights/${id}/sync-modules`, { action })
}
