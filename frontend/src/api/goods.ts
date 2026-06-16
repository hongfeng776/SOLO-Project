import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export interface Goods {
  id: number
  name: string
  categoryId: number
  categoryName?: string
  price: number
  originalPrice: number
  stock: number
  sales: number
  status: number
  coverImage: string
  description: string
  merchantId: number
  merchantName?: string
  createdAt: string
  updatedAt: string
}

export interface GoodsQueryParams extends PageParams {
  name?: string
  categoryId?: number
  status?: number
  merchantId?: number
}

export function getGoodsList(params: GoodsQueryParams): Promise<ApiResponse<PageResult<Goods>>> {
  return request.get<PageResult<Goods>>('/goods/list', { params })
}

export function getGoodsDetail(id: number): Promise<ApiResponse<Goods>> {
  return request.get<Goods>(`/goods/${id}`)
}

export function createGoods(data: Partial<Goods>): Promise<ApiResponse<Goods>> {
  return request.post<Goods>('/goods/create', data)
}

export function updateGoods(id: number, data: Partial<Goods>): Promise<ApiResponse<Goods>> {
  return request.put<Goods>(`/goods/${id}`, data)
}

export function deleteGoods(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`/goods/${id}`)
}

export function batchDeleteGoods(ids: number[]): Promise<ApiResponse<null>> {
  return request.post<null>('/goods/batchDelete', { ids })
}

export function updateGoodsStatus(id: number, status: number): Promise<ApiResponse<null>> {
  return request.put<null>(`/goods/${id}/status`, { status })
}
