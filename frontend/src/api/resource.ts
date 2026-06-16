import request from '@/utils/request'
import type { PageResult, ImageResource, PageParams } from '@/types'

interface ResourceListParams extends PageParams {
  keyword?: string
  status?: string
  categoryId?: number
  fileType?: string
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
