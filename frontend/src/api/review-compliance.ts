import { get, post, put } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { ReviewActionData, ReviewComplianceResult, ReviewAbnormalLog } from '@/types/business'

export const validateReview = (data: {
  reviewerId: number
  data: ReviewActionData
}): Promise<ReviewComplianceResult> => {
  return post<ReviewComplianceResult>('/review/compliance/validate', data)
}

export const getAbnormalReviewLogs = (params: {
  page: number
  pageSize: number
  reviewerId?: number
  handled?: number
}): Promise<PageResult<ReviewAbnormalLog>> => {
  return get<PageResult<ReviewAbnormalLog>>('/review/compliance/abnormal-logs', params)
}

export const handleAbnormalReview = (id: number): Promise<boolean> => {
  return put<boolean>(`/review/compliance/abnormal-logs/${id}/handle`)
}
