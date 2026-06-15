import { get, post, put, del } from '@/utils/request'
import type { ApiResponse, PaginationResult, WorkFormData } from '@/types'

export interface WorkQueryParams {
  page?: number
  pageSize?: number
  title?: string
  author_nickname?: string
  status?: number
}

export interface WorkItem {
  id: number
  title: string
  description: string
  cover_image: string
  author_id: number
  author_nickname: string
  category: string
  status: number
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
}

export function getWorkList(params: WorkQueryParams): Promise<ApiResponse<PaginationResult<WorkItem>>> {
  return get<PaginationResult<WorkItem>>('/works', params)
}

export function getWorkDetail(id: number): Promise<ApiResponse<WorkItem>> {
  return get<WorkItem>(`/works/${id}`)
}

export function createWork(data: WorkFormData): Promise<ApiResponse<WorkItem>> {
  return post<WorkItem>('/works', data)
}

export function updateWork(id: number, data: WorkFormData): Promise<ApiResponse<WorkItem>> {
  return put<WorkItem>(`/works/${id}`, data)
}

export function deleteWork(id: number): Promise<ApiResponse<null>> {
  return del<null>(`/works/${id}`)
}

export function batchDeleteWork(ids: number[]): Promise<ApiResponse<null>> {
  return post<null>('/works/batch-delete', { ids })
}
