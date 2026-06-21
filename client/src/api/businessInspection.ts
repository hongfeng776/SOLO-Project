import { get, post, put } from '@utils/request'
import type {
  IBusinessInspection,
  IBusinessInspectionIssue,
  IInspectionPreCheckResult,
  IBusinessInspectionLog,
  IIssueBatchPreview,
  IInspectionStats,
  IIssueBatchParams,
  IInspectionListParams,
  IIssueListParams,
  IApiResponse,
  IPaginatedData,
} from '@/types/api'

export function getBusinessInspectionList(params: IInspectionListParams): Promise<IApiResponse<IPaginatedData<IBusinessInspection>>> {
  return get<IPaginatedData<IBusinessInspection>>('/api/business-inspections', params as Record<string, any>)
}

export function getBusinessInspectionById(id: number): Promise<IApiResponse<IBusinessInspection>> {
  return get<IBusinessInspection>(`/api/business-inspections/${id}`)
}

export function getBusinessInspectionIssues(params: IIssueListParams): Promise<IApiResponse<IPaginatedData<IBusinessInspectionIssue>>> {
  return get<IPaginatedData<IBusinessInspectionIssue>>('/api/business-inspections/issues', params as Record<string, any>)
}

export function getBusinessInspectionLogs(id: number): Promise<IApiResponse<IBusinessInspectionLog[]>> {
  return get<IBusinessInspectionLog[]>(`/api/business-inspections/${id}/logs`)
}

export function preCheckBusinessInspection(data: any): Promise<IApiResponse<IInspectionPreCheckResult>> {
  return post<IInspectionPreCheckResult>('/api/business-inspections/pre-check', data)
}

export function createBusinessInspection(data: any): Promise<IApiResponse<IBusinessInspection>> {
  return post<IBusinessInspection>('/api/business-inspections', data)
}

export function startBusinessInspection(id: number): Promise<IApiResponse<IBusinessInspection>> {
  return put<IBusinessInspection>(`/api/business-inspections/${id}/start`, {})
}

export function batchProcessIssues(params: IIssueBatchParams): Promise<IApiResponse<any>> {
  return post<any>('/api/business-inspections/batch-process', params)
}

export function batchPreviewIssues(ids: number[]): Promise<IApiResponse<IIssueBatchPreview>> {
  return post<IIssueBatchPreview>('/api/business-inspections/batch-preview', { ids })
}

export function getBusinessInspectionStats(): Promise<IApiResponse<IInspectionStats>> {
  return get<IInspectionStats>('/api/business-inspections/stats')
}
