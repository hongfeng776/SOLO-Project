import { get } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { ReviewLog, ReviewerStats } from '@/types/business'

export const getReviewLogList = (params: {
  page: number
  pageSize: number
  noteId?: number
  reviewerId?: number
  action?: number
  startTime?: string
  endTime?: string
}): Promise<PageResult<ReviewLog>> => {
  return get<PageResult<ReviewLog>>('/review/logs', params)
}

export const getReviewLogDetail = (id: number): Promise<ReviewLog> => {
  return get<ReviewLog>(`/review/logs/${id}`)
}

export const getNoteReviewHistory = (noteId: number): Promise<ReviewLog[]> => {
  return get<ReviewLog[]>(`/review/logs/note/${noteId}`)
}

export const getReviewerStats = (reviewerId: number, days?: number): Promise<ReviewerStats> => {
  return get<ReviewerStats>('/review/logs/reviewer/stats', { reviewerId, days })
}
