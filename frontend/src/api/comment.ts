import { get, post, put, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { Comment, ComplianceCheckResult, CommentTraceResult, HighlightPart } from '@/types/business'

export const getCommentList = (params: Record<string, unknown>): Promise<PageResult<Comment>> => {
  return get<PageResult<Comment>>('/comment', params)
}

export const getCommentDetail = (id: number): Promise<Comment> => {
  return get<Comment>(`/comment/${id}`)
}

export const createComment = (data: Partial<Comment>): Promise<{ id: number; intercepted: boolean; complianceResult?: ComplianceCheckResult }> => {
  return post<{ id: number; intercepted: boolean; complianceResult?: ComplianceCheckResult }>('/comment', data)
}

export const updateComment = (id: number, data: Partial<Comment>): Promise<{ id: number }> => {
  return put<{ id: number }>(`/comment/${id}`, data)
}

export const deleteComment = (id: number): Promise<null> => {
  return del<null>(`/comment/${id}`)
}

export const auditComment = (
  id: number,
  data: { status: number; violationType?: string; reason?: string }
): Promise<{ id: number }> => {
  return post<{ id: number }>(`/comment/audit/${id}`, data)
}

export const batchAuditComments = (
  ids: number[],
  data: { status: number; violationType?: string; reason?: string }
): Promise<null> => {
  return post<null>('/comment/batch-audit', { ids, ...data })
}

export const batchDeleteComments = (ids: number[]): Promise<null> => {
  return post<null>('/comment/batch-delete', { ids })
}

export const batchMarkReviewComments = (ids: number[]): Promise<null> => {
  return post<null>('/comment/batch-mark-review', { ids })
}

export const getCommentStats = (): Promise<Record<string, number>> => {
  return get<Record<string, number>>('/comment/stats')
}

export const checkCommentCompliance = (
  content: string,
  noteId: number
): Promise<ComplianceCheckResult> => {
  return post<ComplianceCheckResult>('/comment/check-compliance', { content, noteId })
}

export const getCommentTrace = (id: number): Promise<CommentTraceResult> => {
  return get<CommentTraceResult>(`/comment/${id}/trace`)
}

export const getSensitiveWords = (): Promise<{
  sensitiveWords: string[]
  violationPhrases: string[]
  trafficKeywords: string[]
}> => {
  return get<{
    sensitiveWords: string[]
    violationPhrases: string[]
    trafficKeywords: string[]
  }>('/comment/sensitive-words')
}

export const highlightCommentContent = (content: string): Promise<HighlightPart[]> => {
  return post<HighlightPart[]>('/comment/highlight', { content })
}
