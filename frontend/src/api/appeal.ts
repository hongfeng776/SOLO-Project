import request from '@/utils/request'
import type { PageResult, PageParams, Appeal } from '@/types'

interface AppealListParams extends PageParams {
  keyword?: string
  status?: string
}

export const getAppealList = (params: AppealListParams) => {
  return request.get<PageResult<Appeal>>('/appeals', params)
}

export const getAppealDetail = (id: number) => {
  return request.get<Appeal>(`/appeals/${id}`)
}

export const createAppeal = (data: Partial<Appeal>) => {
  return request.post<Appeal>('/appeals', data)
}

export const reviewAppeal = (id: number, data: { reviewResult: string; reviewOpinion: string }) => {
  return request.put<Appeal>(`/appeals/${id}/review`, data)
}

export const getPendingAppealCount = () => {
  return request.get<{ count: number }>('/appeals/pending-count')
}
