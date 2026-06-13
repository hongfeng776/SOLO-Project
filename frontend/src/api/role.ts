import { get, post, put, del } from '@/utils/request'
import type { ApiResponse, PaginationResult } from '@/types'

export interface RoleQueryParams {
  page?: number
  pageSize?: number
  name?: string
  code?: string
  status?: number
}

export interface RoleItem {
  id: number
  name: string
  code: string
  description: string
  status: number
  permissions?: { id: number; name: string; code: string }[]
  created_at: string
}

export function getRoleList(params: RoleQueryParams): Promise<ApiResponse<PaginationResult<RoleItem>>> {
  return get<PaginationResult<RoleItem>>('/roles', params)
}

export function getRoleDetail(id: number): Promise<ApiResponse<RoleItem>> {
  return get<RoleItem>(`/roles/${id}`)
}

export function createRole(data: Partial<RoleItem>): Promise<ApiResponse<RoleItem>> {
  return post<RoleItem>('/roles', data)
}

export function updateRole(id: number, data: Partial<RoleItem>): Promise<ApiResponse<RoleItem>> {
  return put<RoleItem>(`/roles/${id}`, data)
}

export function deleteRole(id: number): Promise<ApiResponse<null>> {
  return del<null>(`/roles/${id}`)
}

export function assignRolePermissions(id: number, permissionIds: number[]): Promise<ApiResponse<null>> {
  return post<null>(`/roles/${id}/permissions`, { permission_ids: permissionIds })
}

export function getRolePermissions(id: number): Promise<ApiResponse<{ id: number; name: string; code: string }[]>> {
  return get<{ id: number; name: string; code: string }[]>(`/roles/${id}/permissions`)
}
