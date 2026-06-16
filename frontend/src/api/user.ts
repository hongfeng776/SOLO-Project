import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export interface User {
  id: number
  username: string
  nickname: string
  avatar: string
  phone: string
  email: string
  status: number
  level: number
  levelName?: string
  totalAmount: number
  totalOrders: number
  lastLoginTime?: string
  createdAt: string
  updatedAt: string
}

export interface UserQueryParams extends PageParams {
  username?: string
  phone?: string
  status?: number
  level?: number
}

export function getUserList(params: UserQueryParams): Promise<ApiResponse<PageResult<User>>> {
  return request.get<PageResult<User>>('/user/list', { params })
}

export function getUserDetail(id: number): Promise<ApiResponse<User>> {
  return request.get<User>(`/user/${id}`)
}

export function createUser(data: Partial<User> & { password: string }): Promise<ApiResponse<User>> {
  return request.post<User>('/user/create', data)
}

export function updateUser(id: number, data: Partial<User>): Promise<ApiResponse<User>> {
  return request.put<User>(`/user/${id}`, data)
}

export function deleteUser(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`/user/${id}`)
}

export function updateUserStatus(id: number, status: number): Promise<ApiResponse<null>> {
  return request.put<null>(`/user/${id}/status`, { status })
}

export function resetUserPassword(id: number, password: string): Promise<ApiResponse<null>> {
  return request.put<null>(`/user/${id}/resetPassword`, { password })
}

export function batchDeleteUser(ids: number[]): Promise<ApiResponse<null>> {
  return request.post<null>('/user/batchDelete', { ids })
}
