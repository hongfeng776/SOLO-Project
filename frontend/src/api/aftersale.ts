import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export interface AfterSale {
  id: number
  orderId: number
  orderNo: string
  userId: number
  username: string
  type: number
  typeName?: string
  status: number
  statusName?: string
  reason: string
  description: string
  images: string
  applyAmount: number
  refundAmount: number
  processRemark?: string
  processTime?: string
  createdAt: string
  updatedAt: string
}

export interface AfterSaleQueryParams extends PageParams {
  orderNo?: string
  status?: number
  type?: number
}

export function getAfterSaleList(params: AfterSaleQueryParams): Promise<ApiResponse<PageResult<AfterSale>>> {
  return request.get<PageResult<AfterSale>>('/aftersale/list', { params })
}

export function getAfterSaleDetail(id: number): Promise<ApiResponse<AfterSale>> {
  return request.get<AfterSale>(`/aftersale/${id}`)
}

export function approveAfterSale(id: number, data: { refundAmount: number; remark?: string }): Promise<ApiResponse<null>> {
  return request.put<null>(`/aftersale/${id}/approve`, data)
}

export function rejectAfterSale(id: number, data: { remark: string }): Promise<ApiResponse<null>> {
  return request.put<null>(`/aftersale/${id}/reject`, data)
}

export function createAfterSale(data: Partial<AfterSale>): Promise<ApiResponse<AfterSale>> {
  return request.post<AfterSale>('/aftersale/create', data)
}

export function updateAfterSale(id: number, data: Partial<AfterSale>): Promise<ApiResponse<AfterSale>> {
  return request.put<AfterSale>(`/aftersale/${id}`, data)
}

export function deleteAfterSale(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`/aftersale/${id}`)
}

export function updateAfterSaleStatus(id: number, status: number): Promise<ApiResponse<null>> {
  return request.put<null>(`/aftersale/${id}/status`, { status })
}

export function batchDeleteAfterSale(ids: number[]): Promise<ApiResponse<null>> {
  return request.post<null>('/aftersale/batchDelete', { ids })
}
