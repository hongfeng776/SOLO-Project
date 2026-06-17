import request from '@/utils/request'
import type {
  Driver,
  DriverQueryParams,
  DriverAuditLog,
  AuditDashboard,
  BatchOperationResult,
  QualificationCheckResult,
  AuditStrictness
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
