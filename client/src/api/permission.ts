import { get, post, put, del } from '@utils/request'
import type { IPermission, IApiResponse } from '@/types/api'

export function getTree(): Promise<IApiResponse<IPermission[]>> {
  return get<IPermission[]>('/api/permissions/tree')
}

export function getList(params?: Record<string, any>): Promise<IApiResponse<IPermission[]>> {
  return get<IPermission[]>('/api/permissions', params)
}

export function getById(id: number): Promise<IApiResponse<IPermission>> {
  return get<IPermission>(`/api/permissions/${id}`)
}

export function create(data: Partial<IPermission>): Promise<IApiResponse<IPermission>> {
  return post<IPermission>('/api/permissions', data)
}

export function update(id: number, data: Partial<IPermission>): Promise<IApiResponse<IPermission>> {
  return put<IPermission>(`/api/permissions/${id}`, data)
}

export function remove(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/permissions/${id}`)
}
