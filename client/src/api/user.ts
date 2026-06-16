import { get, post, put, del } from '@utils/request'
import type { IUserInfo, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export function getList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IUserInfo>>> {
  return get<IPaginatedData<IUserInfo>>('/api/users', params)
}

export function getById(id: number): Promise<IApiResponse<IUserInfo>> {
  return get<IUserInfo>(`/api/users/${id}`)
}

export function create(data: Partial<IUserInfo>): Promise<IApiResponse<IUserInfo>> {
  return post<IUserInfo>('/api/users', data)
}

export function update(id: number, data: Partial<IUserInfo>): Promise<IApiResponse<IUserInfo>> {
  return put<IUserInfo>(`/api/users/${id}`, data)
}

export function remove(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/users/${id}`)
}

export function batchRemove(ids: number[]): Promise<IApiResponse<null>> {
  return post<null>('/api/users/batch-delete', { ids })
}

export function resetPassword(id: number, password: string): Promise<IApiResponse<null>> {
  return post<null>(`/api/users/${id}/reset-password`, { password })
}

export function toggleStatus(id: number, status: number): Promise<IApiResponse<null>> {
  return post<null>(`/api/users/${id}/toggle-status`, { status })
}

export function assignRoles(userId: number, roleIds: number[]): Promise<IApiResponse<null>> {
  return post<null>(`/api/users/${userId}/roles`, { roleIds })
}

export function getUserRoles(userId: number): Promise<IApiResponse<number[]>> {
  return get<number[]>(`/api/users/${userId}/roles`)
}
