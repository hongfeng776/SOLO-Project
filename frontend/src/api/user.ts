import { http } from '@/utils/request'
import type { UserItem, PaginationParams, PaginationResult } from '@/types'

export const getUserListApi = (params: PaginationParams): Promise<PaginationResult<UserItem>> => {
  return http.get<PaginationResult<UserItem>>('/api/v1/users', params)
}

export const getUserDetailApi = (id: number): Promise<UserItem> => {
  return http.get<UserItem>(`/api/v1/users/${id}`)
}

export const createUserApi = (data: Partial<UserItem>): Promise<{ id: number }> => {
  return http.post<{ id: number }>('/api/v1/users', data)
}

export const updateUserApi = (id: number, data: Partial<UserItem>): Promise<void> => {
  return http.put<void>(`/api/v1/users/${id}`, data)
}

export const deleteUserApi = (id: number): Promise<void> => {
  return http.delete<void>(`/api/v1/users/${id}`)
}

export const batchDeleteUsersApi = (ids: number[]): Promise<void> => {
  return http.post<void>('/api/v1/users/batch-delete', { ids })
}

export const updateUserStatusApi = (id: number, status: number): Promise<void> => {
  return http.put<void>(`/api/v1/users/${id}/status`, { status })
}
