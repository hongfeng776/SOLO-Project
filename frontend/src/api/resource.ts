import request from '@/utils/request'
import type { PageResult, ImageResource, PageParams, ValidateResult, BatchResult, TraceResult } from '@/types'

interface ResourceListParams extends PageParams {
  keyword?: string
  status?: string
  categoryId?: number
  fileType?: string
  materialCode?: string
}

export const getResourceList = (params: ResourceListParams) => {
  return request.get<PageResult<ImageResource>>('/resources', params)
}

export const getResourceDetail = (id: number) => {
  return request.get<ImageResource>(`/resources/${id}`)
}

export const createResource = (data: Partial<ImageResource>) => {
  return request.post<ImageResource>('/resources', data)
}

export const updateResource = (id: number, data: Partial<ImageResource>) => {
  return request.put<ImageResource>(`/resources/${id}`, data)
}

export const deleteResource = (id: number) => {
  return request.delete(`/resources/${id}`)
}

export const batchDeleteResource = (ids: number[]) => {
  return request.post('/resources/batch-delete', { ids })
}

export const updateResourceStatus = (id: number, status: string) => {
  return request.put(`/resources/${id}/status`, { status })
}

export const batchUpdateStatus = (ids: number[], status: string) => {
  return request.post('/resources/batch-status', { ids, status })
}

export const validateCreate = (data: Partial<ImageResource>) => {
  return request.post<ValidateResult>('/resources/validate', data)
}

export const createWithValidation = (data: Partial<ImageResource>) => {
  return request.post<ImageResource>('/resources/entry', data)
}

export const updateWithConstraint = (id: number, data: Partial<ImageResource>) => {
  return request.put<ImageResource>(`/resources/${id}/constrain`, data)
}

export const batchUpdateWeight = (ids: number[], sortWeight: number) => {
  return request.post<BatchResult>('/resources/batch-weight', { ids, sortWeight })
}

export const batchToggleStatus = (ids: number[], targetStatus: string) => {
  return request.post<BatchResult>('/resources/batch-toggle', { ids, targetStatus })
}

export const traceMaterial = (keyword: string) => {
  return request.get<TraceResult>('/resources/trace', { keyword })
}
