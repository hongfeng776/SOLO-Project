import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'
import type { BatchAbility, BatchResult } from '@/types/business'
import type { Goods } from './goods'

export interface AdvancedQueryParams extends PageParams {
  name?: string
  categoryId?: number
  merchantId?: number
  merchantLevel?: number
  complianceLevel?: number
  status?: number
  minPrice?: number
  maxPrice?: number
  minStock?: number
  maxStock?: number
  minSales?: number
  maxSales?: number
  isTop?: boolean
  sku?: string
  brandId?: number
}

export function advancedQueryGoods(params: AdvancedQueryParams): Promise<ApiResponse<PageResult<Goods>>> {
  return request.post<PageResult<Goods>>('/api/v1/goodsBatch/advanced-query', params)
}

export interface BatchOfflineParams {
  ids: number[]
  reason: string
}

export function batchOfflineGoods(ids: number[], reason: string): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/api/v1/goodsBatch/batch-offline', { ids, reason })
}

export function batchTopGoods(ids: number[]): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/api/v1/goodsBatch/batch-top', { ids })
}

export interface BatchUpdateData {
  categoryId?: number
  price?: number
  originalPrice?: number
  stock?: number
  status?: number
  description?: string
}

export function batchUpdateGoods(ids: number[], data: BatchUpdateData): Promise<ApiResponse<BatchResult>> {
  return request.put<BatchResult>('/api/v1/goodsBatch/batch-update', { ids, data })
}

export function getBatchAbility(ids: number[]): Promise<ApiResponse<BatchAbility>> {
  return request.post<BatchAbility>('/api/v1/goodsBatch/batch-ability', { ids })
}
