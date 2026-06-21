import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'
import type { LogisticsProvider } from '@/types/business'
import type { ProviderQueryParams } from './logisticsProvider'

export interface BatchEnableResult {
  success: boolean
  total: number
  successCount: number
  failCount: number
  results: Array<{ id: number; success: boolean; message?: string }>
}

export interface BatchFeeUpdate {
  ids: number[]
  firstWeightFee?: number
  additionalWeightFee?: number
  baseServiceFee?: number
  changeReason: string
  isCoreChange?: boolean
  confirmedByName?: string
}

export interface BatchPriorityAdjust {
  ids: number[]
  adjustMode: 'increase' | 'decrease' | 'set'
  value: number
  changeReason?: string
}

export interface BatchLevelUpdate {
  ids: number[]
  level: number
  changeReason?: string
}

export function getFilteredIds(params: ProviderQueryParams): Promise<ApiResponse<{ ids: number[]; count: number }>> {
  return request.post('/logisticsProviderBatch/filtered-ids', params)
}

export function batchEnable(ids: number[]): Promise<ApiResponse<BatchEnableResult>> {
  return request.post<BatchEnableResult>('/logisticsProviderBatch/batch-enable', { ids })
}

export function batchDisable(ids: number[], reason?: string): Promise<ApiResponse<BatchEnableResult>> {
  return request.post<BatchEnableResult>('/logisticsProviderBatch/batch-disable', { ids, reason })
}

export function batchUpdateFees(data: BatchFeeUpdate): Promise<ApiResponse<BatchEnableResult>> {
  return request.post<BatchEnableResult>('/logisticsProviderBatch/batch-update-fees', data)
}

export function batchAdjustPriority(data: BatchPriorityAdjust): Promise<ApiResponse<BatchEnableResult>> {
  return request.post<BatchEnableResult>('/logisticsProviderBatch/batch-adjust-priority', data)
}

export function batchUpdateLevel(data: BatchLevelUpdate): Promise<ApiResponse<BatchEnableResult>> {
  return request.post<BatchEnableResult>('/logisticsProviderBatch/batch-update-level', data)
}

export function getRefreshListData(ids: number[]): Promise<ApiResponse<LogisticsProvider[]>> {
  return request.post<LogisticsProvider[]>('/logisticsProviderBatch/refresh-list', { ids })
}
