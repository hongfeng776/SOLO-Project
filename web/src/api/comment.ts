import { get, put, del } from '@/utils/request'
import type { Result, PageResult } from '@/types/api'
import type { CommentVO } from '@/types/api'

export interface CommentQuery {
  pageNum?: number
  pageSize?: number
  vocabularyId?: number
  materialId?: number
  userId?: number
  status?: number
  keyword?: string
}

export function getCommentList(params: CommentQuery) {
  return get<Result<PageResult<CommentVO>>>('/comment/list', params)
}

export function updateCommentStatus(id: number, status: number) {
  return put<Result<void>>(`/comment/${id}/status`, { status })
}

export function batchUpdateCommentStatus(ids: number[], status: number) {
  return put<Result<void>>('/comment/status/batch', { ids, status })
}

export function removeComment(ids: number[]) {
  return del<Result<void>>('/comment', { ids })
}
