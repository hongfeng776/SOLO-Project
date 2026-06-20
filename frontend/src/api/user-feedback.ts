import { http } from '@/utils/request'
import type {
  PaginationResult, PaginationParams,
  FeedbackRecordItem, FeedbackStats, FeedbackBatchResult,
  FeedbackTraceResult, FeedbackValidateResult, FeedbackDuplicateCheck,
} from '@/types'

export const getFeedbackStatsApi = (): Promise<FeedbackStats> => {
  return http.get<FeedbackStats>('/api/v1/user-feedback/stats')
}

export const getFeedbackListApi = (
  params: PaginationParams & {
    keyword?: string
    feedbackType?: string
    status?: number | null
    priority?: number | null
    source?: string
    isArchived?: number
    handlerId?: number
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: string
  }
): Promise<PaginationResult<FeedbackRecordItem>> => {
  return http.get<PaginationResult<FeedbackRecordItem>>('/api/v1/user-feedback/list', params)
}

export const getFeedbackDetailApi = (id: number): Promise<FeedbackRecordItem> => {
  return http.get<FeedbackRecordItem>(`/api/v1/user-feedback/detail/${id}`)
}

export const createFeedbackApi = (data: {
  userId: number
  uid: string
  feedbackType: string
  title: string
  content: string
  attachments?: any[]
  source?: string
  priority?: number
  category?: string
  tags?: Record<string, any>
}): Promise<FeedbackRecordItem> => {
  return http.post<FeedbackRecordItem>('/api/v1/user-feedback/create', data)
}

export const assignFeedbackApi = (id: number): Promise<FeedbackRecordItem> => {
  return http.post<FeedbackRecordItem>(`/api/v1/user-feedback/assign/${id}`)
}

export const startProcessingFeedbackApi = (id: number): Promise<FeedbackRecordItem> => {
  return http.post<FeedbackRecordItem>(`/api/v1/user-feedback/start/${id}`)
}

export const resolveFeedbackApi = (id: number, data: {
  resolution: string
  result: string
}): Promise<FeedbackRecordItem> => {
  return http.post<FeedbackRecordItem>(`/api/v1/user-feedback/resolve/${id}`, data)
}

export const rejectFeedbackApi = (id: number, data: {
  rejectReason: string
}): Promise<FeedbackRecordItem> => {
  return http.post<FeedbackRecordItem>(`/api/v1/user-feedback/reject/${id}`, data)
}

export const batchActionFeedbackApi = (data: {
  action: 'ARCHIVE' | 'URGENT' | 'CLOSE'
  ids: number[]
  filters?: { feedbackType?: string; status?: number }
}): Promise<FeedbackBatchResult> => {
  return http.post<FeedbackBatchResult>('/api/v1/user-feedback/batch', data)
}

export const traceFeedbackApi = (params: {
  feedbackNo?: string
  uid?: string
  userId?: number
  batchNo?: string
}): Promise<FeedbackTraceResult> => {
  return http.get<FeedbackTraceResult>('/api/v1/user-feedback/trace', params)
}

export const validateFeedbackApi = (id: number): Promise<FeedbackValidateResult> => {
  return http.get<FeedbackValidateResult>(`/api/v1/user-feedback/validate/${id}`)
}

export const checkDuplicateFeedbackApi = (params: {
  userId: number
  title: string
  feedbackType: string
}): Promise<FeedbackDuplicateCheck> => {
  return http.get<FeedbackDuplicateCheck>('/api/v1/user-feedback/check-duplicate', params)
}

export const upgradePriorityApi = (): Promise<any> => {
  return http.post<any>('/api/v1/user-feedback/upgrade-priority')
}

export const updateTimelinessApi = (): Promise<any> => {
  return http.post<any>('/api/v1/user-feedback/update-timeliness')
}
