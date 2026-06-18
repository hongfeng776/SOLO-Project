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
  ValidityWarningConfig,
  ValidityWarningConfigForm,
  ValidityScanResult,
  ValidityWarningRecord,
  ValidityStatusChangeRecord,
  ValidityBatchTask,
  ValidityBatchParams,
  ValidityTraceEventItem,
  ValidityTraceException,
  ValidityDashboardStats,
  ValidityCopyrightItem,
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
  copyrightId?: number
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
  rows: Partial<CopyrightFormData>[] | { fileUrl: string; options?: any }
): Promise<BatchCopyrightImportResult> => {
  return http.post<BatchCopyrightImportResult>('/api/v1/copyrights/batch/import', rows as any)
}

export const batchRenewCopyrightApi = (
  params: BatchCopyrightRenewParams
): Promise<{ progress: BatchCopyrightProgress; details: any[]; totalCount: number; successCount: number; errorCount: number }> => {
  return http.post<any>(
    '/api/v1/copyrights/batch/renew',
    params
  )
}

export const batchInvalidCopyrightApi = (
  params: BatchCopyrightInvalidParams
): Promise<{ progress: BatchCopyrightProgress; details: any[]; totalCount: number; successCount: number; errorCount: number }> => {
  return http.post<any>(
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

export const getValidityConfigsApi = (
  params?: PaginationParams & { enabled?: boolean; warningThresholdUnit?: string }
): Promise<PaginationResult<ValidityWarningConfig>> => {
  return http.get<PaginationResult<ValidityWarningConfig>>('/api/v1/copyright-validity/configs', params)
}

export const getValidityConfigDetailApi = (id: number): Promise<ValidityWarningConfig> => {
  return http.get<ValidityWarningConfig>(`/api/v1/copyright-validity/configs/${id}`)
}

export const createValidityConfigApi = (
  data: ValidityWarningConfigForm
): Promise<{ id: number; triggeredScan?: ValidityScanResult }> => {
  return http.post<{ id: number; triggeredScan?: ValidityScanResult }>(
    '/api/v1/copyright-validity/configs',
    data
  )
}

export const updateValidityConfigApi = (
  id: number,
  data: Partial<ValidityWarningConfigForm>
): Promise<{ triggeredScan?: ValidityScanResult }> => {
  return http.put<{ triggeredScan?: ValidityScanResult }>(
    `/api/v1/copyright-validity/configs/${id}`,
    data
  )
}

export const deleteValidityConfigApi = (id: number): Promise<void> => {
  return http.delete<void>(`/api/v1/copyright-validity/configs/${id}`)
}

export const triggerValidityScanApi = (
  id: number,
  environmentMode: 'test' | 'prod' = 'prod'
): Promise<ValidityScanResult> => {
  return http.post<ValidityScanResult>(`/api/v1/copyright-validity/configs/${id}/scan`, {
    environmentMode,
  })
}

export const getValidityDashboardStatsApi = (): Promise<ValidityDashboardStats> => {
  return http.get<ValidityDashboardStats>('/api/v1/copyright-validity/dashboard-stats')
}

export const getValidityCopyrightListApi = (
  params: PaginationParams & {
    validityStatus?: 1 | 2 | 3
    minRemainingDays?: number
    maxRemainingDays?: number
    copyrightType?: number
    contentType?: number
    minRelatedCount?: number
    keyword?: string
  }
): Promise<PaginationResult<ValidityCopyrightItem>> => {
  return http.get<PaginationResult<ValidityCopyrightItem>>(
    '/api/v1/copyright-validity/copyrights',
    params
  )
}

export const changeValidityStatusApi = (
  id: number,
  data: {
    targetStatus: 1 | 2 | 3
    reason: string
    remark?: string
    environmentMode?: 'test' | 'prod'
  }
): Promise<{
  record: ValidityStatusChangeRecord
  affectedContents?: number[]
  syncedToAudit: boolean
  syncedToRisk: boolean
}> => {
  return http.post<any>(`/api/v1/copyright-validity/status/${id}/change`, data)
}

export const getValidityStatusHistoryApi = (
  id: number,
  params?: PaginationParams
): Promise<PaginationResult<ValidityStatusChangeRecord>> => {
  return http.get<PaginationResult<ValidityStatusChangeRecord>>(
    `/api/v1/copyright-validity/status/${id}/history`,
    params
  )
}

export const getValidityWarningsApi = (
  params: PaginationParams & {
    handled?: boolean
    environmentMode?: 'test' | 'prod'
    copyrightId?: number
    pushStatus?: string
  }
): Promise<PaginationResult<ValidityWarningRecord>> => {
  return http.get<PaginationResult<ValidityWarningRecord>>(
    '/api/v1/copyright-validity/warnings',
    params
  )
}

export const handleValidityWarningApi = (
  id: number,
  data: {
    action: 'renew' | 'resolved' | 'escalate' | 'ignore'
    handledRemark: string
    renewMonths?: number
  }
): Promise<{ message: string; renewalCopyrightId?: number }> => {
  return http.post<any>(`/api/v1/copyright-validity/warnings/${id}/handle`, data)
}

export const executeValidityBatchApi = (
  data: ValidityBatchParams
): Promise<{
  task: ValidityBatchTask
  dryRunReport?: {
    willRenew: number
    willOffline: number
    willArchive: number
    willWarning: number
    sampleList: Array<{ copyrightId: number; code: string; action: string }>
  }
}> => {
  return http.post<any>('/api/v1/copyright-validity/batch/execute', data)
}

export const getValidityBatchTasksApi = (
  params: PaginationParams & {
    status?: string
    action?: string
    environmentMode?: 'test' | 'prod'
  }
): Promise<PaginationResult<ValidityBatchTask>> => {
  return http.get<PaginationResult<ValidityBatchTask>>(
    '/api/v1/copyright-validity/batch/tasks',
    params
  )
}

export const getValidityBatchTaskDetailApi = (id: number | string): Promise<ValidityBatchTask> => {
  return http.get<ValidityBatchTask>(`/api/v1/copyright-validity/batch/tasks/${id}`)
}

export const getValidityTraceEventsApi = (
  params: PaginationParams & {
    copyrightId?: number
    batchId?: string
    configId?: number
    eventType?: string
    environmentMode?: 'test' | 'prod'
    startAt?: string
    endAt?: string
  }
): Promise<PaginationResult<ValidityTraceEventItem>> => {
  return http.get<PaginationResult<ValidityTraceEventItem>>(
    '/api/v1/copyright-validity/trace/events',
    params
  )
}

export const getValidityTraceExceptionsApi = (
  params: PaginationParams & {
    exceptionType?: string
    copyrightId?: number
    severity?: 'low' | 'medium' | 'high'
    autoResolved?: boolean
    batchId?: string
  }
): Promise<PaginationResult<ValidityTraceException>> => {
  return http.get<PaginationResult<ValidityTraceException>>(
    '/api/v1/copyright-validity/trace/exceptions',
    params
  )
}

export const checkValidityIntegrityApi = (
  data: {
    configId?: number
    autoFix?: boolean
    checkScopes?: Array<'offline' | 'warning' | 'sync' | 'rule'>
  } = {}
): Promise<{
  integrityScore: 'A' | 'B' | 'C' | 'D'
  totalChecked: number
  passedCount: number
  failedCount: number
  exceptionCount: number
  details: Array<{
    checkName: string
    passed: boolean
    failedCount: number
    exceptions: ValidityTraceException[]
  }>
  autoFixResult?: { attempted: number; resolved: number; failed: number }
}> => {
  return http.post<any>('/api/v1/copyright-validity/trace/check-integrity', data)
}

export const validateValidityThresholdApi = (data: {
  warningThreshold: number
  warningThresholdUnit: 'day' | 'week' | 'month'
}): Promise<{
  valid: boolean
  daysEquivalent: number
  reason?: string
  suggestion?: string
}> => {
  return http.post<any>('/api/v1/copyright-validity/configs/validate-threshold', data)
}
