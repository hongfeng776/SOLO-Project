import { get, post, put, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { Comment } from '@/types/business'

export const getCommentList = (params: Record<string, unknown>): Promise<PageResult<Comment>> => {
  return get<PageResult<Comment>>('/comment', params)
}

export const getCommentDetail = (id: number): Promise<Comment> => {
  return get<Comment>(`/comment/${id}`)
}

export const createComment = (data: Partial<Comment>): Promise<{ id: number }> => {
  return post<{ id: number }>('/comment', data)
}

export const updateComment = (id: number, data: Partial<Comment>): Promise<{ id: number }> => {
  return put<{ id: number }>(`/comment/${id}`, data)
}

export const deleteComment = (id: number): Promise<null> => {
  return del<null>(`/comment/${id}`)
}

export const auditComment = (
  id: number,
  data: { status: number; violationType?: string }
): Promise<{ id: number }> => {
  return post<{ id: number }>(`/comment/${id}/audit`, data)
}

export const batchAuditComments = (
  ids: number[],
  data: { status: number; violationType?: string }
): Promise<null> => {
  return post<null>('/comment/batch-audit', { ids, ...data })
}

export const batchDeleteComments = (ids: number[]): Promise<null> => {
  return post<null>('/comment/batch-delete', { ids })
}

export const getCommentStats = (): Promise<Record<string, number>> => {
  return get<Record<string, number>>('/comment/stats')
}
