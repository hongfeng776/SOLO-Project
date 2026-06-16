import { http } from '@/utils/request'
import type { ContentItem, PaginationParams, PaginationResult } from '@/types'

export const getContentListApi = (params: PaginationParams): Promise<PaginationResult<ContentItem>> => {
  return http.get<PaginationResult<ContentItem>>('/api/v1/contents', params)
}

export const getContentDetailApi = (id: number): Promise<ContentItem> => {
  return http.get<ContentItem>(`/api/v1/contents/${id}`)
}

export const createContentApi = (data: Partial<ContentItem>): Promise<{ id: number }> => {
  return http.post<{ id: number }>('/api/v1/contents', data)
}

export const updateContentApi = (id: number, data: Partial<ContentItem>): Promise<void> => {
  return http.put<void>(`/api/v1/contents/${id}`, data)
}

export const deleteContentApi = (id: number): Promise<void> => {
  return http.delete<void>(`/api/v1/contents/${id}`)
}

export const batchDeleteContentsApi = (ids: number[]): Promise<void> => {
  return http.post<void>('/api/v1/contents/batch-delete', { ids })
}

export const auditContentApi = (id: number, data: { auditStatus: number; auditRemark?: string }): Promise<void> => {
  return http.post<void>(`/api/v1/contents/${id}/audit`, data)
}

export const batchAuditContentsApi = (ids: number[], data: { auditStatus: number; auditRemark?: string }): Promise<void> => {
  return http.post<void>('/api/v1/contents/batch-audit', { ids, ...data })
}
