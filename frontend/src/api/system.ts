import { get, post, put, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { SystemUser, Role } from '@/types/business'

export const getUserList = (params: Record<string, unknown>): Promise<PageResult<SystemUser>> => {
  return get<PageResult<SystemUser>>('/users', params)
}

export const createUser = (data: Partial<SystemUser> & { password: string; roleIds?: number[] }): Promise<{ id: number }> => {
  return post<{ id: number }>('/users', data)
}

export const updateUser = (
  id: number,
  data: Partial<SystemUser> & { password?: string; roleIds?: number[] }
): Promise<{ id: number }> => {
  return put<{ id: number }>(`/users/${id}`, data)
}

export const deleteUser = (id: number): Promise<null> => {
  return del<null>(`/users/${id}`)
}

export const getRoleList = (params: Record<string, unknown>): Promise<PageResult<Role>> => {
  return get<PageResult<Role>>('/system/roles', params)
}

export const getAllRoles = (): Promise<Role[]> => {
  return get<Role[]>('/system/roles/all')
}

export const createRole = (data: Partial<Role> & { permissions?: string[] }): Promise<{ id: number }> => {
  return post<{ id: number }>('/system/roles', data)
}

export const updateRole = (id: number, data: Partial<Role> & { permissions?: string[] }): Promise<{ id: number }> => {
  return put<{ id: number }>(`/system/roles/${id}`, data)
}

export const deleteRole = (id: number): Promise<null> => {
  return del<null>(`/system/roles/${id}`)
}
