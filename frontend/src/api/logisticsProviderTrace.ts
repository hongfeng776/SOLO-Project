import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type {
  ProviderTraceSummary,
  ProviderQualification,
  SignContract,
  FeeChangeLog,
  ServiceEvaluation,
  ProviderOperationLog,
  FullProviderTrace
} from '@/types/business'

export interface TraceQueryParams {
  page?: number
  pageSize?: number
}

export function getFullTrace(id: number): Promise<ApiResponse<FullProviderTrace>> {
  return request.get<FullProviderTrace>(`/logisticsProviderTrace/full/${id}`)
}

export function getTraceSummary(id: number): Promise<ApiResponse<ProviderTraceSummary>> {
  return request.get<ProviderTraceSummary>(`/logisticsProviderTrace/summary/${id}`)
}

export function getQualificationList(id: number): Promise<ApiResponse<ProviderQualification[]>> {
  return request.get<ProviderQualification[]>(`/logisticsProviderTrace/qualifications/${id}`)
}

export function getContractList(id: number, params?: TraceQueryParams): Promise<ApiResponse<SignContract[]>> {
  return request.get<SignContract[]>(`/logisticsProviderTrace/contracts/${id}`, { params })
}

export function getFeeChangeLogs(id: number, params?: TraceQueryParams): Promise<ApiResponse<FeeChangeLog[]>> {
  return request.get<FeeChangeLog[]>(`/logisticsProviderTrace/fee-changes/${id}`, { params })
}

export function getEvaluationList(id: number, params?: TraceQueryParams): Promise<ApiResponse<ServiceEvaluation[]>> {
  return request.get<ServiceEvaluation[]>(`/logisticsProviderTrace/evaluations/${id}`, { params })
}

export function getOperationLogs(id: number, params?: TraceQueryParams): Promise<ApiResponse<ProviderOperationLog[]>> {
  return request.get<ProviderOperationLog[]>(`/logisticsProviderTrace/operation-logs/${id}`, { params })
}
