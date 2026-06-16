import { get, post, put, del } from '@/utils/axios'
import type { PageParams, PageResult, Status, BaseEntity, TreeNode } from '@/types'

export type PermissionType = 'menu' | 'button' | 'api'

export interface PermissionItem extends BaseEntity, TreeNode {
  type: PermissionType
  code: string
  path?: string
  icon?: string
  component?: string
  apiUrl?: string
  apiMethod?: 'get' | 'post' | 'put' | 'delete' | 'patch'
  sort: number
  status: Status
}

export interface RoleItem extends BaseEntity {
  name: string
  code: string
  description?: string
  status: Status
  sort: number
  permissionIds?: (string | number)[]
  userCount?: number
}

export interface RoleQueryParams extends PageParams {
  name?: string
  code?: string
  status?: Status
  keyword?: string
}

export type RoleCreateParams = Omit<RoleItem, 'id' | 'createdAt' | 'updatedAt' | 'permissionIds' | 'userCount'>
export type RoleUpdateParams = Partial<RoleCreateParams>

export function getRoleList(params: RoleQueryParams): Promise<PageResult<RoleItem>> {
  return get<PageResult<RoleItem>>('/roles', params)
}

export function createRole(data: RoleCreateParams): Promise<RoleItem> {
  return post<RoleItem>('/roles', data)
}

export function updateRole(id: string | number, data: RoleUpdateParams): Promise<RoleItem> {
  return put<RoleItem>(`/roles/${id}`, data)
}

export function deleteRole(id: string | number): Promise<null> {
  return del<null>(`/roles/${id}`)
}

export function getPermissionList(): Promise<PermissionItem[]> {
  return get<PermissionItem[]>('/permissions')
}

export function getRolePermissions(roleId: string | number): Promise<(string | number)[]> {
  return get<(string | number)[]>(`/roles/${roleId}/permissions`)
}

export function assignRolePermissions(
  roleId: string | number,
  permissionIds: (string | number)[]
): Promise<null> {
  return post<null>(`/roles/${roleId}/permissions`, { permissionIds })
}
