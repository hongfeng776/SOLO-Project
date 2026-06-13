import { get, post, put, del } from '@/utils/request'
import type { ApiResponse } from '@/types'

export interface PermissionItem {
  id: number
  name: string
  code: string
  type: 'menu' | 'button' | 'api'
  parent_id: number | null
  path?: string
  component?: string
  icon?: string
  sort?: number
  status: number
  children?: PermissionItem[]
  created_at: string
}

export function getPermissionList(params?: { type?: string }): Promise<ApiResponse<PermissionItem[]>> {
  return get<PermissionItem[]>('/permissions', params)
}

export function getPermissionTree(): Promise<ApiResponse<PermissionItem[]>> {
  return get<PermissionItem[]>('/permissions/tree')
}

export function getPermissionDetail(id: number): Promise<ApiResponse<PermissionItem>> {
  return get<PermissionItem>(`/permissions/${id}`)
}

export function createPermission(data: Partial<PermissionItem>): Promise<ApiResponse<PermissionItem>> {
  return post<PermissionItem>('/permissions', data)
}

export function updatePermission(id: number, data: Partial<PermissionItem>): Promise<ApiResponse<PermissionItem>> {
  return put<PermissionItem>(`/permissions/${id}`, data)
}

export function deletePermission(id: number): Promise<ApiResponse<null>> {
  return del<null>(`/permissions/${id}`)
}
