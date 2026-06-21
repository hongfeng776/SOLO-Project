import { http } from '@/utils/request'
import type { PaginationParams, PaginationResult, CommentManageItem, CommentOperateParams, CommentBatchOperateParams, CommentBatchOperateResult, CommentTraceResult, CommentDuplicateCheckResult, CommentValidateResult } from '@/types'

export const getCommentManageListApi = (params: PaginationParams): Promise<PaginationResult<CommentManageItem>> => {
  return http.get<PaginationResult<CommentManageItem>>('/api/v1/comment-manage', params)
}

export const operateCommentApi = (id: number, data: CommentOperateParams): Promise<any> => {
  return http.post<any>(`/api/v1/comment-manage/${id}/operate`, data)
}

export const batchOperateCommentsApi = (data: CommentBatchOperateParams): Promise<CommentBatchOperateResult> => {
  return http.post<CommentBatchOperateResult>('/api/v1/comment-manage/batch-operate', data)
}

export const traceCommentApi = (params: { commentId?: number; contentId?: number; userUid?: string }): Promise<CommentTraceResult> => {
  return http.get<CommentTraceResult>('/api/v1/comment-manage/trace', params)
}

export const checkDuplicateOperationApi = (id: number, operationType: string): Promise<CommentDuplicateCheckResult> => {
  return http.get<CommentDuplicateCheckResult>(`/api/v1/comment-manage/${id}/check-duplicate`, { operationType })
}

export const validateOperationApi = (id: number, operationType: string): Promise<CommentValidateResult> => {
  return http.get<CommentValidateResult>(`/api/v1/comment-manage/${id}/validate`, { operationType })
}
