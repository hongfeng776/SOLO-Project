import request from '@/utils/request'
import type {
  Driver,
  DriverQueryParams,
  DriverAuditLog,
  AuditDashboard,
  BatchOperationResult,
  QualificationCheckResult,
  AuditStrictness,
  PreCheckResult,
  DriverStatusLog,
  RiskLevelResult,
  StatusDashboard,
  BatchOperationStatusResult,
  BatchPreCheckResult
} from '@/types/driver'
import type { PageResult } from '@/utils/request'

export const getDriverListApi = (params: DriverQueryParams) => {
  return request.get<PageResult<Driver>>('/driver', params)
}

export const getDriverDetailApi = (id: number) => {
  return request.get<Driver>(`/driver/${id}`)
}

export const createDriverApi = (data: Partial<Driver>) => {
  return request.post<Driver>('/driver', data)
}

export const updateDriverApi = (id: number, data: Partial<Driver>) => {
  return request.put<Driver>(`/driver/${id}`, data)
}

export const deleteDriverApi = (id: number) => {
  return request.delete(`/driver/${id}`)
}

export const updateDriverStatusApi = (id: number, status: number) => {
  return request.put(`/driver/${id}/status`, { status })
}

export const auditDriverApi = (id: number, auditStatus: number, remark?: string) => {
  return request.put(`/driver/${id}/audit`, { auditStatus, remark })
}

export const getPendingAuditCountApi = () => {
  return request.get<number>('/driver/audit/pending-count')
}

export const checkQualificationApi = (id: number) => {
  return request.put<QualificationCheckResult>(`/driver/${id}/audit/check-qualification`)
}

export const getAuditStrictnessApi = (id: number) => {
  return request.get<AuditStrictness>(`/driver/${id}/audit/strictness`)
}

export const getAuditLogsApi = (id: number) => {
  return request.get<DriverAuditLog[]>(`/driver/${id}/audit/logs`)
}

export const getAuditDashboardApi = () => {
  return request.get<AuditDashboard>('/driver/audit/dashboard')
}

export const batchAuditApi = (ids: number[], auditStatus: number, remark?: string) => {
  return request.post<BatchOperationResult[]>('/driver/audit/batch', { ids, auditStatus, remark })
}

export const batchReviewApi = (ids: number[], remark?: string) => {
  return request.post<BatchOperationResult[]>('/driver/audit/batch-review', { ids, remark })
}

export const batchRemindApi = (ids: number[], remark?: string) => {
  return request.post<BatchOperationResult[]>('/driver/audit/batch-remind', { ids, remark })
}

export const batchUrgentApi = (ids: number[]) => {
  return request.post<BatchOperationResult[]>('/driver/audit/batch-urgent', { ids })
}

export const updateUploadProgressApi = (id: number, progress: number) => {
  return request.put<{ progress: number }>(`/driver/${id}/upload-progress`, { progress })
}

export const checkExpiredQualificationsApi = () => {
  return request.get<{ id: number; name: string }[]>('/driver/audit/check-expired')
}

export const preCheckStatusChangeApi = (id: number, newStatus: number) => {
  return request.put<PreCheckResult>(`/driver/${id}/pre-check-status`, { newStatus })
}

export const changeAccountStatusApi = (
  id: number,
  newStatus: number,
  changeReason?: string,
  banEndTime?: string
) => {
  return request.put(`/driver/${id}/account-status`, { newStatus, changeReason, banEndTime })
}

export const getRiskLevelApi = (id: number) => {
  return request.get<RiskLevelResult>(`/driver/${id}/risk-level`)
}

export const autoJudgeRiskLevelApi = (id: number) => {
  return request.put<RiskLevelResult>(`/driver/${id}/auto-judge-risk`)
}

export const getStatusLogsApi = (id: number) => {
  return request.get<DriverStatusLog[]>(`/driver/${id}/status/logs`)
}

export const getStatusDashboardApi = () => {
  return request.get<StatusDashboard>('/driver/status/dashboard')
}

export const batchChangeAccountStatusApi = (
  ids: number[],
  newStatus: number,
  changeReason?: string,
  banEndTime?: string
) => {
  return request.post<BatchOperationStatusResult>('/driver/status/batch-change', {
    ids,
    newStatus,
    changeReason,
    banEndTime
  })
}

export const batchTempBanApi = (ids: number[], changeReason?: string, banEndTime?: string) => {
  return request.post<BatchOperationStatusResult>('/driver/status/batch-temp-ban', {
    ids,
    changeReason,
    banEndTime
  })
}

export const batchRemindRectificationApi = (ids: number[]) => {
  return request.post<BatchOperationStatusResult>('/driver/status/batch-remind', { ids })
}

export const batchRestoreNormalApi = (ids: number[], changeReason?: string) => {
  return request.post<BatchOperationStatusResult>('/driver/status/batch-restore', {
    ids,
    changeReason
  })
}

export const preCheckBatchOperationApi = (ids: number[], newStatus: number) => {
  return request.post<BatchPreCheckResult>('/driver/status/pre-check-batch', { ids, newStatus })
}
