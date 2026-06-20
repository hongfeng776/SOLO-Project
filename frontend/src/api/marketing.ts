import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'
import type {
  MarketingValidateResult,
  EditPermissions,
  BatchOperationResult,
  MarketingLog,
  MarketingProduct,
  MarketingTraceData,
  DuplicateCheckResult,
  Marketing
} from '@/types/business'

export type { Marketing }

export interface MarketingQueryParams extends PageParams {
  name?: string
  type?: number
  status?: number
  startTimeStart?: string
  startTimeEnd?: string
  endTimeStart?: string
  endTimeEnd?: string
  minDiscount?: number
  maxDiscount?: number
  discountType?: number
}

export function getMarketingList(params: MarketingQueryParams): Promise<ApiResponse<PageResult<Marketing>>> {
  return request.get<PageResult<Marketing>>('/marketing/list', { params })
}

export function getMarketingDetail(id: number): Promise<ApiResponse<Marketing>> {
  return request.get<Marketing>(`/marketing/${id}`)
}

export function createMarketing(data: Partial<Marketing>): Promise<ApiResponse<Marketing>> {
  return request.post<Marketing>('/marketing/create', data)
}

export function updateMarketing(id: number, data: Partial<Marketing>): Promise<ApiResponse<Marketing>> {
  return request.put<Marketing>(`/marketing/${id}`, data)
}

export function deleteMarketing(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`/marketing/${id}`)
}

export function updateMarketingStatus(id: number, status: number): Promise<ApiResponse<null>> {
  return request.put<null>(`/marketing/${id}/status`, { status })
}

export function batchDeleteMarketing(ids: number[]): Promise<ApiResponse<null>> {
  return request.post<null>('/marketing/batchDelete', { ids })
}

export function validateCreateMarketing(data: Partial<Marketing>): Promise<ApiResponse<MarketingValidateResult>> {
  return request.post<MarketingValidateResult>('/marketing/validate/create', data)
}

export function validateEditMarketing(id: number, data: Partial<Marketing>): Promise<ApiResponse<MarketingValidateResult>> {
  return request.post<MarketingValidateResult>(`/marketing/validate/edit/${id}`, data)
}

export function getEditPermissions(status: number): Promise<ApiResponse<EditPermissions>> {
  return request.get<EditPermissions>('/marketing/edit-permissions', { params: { status } })
}

export function batchOnlineMarketing(ids: number[]): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/online', { ids })
}

export function batchOfflineMarketing(ids: number[]): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/offline', { ids })
}

export function batchPauseMarketing(ids: number[]): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/pause', { ids })
}

export function batchFilterOperate(data: {
  operation: 'online' | 'offline' | 'pause'
  type?: number
  status?: number
  startTimeStart?: string
  startTimeEnd?: string
  endTimeStart?: string
  endTimeEnd?: string
  minDiscount?: number
  maxDiscount?: number
  discountType?: number
}): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/filter-operate', data)
}

export function batchOfflineExpired(): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/offline-expired')
}

export function batchOnlinePending(): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/online-pending')
}

export function getMarketingTrace(id: number): Promise<ApiResponse<MarketingTraceData>> {
  return request.get<MarketingTraceData>(`/marketing/trace/${id}`)
}

export function getMarketingLogs(id: number, params?: PageParams): Promise<ApiResponse<PageResult<MarketingLog>>> {
  return request.get<PageResult<MarketingLog>>(`/marketing/trace/${id}/logs`, { params })
}

export function getMarketingProducts(id: number, params?: PageParams): Promise<ApiResponse<PageResult<MarketingProduct>>> {
  return request.get<PageResult<MarketingProduct>>(`/marketing/trace/${id}/products`, { params })
}

export function checkDuplicateConfig(data: {
  type?: number
  startTime?: string
  endTime?: string
  categoryIds?: string
  merchantIds?: string
  discountValue?: number
  excludeId?: number
}): Promise<ApiResponse<DuplicateCheckResult>> {
  return request.post<DuplicateCheckResult>('/marketing/trace/check-duplicate', data)
}
