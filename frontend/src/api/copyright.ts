import { http } from '@/utils/request'
import type { CopyrightItem, PaginationParams, PaginationResult } from '@/types'

export const getCopyrightListApi = (params: PaginationParams): Promise<PaginationResult<CopyrightItem>> => {
  return http.get<PaginationResult<CopyrightItem>>('/api/v1/copyrights', params)
}

export const getCopyrightDetailApi = (id: number): Promise<CopyrightItem> => {
  return http.get<CopyrightItem>(`/api/v1/copyrights/${id}`)
}

export const createCopyrightApi = (data: Partial<CopyrightItem>): Promise<{ id: number }> => {
  return http.post<{ id: number }>('/api/v1/copyrights', data)
}

export const updateCopyrightApi = (id: number, data: Partial<CopyrightItem>): Promise<void> => {
  return http.put<void>(`/api/v1/copyrights/${id}`, data)
}

export const deleteCopyrightApi = (id: number): Promise<void> => {
  return http.delete<void>(`/api/v1/copyrights/${id}`)
}
