import request from '@/utils/request'
import type { PageResult, Template, PageParams } from '@/types'

interface TemplateListParams extends PageParams {
  keyword?: string
  status?: string
  categoryId?: number
}

export const getTemplateList = (params: TemplateListParams) => {
  return request.get<PageResult<Template>>('/templates', params)
}

export const getTemplateDetail = (id: number) => {
  return request.get<Template>(`/templates/${id}`)
}

export const createTemplate = (data: Partial<Template>) => {
  return request.post<Template>('/templates', data)
}

export const updateTemplate = (id: number, data: Partial<Template>) => {
  return request.put<Template>(`/templates/${id}`, data)
}

export const deleteTemplate = (id: number) => {
  return request.delete(`/templates/${id}`)
}

export const batchDeleteTemplate = (ids: number[]) => {
  return request.post('/templates/batch-delete', { ids })
}
