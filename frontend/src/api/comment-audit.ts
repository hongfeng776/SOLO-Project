import { http } from '@/utils/request'
import type {
  CommentAuditDetail,
  CommentAuditPoolItem,
  CommentAuditSubmitData,
  CommentAuditActionResult,
  BatchCommentAuditParams,
  BatchOperationResult,
  CommentAuditTraceRecord,
  CommentAuditQCResult,
  BatchCommentProgress,
  PaginationParams,
  PaginationResult,
} from '@/types'

export const getCommentAuditPoolApi = (
  params: PaginationParams
): Promise<PaginationResult<CommentAuditPoolItem>> => {
  return http.get<PaginationResult<CommentAuditPoolItem>>('/api/v1/comment-audit/pool', params)
}

export const getCommentAuditDetailApi = (commentId: number): Promise<CommentAuditDetail> => {
  return http.get<CommentAuditDetail>(`/api/v1/comment-audit/${commentId}/detail`)
}

export const checkCommentDuplicateAuditApi = (
  commentId: number
): Promise<{ isDuplicate: boolean; lastAuditTime?: string; lastAuditor?: string }> => {
  return http.get(`/api/v1/comment-audit/${commentId}/check-duplicate`)
}

export const submitCommentAuditApi = (
  data: CommentAuditSubmitData
): Promise<CommentAuditActionResult> => {
  return http.post('/api/v1/comment-audit/submit', data)
}

export const batchCommentActionApi = (
  params: BatchCommentAuditParams
): Promise<BatchOperationResult & { batchId: string; totalProcessed: number }> => {
  return http.post('/api/v1/comment-audit/batch-action', params)
}

export const getBatchProgressApi = (batchId: string): Promise<BatchCommentProgress> => {
  return http.get<BatchCommentProgress>(`/api/v1/comment-audit/batch-progress/${batchId}`)
}

export const refreshPartialCommentsApi = (
  commentIds: number[]
): Promise<{ updatedItems: CommentAuditPoolItem[] }> => {
  return http.post('/api/v1/comment-audit/refresh-partial', { commentIds })
}

export const getCommentAuditTraceApi = (
  commentId: number
): Promise<CommentAuditTraceRecord> => {
  return http.get<CommentAuditTraceRecord>(`/api/v1/comment-audit/trace/${commentId}`)
}

export const getCommentAuditQCApi = (
  period: 'today' | 'week' | 'month',
  options?: { auditorId?: number; violationType?: string }
): Promise<CommentAuditQCResult> => {
  return http.get<CommentAuditQCResult>('/api/v1/comment-audit/qc-report', { period, ...options })
}

export const checkCommentPunishmentConsistencyApi = (params: {
  violationType: string
  action: string
  muteDays?: number
}): Promise<{
  consistent: boolean
  standardAction: string
  standardMuteDays: number
  deviation: string
  suggestions: string[]
}> => {
  return http.post('/api/v1/comment-audit/check-punishment', params)
}
