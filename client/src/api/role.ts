import { get, post, put, del } from '@utils/request'
import type { IRole, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export function getList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IRole>>> {
  return get<IPaginatedData<IRole>>('/api/roles', params)
}

export function getById(id: number): Promise<IApiResponse<IRole>> {
  return get<IRole>(`/api/roles/${id}`)
}

export function create(data: Partial<IRole>): Promise<IApiResponse<IRole>> {
  return post<IRole>('/api/roles', data)
}

export function update(id: number, data: Partial<IRole>): Promise<IApiResponse<IRole>> {
  return put<IRole>(`/api/roles/${id}`, data)
}

export function remove(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/roles/${id}`)
}

export function batchRemove(ids: number[]): Promise<IApiResponse<null>> {
  return post<null>('/api/roles/batch-delete', { ids })
}

export function assignPermissions(roleId: number, permIds: number[]): Promise<IApiResponse<null>> {
  return post<null>(`/api/roles/${roleId}/permissions`, { permIds })
}

export function getRolePermissions(roleId: number): Promise<IApiResponse<number[]>> {
  return get<number[]>(`/api/roles/${roleId}/permissions`)
}
