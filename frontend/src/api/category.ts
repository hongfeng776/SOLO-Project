import { get, post, put, del, patch } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { Category } from '@/types/business'

export interface CategoryListParams {
  page: number
  pageSize: number
  keyword?: string
  status?: number
  level?: number
  scene?: string
  parentId?: number
}

export const getCategoryList = (params: CategoryListParams): Promise<PageResult<Category>> => {
  return get<PageResult<Category>>('/categories', params)
}

export const getCategoryTree = (): Promise<Category[]> => {
  return get<Category[]>('/categories/tree')
}

export const getCategoryAll = (): Promise<Category[]> => {
  return get<Category[]>('/categories/all')
}

export const getCategoryDetail = (id: number): Promise<Category> => {
  return get<Category>(`/categories/${id}`)
}

export const getCategoryStats = (): Promise<{
  totalCount: number
  coreCount: number
  totalTagCount: number
  todayNewCount: number
}> => {
  return get<{
    totalCount: number
    coreCount: number
    totalTagCount: number
    todayNewCount: number
  }>('/categories/stats/summary')
}

export const createCategory = (data: Partial<Category>): Promise<{ id: number }> => {
  return post<{ id: number }>('/categories', data)
}

export const updateCategory = (id: number, data: Partial<Category>): Promise<{ id: number }> => {
  return put<{ id: number }>(`/categories/${id}`, data)
}

export const deleteCategory = (id: number): Promise<null> => {
  return del<null>(`/categories/${id}`)
}

export const updateCategoryStatus = (id: number, status: number): Promise<{ id: number }> => {
  return patch<{ id: number }>(`/categories/${id}/status`, { status })
}
