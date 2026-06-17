import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'
import type {
  AuditMainInfo,
  AuditCheckItem,
  AuditFullTrace,
  AuditResubmit,
  AuditTimeout,
  BatchAuditScope,
  AuditAbility,
  AuditStats,
  PreSubmitResult,
  BatchResult
} from '@/types/business'

export interface AuditQueryParams extends PageParams {
  status?: number
  merchantId?: number
  riskLevel?: number
  startTime?: string
  endTime?: string
  categoryId?: number
  timeoutFlag?: boolean
  auditNo?: string
}

export function getAuditList(params: AuditQueryParams): Promise<ApiResponse<PageResult<AuditMainInfo>>> {
  return request.get<PageResult<AuditMainInfo>>('/api/v1/goodsAudit/list', { params })
}

export function getAudit(id: number): Promise<ApiResponse<AuditMainInfo>> {
  return request.get<AuditMainInfo>(`/api/v1/goodsAudit/${id}`)
}

export function submitAudit(goodsId: number): Promise<ApiResponse<AuditMainInfo>> {
  return request.post<AuditMainInfo>('/api/v1/goodsAudit/submit', { goodsId })
}

export function withdrawAudit(auditId: number): Promise<ApiResponse<null>> {
  return request.post<null>(`/api/v1/goodsAudit/${auditId}/withdraw`)
}

export function resubmitAudit(auditId: number, changeFields?: string[], supplementMaterials?: Record<string, unknown>[]): Promise<ApiResponse<AuditMainInfo>> {
  return request.post<AuditMainInfo>(`/api/v1/goodsAudit/${auditId}/resubmit`, { changeFields, supplementMaterials })
}

export function validatePreSubmit(goodsId: number): Promise<ApiResponse<PreSubmitResult>> {
  return request.get<PreSubmitResult>('/api/v1/goodsAuditValidate/preSubmit', { params: { goodsId } })
}

export function autoInitialReview(auditId: number): Promise<ApiResponse<{ skipped: boolean; reason?: string }>> {
  return request.post<{ skipped: boolean; reason?: string }>(`/api/v1/goodsAuditValidate/autoInitialReview`, { auditId })
}

export function getMissingFields(goodsId: number): Promise<ApiResponse<AuditCheckItem[]>> {
  return request.get<AuditCheckItem[]>('/api/v1/goodsAuditValidate/missingFields', { params: { goodsId } })
}

export function canResubmit(auditId: number): Promise<ApiResponse<{ canResubmit: boolean; reason?: string }>> {
  return request.get<{ canResubmit: boolean; reason?: string }>('/api/v1/goodsAuditValidate/canResubmit', { params: { auditId } })
}

export function getRiskLevel(goodsId?: number): Promise<ApiResponse<{ riskLevel: number; creditScore: number; reason: string }>> {
  return request.get<{ riskLevel: number; creditScore: number; reason: string }>('/api/v1/goodsAuditReview/riskLevel', { params: { goodsId } })
}

export interface ReviewData {
  auditId: number
  result: 'pass' | 'reject' | 'manual'
  remark?: string
  rejectReasons?: string[]
}

export function executeInitialReview(data: ReviewData): Promise<ApiResponse<AuditMainInfo>> {
  return request.post<AuditMainInfo>(`/api/v1/goodsAuditReview/${data.auditId}/initialReview`, data)
}

export function executeFinalReview(data: ReviewData): Promise<ApiResponse<AuditMainInfo>> {
  return request.post<AuditMainInfo>(`/api/v1/goodsAuditReview/${data.auditId}/finalReview`, data)
}

export function freezeAudit(auditId: number, reason: string): Promise<ApiResponse<null>> {
  return request.post<null>(`/api/v1/goodsAuditReview/${auditId}/freeze`, { reason })
}

export function unfreezeAudit(auditId: number): Promise<ApiResponse<null>> {
  return request.post<null>(`/api/v1/goodsAuditReview/${auditId}/unfreeze`)
}

export function checkAuditTimeout(): Promise<ApiResponse<{ count: number }>> {
  return request.post<{ count: number }>('/api/v1/goodsAuditReview/checkTimeout')
}

export interface BatchFilterParams extends PageParams {
  statusList?: number[]
  riskLevelList?: number[]
  merchantIdList?: number[]
  timeoutFlag?: boolean
}

export function batchFilterAudits(params: BatchFilterParams): Promise<ApiResponse<PageResult<AuditMainInfo>>> {
  return request.get<PageResult<AuditMainInfo>>('/api/v1/goodsAuditBatch/filter', { params })
}

export interface BatchReviewData {
  auditIds: number[]
  result: 'pass' | 'reject'
  remark?: string
  rejectReasons?: string[]
}

export function batchApprove(data: { auditIds: number[]; remark?: string }): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/api/v1/goodsAuditBatch/approve', data)
}

export function batchReject(data: BatchReviewData): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/api/v1/goodsAuditBatch/reject', data)
}

export interface BatchSupplementData {
  auditIds: number[]
  deadline: string
  remark: string
}

export function batchRequestSupplement(data: BatchSupplementData): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/api/v1/goodsAuditBatch/supplement', data)
}

export function getBatchScope(): Promise<ApiResponse<BatchAuditScope>> {
  return request.get<BatchAuditScope>('/api/v1/goodsAuditBatch/scope')
}

export function getAbilityMap(ids: number[]): Promise<ApiResponse<Record<number, AuditAbility>>> {
  return request.post<Record<number, AuditAbility>>('/api/v1/goodsAuditBatch/abilityMap', { ids })
}

export function getAuditFullTrace(auditId: number): Promise<ApiResponse<AuditFullTrace>> {
  return request.get<AuditFullTrace>(`/api/v1/goodsAuditTrace/trace/${auditId}`)
}

export function checkDuplicateSubmit(goodsId: number): Promise<ApiResponse<{ hasDuplicate: boolean; auditId?: number }>> {
  return request.get<{ hasDuplicate: boolean; auditId?: number }>('/api/v1/goodsAuditTrace/duplicate', { params: { goodsId } })
}

export function checkAuditTimeliness(auditId: number): Promise<ApiResponse<{ timely: boolean; actualHours: number; limitHours: number }>> {
  return request.get<{ timely: boolean; actualHours: number; limitHours: number }>('/api/v1/goodsAuditTrace/timeliness', { params: { auditId } })
}

export function getTimeoutAlerts(): Promise<ApiResponse<AuditTimeout[]>> {
  return request.get<AuditTimeout[]>('/api/v1/goodsAuditTrace/timeoutAlerts')
}

export function getAuditStats(): Promise<ApiResponse<AuditStats>> {
  return request.get<AuditStats>('/api/v1/goodsAuditTrace/stats')
}
