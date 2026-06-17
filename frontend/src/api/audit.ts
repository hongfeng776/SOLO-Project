import { http } from '@/utils/request'
import type {
  AuditDetailInfo,
  AuditSubmitData,
  BatchAuditParams,
  PaginationResult,
  PaginationParams,
  AuditTaskPoolItem,
  AuditTraceRecord,
  QualityCheckReport,
  AssignPreviewResult,
  DuplicateCheckResult,
  AuditTaskAssignRule,
  BatchOperationResult,
  RejectReasonTemplate,
} from '@/types'

export const getAuditDetailApi = (contentId: number): Promise<AuditDetailInfo> => {
  return http.get<AuditDetailInfo>(`/api/v1/audit/contents/${contentId}/detail`)
}

export const previewAssignApi = (contentId: number): Promise<AssignPreviewResult> => {
  return http.get<AssignPreviewResult>(`/api/v1/audit/contents/${contentId}/preview-assign`)
}

export const checkDuplicateAuditApi = (contentId: number): Promise<DuplicateCheckResult> => {
  return http.get<DuplicateCheckResult>(`/api/v1/audit/contents/${contentId}/check-duplicate`)
}

export const submitAuditApi = (data: AuditSubmitData): Promise<{ auditNo: string }> => {
  return http.post<{ auditNo: string }>('/api/v1/audit/submit', data)
}

export const batchAuditActionApi = (data: BatchAuditParams): Promise<BatchOperationResult> => {
  return http.post<BatchOperationResult>('/api/v1/audit/batch-action', data)
}

export const getAuditTaskPoolApi = (
  params: PaginationParams & {
    auditStatus?: number
    category?: number
    priority?: number
    riskLevel?: number
    assignedTo?: number
    isArchived?: boolean
    timeRange?: [string, string]
  }
): Promise<PaginationResult<AuditTaskPoolItem>> => {
  return http.get<PaginationResult<AuditTaskPoolItem>>('/api/v1/audit/task-pool', params)
}

export const getAuditTraceApi = (params: {
  auditNo?: string
  contentId?: number
  auditorId?: number
}): Promise<AuditTraceRecord> => {
  return http.get<AuditTraceRecord>('/api/v1/audit/trace', params)
}

export const getQualityCheckReportApi = (params: {
  period?: string
  startDate?: string
  endDate?: string
  auditorId?: number
}): Promise<QualityCheckReport> => {
  return http.get<QualityCheckReport>('/api/v1/audit/quality-report', params)
}

export const getAuditAssignRulesApi = (): Promise<AuditTaskAssignRule[]> => {
  return http.get<AuditTaskAssignRule[]>('/api/v1/audit/assign-rules')
}

export const getRejectReasonTemplatesApi = (): Promise<RejectReasonTemplate[]> => {
  return http.get<RejectReasonTemplate[]>('/api/v1/audit/reject-reasons')
}

export const refreshPartialAuditDataApi = (contentIds: number[]): Promise<AuditTaskPoolItem[]> => {
  return http.post<AuditTaskPoolItem[]>('/api/v1/audit/refresh-partial', { contentIds })
}

export const validateAuditOperationApi = (data: {
  contentId: number
  auditStatus: number
  reviewLevel: number
}): Promise<{
  valid: boolean
  errors?: string[]
  warnings?: string[]
}> => {
  return http.post<{ valid: boolean; errors?: string[]; warnings?: string[] }>(
    '/api/v1/audit/validate-operation',
    data
  )
}
