import { get, post, put, del } from '@utils/request'
import type { PageParams, PageResult, ListResult, SelectOption } from '@types'
import type { Role, RoleForm } from '@types/business'

export interface RoleQueryParams extends PageParams {
  name?: string
  code?: string
  status?: number
}

export function getRoleListApi(params: RoleQueryParams) {
  return get<PageResult<Role>>('/system/role/list', params)
}

export function getRoleAllApi() {
  return get<ListResult<Role>>('/system/role/all')
}

export function getRoleOptionsApi() {
  return get<SelectOption[]>('/system/role/options')
}

export function getRoleDetailApi(id: number) {
  return get<Role>(`/system/role/${id}`)
}

export function createRoleApi(data: RoleForm) {
  return post<Role>('/system/role', data)
}

export function updateRoleApi(data: RoleForm) {
  return put<Role>(`/system/role/${data.id}`, data)
}

export function deleteRoleApi(id: number) {
  return del<void>(`/system/role/${id}`)
}

export function batchDeleteRoleApi(ids: number[]) {
  return post<void>('/system/role/batchDelete', { ids })
}
