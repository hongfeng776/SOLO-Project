import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export interface Marketing {
  id: number
  name: string
  type: number
  typeName?: string
  status: number
  startTime: string
  endTime: string
  discountType: number
  discountValue: number
  minAmount: number
  maxDiscount: number
  totalCount: number
  usedCount: number
  perUserLimit: number
  description: string
  createdAt: string
  updatedAt: string
}

export interface MarketingQueryParams extends PageParams {
  name?: string
  type?: number
  status?: number
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
