import { get, post } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { Note, ReviewActionData, ReviewResult, BatchReviewResult } from '@/types/business'

export const getReviewQueue = (params: {
  page: number
  pageSize: number
  reviewLevel?: number
  noteType?: number
  keyword?: string
}): Promise<PageResult<Note>> => {
  return get<PageResult<Note>>('/review/queue', params)
}

export const getHighRiskCount = (reviewLevel?: number): Promise<{ highRisk: number; total: number }> => {
  return get<{ highRisk: number; total: number }>('/review/high-risk-count', { reviewLevel })
}

export const executeReview = (data: ReviewActionData): Promise<ReviewResult> => {
  return post<ReviewResult>('/review/execute', data)
}

export const batchReview = (data: {
  ids: number[]
  action: number
  violationType?: string
  reason?: string
}): Promise<BatchReviewResult> => {
  return post<BatchReviewResult>('/review/batch', data)
}

export const doubleClickReview = (noteId: number): Promise<ReviewResult> => {
  return post<ReviewResult>(`/review/double-click/${noteId}`)
}
