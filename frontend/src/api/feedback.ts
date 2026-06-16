import { get, post, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { Feedback } from '@/types/business'

export const getFeedbackList = (params: Record<string, unknown>): Promise<PageResult<Feedback>> => {
  return get<PageResult<Feedback>>('/feedback', params)
}

export const getFeedbackDetail = (id: number): Promise<Feedback> => {
  return get<Feedback>(`/feedback/${id}`)
}

export const createFeedback = (data: Partial<Feedback>): Promise<{ id: number }> => {
  return post<{ id: number }>('/feedback', data)
}

export const handleFeedback = (
  id: number,
  data: { handleResult: string; status?: number }
): Promise<{ id: number }> => {
  return post<{ id: number }>(`/feedback/${id}/handle`, data)
}

export const batchHandleFeedbacks = (
  ids: number[],
  data: { handleResult: string; status?: number }
): Promise<null> => {
  return post<null>('/feedback/batch-handle', { ids, ...data })
}

export const closeFeedback = (id: number): Promise<{ id: number }> => {
  return post<{ id: number }>(`/feedback/${id}/close`)
}

export const deleteFeedback = (id: number): Promise<null> => {
  return del<null>(`/feedback/${id}`)
}

export const getFeedbackStats = (): Promise<Record<string, number>> => {
  return get<Record<string, number>>('/feedback/stats')
}
