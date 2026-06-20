import { get, post, put } from '@utils/request'
import type {
  ICustomerQualification,
  ICustomerQualificationPreCheckResult,
  ICustomerQualificationLog,
  IQualificationBatchPreview,
  IQualificationStats,
  IQualificationBatchParams,
  IQualificationListParams,
  IApiResponse,
  IPaginatedData,
} from '@/types/api'

export function getCustomerQualificationList(params: IQualificationListParams): Promise<IApiResponse<IPaginatedData<ICustomerQualification>>> {
  return get<IPaginatedData<ICustomerQualification>>('/api/customer-qualifications', params as Record<string, any>)
}

export function getCustomerQualificationById(id: number): Promise<IApiResponse<ICustomerQualification>> {
  return get<ICustomerQualification>(`/api/customer-qualifications/${id}`)
}

export function getCustomerQualificationLogs(id: number): Promise<IApiResponse<ICustomerQualificationLog[]>> {
  return get<ICustomerQualificationLog[]>(`/api/customer-qualifications/${id}/logs`)
}

export function preCheckCustomerQualification(id: number): Promise<IApiResponse<ICustomerQualificationPreCheckResult>> {
  return post<ICustomerQualificationPreCheckResult>(`/api/customer-qualifications/${id}/pre-check`, {})
}

export function createCustomerQualification(data: Partial<ICustomerQualification>): Promise<IApiResponse<ICustomerQualification>> {
  return post<ICustomerQualification>('/api/customer-qualifications', data)
}

export function approveCustomerQualification(id: number, data: { qualificationLevel?: string; reviewOpinion?: string }): Promise<IApiResponse<ICustomerQualification>> {
  return put<ICustomerQualification>(`/api/customer-qualifications/${id}/approve`, data)
}

export function rejectCustomerQualification(id: number, data: { reviewOpinion: string; issueTypes: string[]; rejectReasons?: string[] }): Promise<IApiResponse<ICustomerQualification>> {
  return put<ICustomerQualification>(`/api/customer-qualifications/${id}/reject`, data)
}

export function initiateRecheckCustomerQualification(id: number): Promise<IApiResponse<ICustomerQualification>> {
  return put<ICustomerQualification>(`/api/customer-qualifications/${id}/recheck`, {})
}

export function batchOperationCustomerQualification(params: IQualificationBatchParams): Promise<IApiResponse<any>> {
  return post<any>('/api/customer-qualifications/batch-operation', params)
}

export function batchPreviewCustomerQualification(ids: number[]): Promise<IApiResponse<IQualificationBatchPreview>> {
  return post<IQualificationBatchPreview>('/api/customer-qualifications/batch-preview', { ids })
}

export function checkExpireWarningCustomerQualification(): Promise<IApiResponse<{ warnedCount: number; expiredCount: number }>> {
  return post<{ warnedCount: number; expiredCount: number }>('/api/customer-qualifications/check-expire-warning', {})
}

export function getCustomerQualificationStats(): Promise<IApiResponse<IQualificationStats>> {
  return get<IQualificationStats>('/api/customer-qualifications/stats')
}
