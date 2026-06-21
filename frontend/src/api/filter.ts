import request from '@/utils/request'
import type { PageResult, PageParams, FilterEffect, FilterValidationResult, FilterEditLog, FilterBatchResult, FilterTraceResultItem, FilterListParams, FilterStatusOverview, FilterStatusUpdateResult, BatchStatusResult, CategoryValidateResult, CategoryAdjustResult, BatchCategoryMigrateResult, FilterCategoryTraceResult, FilterCategoryAdapt, WeightValidateResult, WeightAdjustResult, BatchWeightResult, WeightTraceResult, FilterWeightLog } from '@/types'

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

export const updateFilterStatus = (id: number, status: string, options?: {
  skipSecondConfirm?: boolean
  violationReason?: string
  operatorName?: string
}) => {
  return request.put<FilterStatusUpdateResult>(`/filters/${id}/status`, { status, ...options })
}

export const batchUpdateFilterStatus = (ids: number[], status: string, operatorName?: string) => {
  return request.post<BatchStatusResult>('/filters/batch-status', { ids, status, operatorName })
}

export const getFilterStatusOverview = () => {
  return request.get<FilterStatusOverview>('/filters/status/overview')
}

export const validateCategoryBind = (filterId: number, categoryId: number) => {
  return request.post<CategoryValidateResult>('/filters/category/validate', { filterId, categoryId })
}

export const adjustCategoryStep = (filterId: number, categoryId: number, operatorName?: string, reason?: string) => {
  return request.post<CategoryAdjustResult>('/filters/category/adjust', { filterId, categoryId, operatorName, reason })
}

export const batchCategoryMigrate = (filterIds: number[], categoryId: number, operatorName?: string) => {
  return request.post<BatchCategoryMigrateResult>('/filters/category/batch-migrate', { filterIds, categoryId, operatorName })
}

export const traceCategoryAdapt = (categoryId: number) => {
  return request.get<FilterCategoryTraceResult>('/filters/category/trace', { categoryId })
}

export const getCategoryAdaptList = (params?: PageParams & { categoryId?: number; isMatched?: boolean; bindType?: string; changeType?: string }) => {
  return request.get<PageResult<FilterCategoryAdapt>>('/filters/category/adapts', params)
}

export const validateWeightAdjust = (filterId: number, targetWeight: number) => {
  return request.post<WeightValidateResult>('/filters/weight/validate', { filterId, targetWeight })
}

export const adjustWeightStep = (filterId: number, newWeight: number, operatorName?: string, reason?: string) => {
  return request.post<WeightAdjustResult>('/filters/weight/adjust', { filterId, newWeight, operatorName, reason })
}

export const batchWeightConfig = (filterIds: number[], mode: string, operatorName?: string) => {
  return request.post<BatchWeightResult>('/filters/weight/batch-config', { filterIds, mode, operatorName })
}

export const traceWeightHistory = (filterId: number) => {
  return request.get<WeightTraceResult>('/filters/weight/trace', { filterId })
}

export const getWeightLogList = (params?: PageParams & { filterId?: number; changeType?: string; operatorId?: number }) => {
  return request.get<PageResult<FilterWeightLog>>('/filters/weight/logs', params)
}

export const deleteFilter = (id: number) => {
  return request.delete(`/filters/${id}`)
}
