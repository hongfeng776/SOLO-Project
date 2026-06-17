import request from '@/utils/request'
import type { PageResult, RecycleItem } from '@/types'

export interface RecycleListParams {
  page?: number
  pageSize?: number
  keyword?: string
  reviewStatus?: string
  resourceType?: string
}

export const validateDiscard = (resourceId: number) => {
  return request.get<any>(`/recycles/validate/${resourceId}`)
}

export const submitDiscard = (resourceId: number, reason: string) => {
  return request.post<RecycleItem>('/recycles', { resourceId, reason })
}

export const reviewDiscard = (id: number, result: string, opinion: string) => {
  return request.put<RecycleItem>(`/recycles/${id}/review`, { result, opinion })
}

export const batchDiscard = (resourceIds: number[], reason: string) => {
  return request.post<any>('/recycles/batch', { resourceIds, reason })
}

export const getRecycleList = (params: RecycleListParams) => {
  return request.get<PageResult<RecycleItem>>('/recycles', params)
}

export const getRecycleDetail = (id: number) => {
  return request.get<RecycleItem>(`/recycles/${id}`)
}

export const validateRestore = (id: number) => {
  return request.get<any>(`/recycles/validate-restore/${id}`)
}

export const restoreResource = (id: number) => {
  return request.post<any>(`/recycles/${id}/restore`)
}

export const batchRestore = (ids: number[]) => {
  return request.post<any>('/recycles/batch-restore', { ids })
}

export const getPendingCount = () => {
  return request.get<number>('/recycles/pending-count')
}
