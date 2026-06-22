import request from '@/utils/request'
import type {
  QualityAssessResult,
  QualityBatchAssessResult,
  QualityReviewResult,
  QualityAssessmentLogItem,
  QualityReviewLogItem,
  QualityStats,
  QualityListParams,
  QualityLogParams,
  QualityReviewLogParams,
  QualityAssessParams,
  QualityBatchAssessParams,
  QualityReviewParams,
  QualityDetailResult
} from '@/types'
import type { PageResult } from '@/types'

export const getQualityStats = () => {
  return request.get<QualityStats>('/quality-control/stats')
}

export const getQualityResourceList = (params: QualityListParams) => {
  return request.get<PageResult<any>>('/quality-control/resources', params)
}

export const getResourceQualityDetail = (id: number) => {
  return request.get<QualityDetailResult>(`/quality-control/resources/${id}`)
}

export const getQualityAssessmentLogs = (params: QualityLogParams) => {
  return request.get<PageResult<QualityAssessmentLogItem>>('/quality-control/assessment-logs', params)
}

export const getQualityReviewLogs = (params: QualityReviewLogParams) => {
  return request.get<PageResult<QualityReviewLogItem>>('/quality-control/review-logs', params)
}

export const assessResourceQuality = (id: number, params?: QualityAssessParams) => {
  return request.post<QualityAssessResult>(`/quality-control/resources/${id}/assess`, params || {})
}

export const batchAssessQuality = (params: QualityBatchAssessParams) => {
  return request.post<QualityBatchAssessResult>('/quality-control/batch-assess', params)
}

export const reviewResourceQuality = (id: number, params: QualityReviewParams) => {
  return request.post<QualityReviewResult>(`/quality-control/resources/${id}/review`, params)
}
