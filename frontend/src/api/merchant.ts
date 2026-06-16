import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export interface Merchant {
  id: number
  name: string
  logo: string
  contactName: string
  contactPhone: string
  contactEmail: string
  address: string
  businessLicense: string
  status: number
  statusName?: string
  rating: number
  totalSales: number
  totalOrders: number
  description: string
  createdAt: string
  updatedAt: string
}

export interface MerchantQueryParams extends PageParams {
  name?: string
  status?: number
}

export function getMerchantList(params: MerchantQueryParams): Promise<ApiResponse<PageResult<Merchant>>> {
  return request.get<PageResult<Merchant>>('/merchant/list', { params })
}

export function getMerchantDetail(id: number): Promise<ApiResponse<Merchant>> {
  return request.get<Merchant>(`/merchant/${id}`)
}

export function createMerchant(data: Partial<Merchant>): Promise<ApiResponse<Merchant>> {
  return request.post<Merchant>('/merchant/create', data)
}

export function updateMerchant(id: number, data: Partial<Merchant>): Promise<ApiResponse<Merchant>> {
  return request.put<Merchant>(`/merchant/${id}`, data)
}

export function deleteMerchant(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`/merchant/${id}`)
}

export function approveMerchant(id: number): Promise<ApiResponse<null>> {
  return request.put<null>(`/merchant/${id}/approve`)
}

export function rejectMerchant(id: number, reason: string): Promise<ApiResponse<null>> {
  return request.put<null>(`/merchant/${id}/reject`, { reason })
}

export function updateMerchantStatus(id: number, status: number): Promise<ApiResponse<null>> {
  return request.put<null>(`/merchant/${id}/status`, { status })
}

export function batchDeleteMerchant(ids: number[]): Promise<ApiResponse<null>> {
  return request.post<null>('/merchant/batchDelete', { ids })
}
