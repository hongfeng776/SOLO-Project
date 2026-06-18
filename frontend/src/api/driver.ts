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
  BatchPreCheckResult,
  ServiceDataListResult,
  ServiceTrendResult,
  DriverServiceDetail,
  ServiceStatistics,
  DriverLevelInfo,
  ServiceDataValidity,
  ExportResult,
  ExportParams,
  BatchLevelUpdateResult,
  DriverServiceLog
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

export const getServiceDataListApi = (params: any) => {
  return request.get<ServiceDataListResult>('/driver/service/list', params)
}

export const getServiceTrendApi = (id: number, period: string, startDate?: string, endDate?: string) => {
  return request.get<ServiceTrendResult>(`/driver/${id}/service/trend`, { period, startDate, endDate })
}

export const getDriverServiceDetailApi = (id: number, period?: string) => {
  return request.get<DriverServiceDetail>(`/driver/${id}/service/detail`, { period })
}

export const getServiceLogsApi = (id: number, limit?: number) => {
  return request.get<DriverServiceLog[]>(`/driver/${id}/service/logs`, { limit })
}

export const getServiceStatisticsApi = (period?: string) => {
  return request.get<ServiceStatistics>('/driver/service/statistics', { period })
}

export const calculateDriverLevelApi = (id: number, period?: string) => {
  return request.get<DriverLevelInfo>(`/driver/${id}/service/level`, { period })
}

export const updateDriverLevelApi = (id: number) => {
  return request.put(`/driver/${id}/service/level`)
}

export const batchUpdateLevelsApi = (ids: number[]) => {
  return request.post<BatchLevelUpdateResult>('/driver/service/batch-update-level', { ids })
}

export const exportServiceDataApi = (params: ExportParams) => {
  return request.post<ExportResult>('/driver/service/export', params)
}

export const checkServiceDataValidityApi = (period: string, startDate?: string, endDate?: string) => {
  return request.get<ServiceDataValidity>('/driver/service/validity', { period, startDate, endDate })
}
