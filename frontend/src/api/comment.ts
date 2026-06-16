import { http } from '@/utils/request'
import type { CommentItem, PaginationParams, PaginationResult, CommentStatsResult } from '@/types'

export const getCommentListApi = (params: PaginationParams): Promise<PaginationResult<CommentItem>> => {
  return http.get<PaginationResult<CommentItem>>('/api/v1/comments', params)
}

export const getCommentDetailApi = (id: number): Promise<CommentItem> => {
  return http.get<CommentItem>(`/api/v1/comments/${id}`)
}

export const createCommentApi = (data: Partial<CommentItem>): Promise<{ id: number }> => {
  return http.post<{ id: number }>('/api/v1/comments', data)
}

export const updateCommentApi = (id: number, data: Partial<CommentItem>): Promise<void> => {
  return http.put<void>(`/api/v1/comments/${id}`, data)
}

export const deleteCommentApi = (id: number): Promise<void> => {
  return http.delete<void>(`/api/v1/comments/${id}`)
}

export const batchDeleteCommentsApi = (ids: number[]): Promise<void> => {
  return http.post<void>('/api/v1/comments/batch-delete', { ids })
}

export const auditCommentApi = (id: number, data: { commentStatus: number; auditRemark?: string }): Promise<void> => {
  return http.post<void>(`/api/v1/comments/${id}/audit`, data)
}

export const batchAuditCommentsApi = (ids: number[], data: { commentStatus: number; auditRemark?: string }): Promise<void> => {
  return http.post<void>('/api/v1/comments/batch-audit', { ids, ...data })
}

export const getCommentStatsApi = (contentId?: number): Promise<CommentStatsResult> => {
  return http.get<CommentStatsResult>('/api/v1/comments/stats', contentId ? { contentId } : {})
}
