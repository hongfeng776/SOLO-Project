import { get, post, put, del } from '@/utils/request'
import type { ApiResponse, PaginationResult, UserFormData } from '@/types'

export interface UserQueryParams {
  page?: number
  pageSize?: number
  username?: string
  nickname?: string
  status?: number
}

export interface UserItem {
  id: number
  username: string
  nickname: string
  email: string
  status: number
  role: string
  roles?: { id: number; name: string; code: string }[]
  created_at: string
}

export function getUserList(params: UserQueryParams): Promise<ApiResponse<PaginationResult<UserItem>>> {
  return get<PaginationResult<UserItem>>('/users', params)
}

export function getUserDetail(id: number): Promise<ApiResponse<UserItem>> {
  return get<UserItem>(`/users/${id}`)
}

export function createUser(data: UserFormData): Promise<ApiResponse<UserItem>> {
  return post<UserItem>('/users', data)
}

export function updateUser(id: number, data: UserFormData): Promise<ApiResponse<UserItem>> {
  return put<UserItem>(`/users/${id}`, data)
}

export function deleteUser(id: number): Promise<ApiResponse<null>> {
  return del<null>(`/users/${id}`)
}

export function assignUserRoles(id: number, roleIds: number[]): Promise<ApiResponse<null>> {
  return post<null>(`/users/${id}/roles`, { role_ids: roleIds })
}

export function getUserRoles(id: number): Promise<ApiResponse<{ id: number; name: string; code: string }[]>> {
  return get<{ id: number; name: string; code: string }[]>(`/users/${id}/roles`)
}

export function resetUserPassword(id: number, password: string): Promise<ApiResponse<null>> {
  return post<null>(`/users/${id}/reset-password`, { password })
}
