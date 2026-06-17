import request from '@/utils/request'
import type { Category, CategoryTraceResult, MigrationResult } from '@/types'

interface CategoryListParams {
  type?: string
  status?: string
  keyword?: string
}

interface CategoryTreeParams {
  type?: string
}

export const getCategoryList = (params?: CategoryListParams) => {
  return request.get<Category[]>('/categories', { params })
}

export const getCategoryTree = (params?: CategoryTreeParams) => {
  return request.get<Category[]>('/categories/tree', { params })
}

export const getCategoryDetail = (id: number) => {
  return request.get<Category>(`/categories/${id}`)
}

export const createCategory = (data: Partial<Category>) => {
  return request.post<Category>('/categories', data)
}

export const updateCategory = (id: number, data: Partial<Category>) => {
  return request.put<Category>(`/categories/${id}`, data)
}

export const deleteCategory = (id: number) => {
  return request.delete(`/categories/${id}`)
}

export const validateHierarchy = (data: { parentId: number }) => {
  return request.post<{ valid: boolean; reason?: string }>('/categories/validate-hierarchy', data)
}

export const validateMatch = (data: { resourceId: number; categoryId: number }) => {
  return request.post<{ valid: boolean; matchScore: number; errors: string[] }>('/categories/validate-match', data)
}

export const bindResource = (resourceId: number, categoryId: number) => {
  return request.post<{ success: boolean; matchScore: number }>('/categories/bind', { resourceId, categoryId })
}

export const adjustParent = (categoryId: number, newParentId: number) => {
  return request.put<{ success: boolean; affectedResources: number }>(`/categories/${categoryId}/adjust-parent`, { newParentId })
}

export const batchMigrate = (resourceIds: number[], targetCategoryId: number) => {
  return request.post<MigrationResult>('/categories/batch-migrate', { resourceIds, targetCategoryId })
}

export const getCategoryTrace = (categoryId: number, days = 30) => {
  return request.get<CategoryTraceResult>(`/categories/${categoryId}/trace`, { params: { days } })
}

export const getCategoryStats = () => {
  return request.get<any[]>('/categories/stats')
}
