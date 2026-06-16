import { http } from '@/utils/request'
import type { RoleItem, PaginationParams, PaginationResult } from '@/types'

export const getRoleListApi = (params: PaginationParams): Promise<PaginationResult<RoleItem>> => {
  return http.get<PaginationResult<RoleItem>>('/api/v1/roles', params)
}

export const getAllRolesApi = (): Promise<Array<{ id: number; code: string; name: string }>> => {
  return http.get<Array<{ id: number; code: string; name: string }>>('/api/v1/roles/all')
}

export const getRoleDetailApi = (id: number): Promise<RoleItem> => {
  return http.get<RoleItem>(`/api/v1/roles/${id}`)
}

export const createRoleApi = (data: Partial<RoleItem>): Promise<{ id: number }> => {
  return http.post<{ id: number }>('/api/v1/roles', data)
}

export const updateRoleApi = (id: number, data: Partial<RoleItem>): Promise<void> => {
  return http.put<void>(`/api/v1/roles/${id}`, data)
}

export const deleteRoleApi = (id: number): Promise<void> => {
  return http.delete<void>(`/api/v1/roles/${id}`)
}
