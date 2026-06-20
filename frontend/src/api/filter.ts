import request from '@/utils/request'
import type { PageResult, PageParams, FilterEffect, FilterValidationResult, FilterEditLog, FilterBatchResult, FilterTraceResultItem, FilterListParams } from '@/types'

export const getFilterList = (params: FilterListParams) => {
  return request.get<PageResult<FilterEffect>>('/filters', params)
}

export const getFilterDetail = (id: number) => {
  return request.get<FilterEffect>(`/filters/${id}`)
}

export const validateFilterCreate = (data: Partial<FilterEffect>) => {
  return request.post<FilterValidationResult>('/filters/validate', data)
}

export const createFilterWithValidation = (data: Partial<FilterEffect>) => {
  return request.post<FilterEffect>('/filters/entry', data)
}

export const updateFilterWithConstraint = (id: number, data: Partial<FilterEffect>) => {
  return request.put<FilterEffect>(`/filters/${id}/constrain`, data)
}

export const getFilterEditLogs = (id: number, params?: PageParams) => {
  return request.get<PageResult<FilterEditLog>>(`/filters/${id}/edit-logs`, params)
}

export const batchValidateAndSubmit = (items: Partial<FilterEffect>[]) => {
  return request.post<FilterBatchResult>('/filters/batch-entry', { items })
}

export const traceFilter = (keyword: string) => {
  return request.get<FilterTraceResultItem[]>('/filters/trace', { keyword })
}

export const updateFilterStatus = (id: number, status: string) => {
  return request.put<FilterEffect>(`/filters/${id}/status`, { status })
}

export const deleteFilter = (id: number) => {
  return request.delete(`/filters/${id}`)
}
