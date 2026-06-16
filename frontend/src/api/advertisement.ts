import { http } from '@/utils/request'
import type { AdvertisementItem, PaginationParams, PaginationResult } from '@/types'

export const getAdListApi = (params: PaginationParams): Promise<PaginationResult<AdvertisementItem>> => {
  return http.get<PaginationResult<AdvertisementItem>>('/api/v1/advertisements', params)
}

export const getAdDetailApi = (id: number): Promise<AdvertisementItem> => {
  return http.get<AdvertisementItem>(`/api/v1/advertisements/${id}`)
}

export const createAdApi = (data: Partial<AdvertisementItem>): Promise<{ id: number }> => {
  return http.post<{ id: number }>('/api/v1/advertisements', data)
}

export const updateAdApi = (id: number, data: Partial<AdvertisementItem>): Promise<void> => {
  return http.put<void>(`/api/v1/advertisements/${id}`, data)
}

export const deleteAdApi = (id: number): Promise<void> => {
  return http.delete<void>(`/api/v1/advertisements/${id}`)
}

export const batchDeleteAdsApi = (ids: number[]): Promise<void> => {
  return http.post<void>('/api/v1/advertisements/batch-delete', { ids })
}
