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

export const batchOfflineContentsApi = (ids: number[]): Promise<{ successCount: number; skippedCount: number; operableIds: number[] }> => {
  return http.post<{ successCount: number; skippedCount: number; operableIds: number[] }>('/api/v1/contents/batch-offline', { ids })
}

export const batchTopContentsApi = (ids: number[]): Promise<{ successCount: number; skippedCount: number; operableIds: number[] }> => {
  return http.post<{ successCount: number; skippedCount: number; operableIds: number[] }>('/api/v1/contents/batch-top', { ids })
}

export const batchUpdateCategoryApi = (ids: number[], category: number): Promise<{ successCount: number; skippedCount: number; operableIds: number[] }> => {
  return http.post<{ successCount: number; skippedCount: number; operableIds: number[] }>('/api/v1/contents/batch-update-category', { ids, category })
}

export const checkTitleUniqueApi = (title: string, excludeId?: number): Promise<{ isUnique: boolean }> => {
  return http.get<{ isUnique: boolean }>('/api/v1/contents/check-title-unique', { title, excludeId: excludeId || '' })
}

export const checkCopyrightUniqueApi = (copyrightId: number, excludeId?: number): Promise<{ isUnique: boolean }> => {
  return http.get<{ isUnique: boolean }>('/api/v1/contents/check-copyright-unique', { copyrightId, excludeId: excludeId || '' })
}
