import { get, post, put, del } from '@/utils/axios'
import type { PageParams, PageResult, BaseEntity, TreeNode } from '@/types'

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
  status: number
}

export interface RoleItem extends BaseEntity {
  name: string
  code: string
  description?: string
  status: number
  sort: number
  level?: number
  scenario?: string
  isSystem?: boolean
  createdBy?: string
  createdByName?: string
  userCount?: number
  permissionIds?: (string | number)[]
  boundPermissionIds?: (string | number)[]
}

export interface RoleQueryParams extends PageParams {
  name?: string
  code?: string
  status?: number
  keyword?: string
  startTime?: string
  endTime?: string
}

export interface CreateRoleParams {
  name: string
  code?: string
  description?: string
  sort: number
  level?: number
  scenario?: string
  permissionIds?: (string | number)[]
}

export interface UpdateRoleParams extends Partial<CreateRoleParams> {
  status?: number
}

export interface RoleDeletionLog {
  id: string
  roleId: string
  roleName: string
  roleCode: string
  deletedBy: string
  deletedByName: string
  reason?: string
  permissionSnapshot?: any
  boundUsers?: number
  deletedAt: string
  createdAt: string
}

export interface BatchCopyParams {
  sourceRoleIds: (string | number)[]
  newNamePrefix: string
  scenario?: string
  permissionDelta?: { add?: (string | number)[]; remove?: (string | number)[] }
}

export interface BatchOperateResult {
  success: (string | number)[]
  failed: Array<{ id: string | number; reason: string }>
}

export interface RoleDependencies {
  hasDependencies: boolean
  canDelete: boolean
  dependencies: Array<{ type: string; count: number; description: string }>
}

export interface PermissionConflict {
  code: string
  conflictCode: string
  reason: string
}

export function getRoleList(params: RoleQueryParams): Promise<PageResult<RoleItem>> {
  return get<PageResult<RoleItem>>('/roles', params)
}

export function createRole(data: CreateRoleParams): Promise<RoleItem> {
  return post<RoleItem>('/roles', data)
}

export function updateRole(id: string | number, data: UpdateRoleParams): Promise<RoleItem> {
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

export function updateRoleWithPermissions(
  id: string | number,
  data: UpdateRoleParams & { permissionIds?: (string | number)[] }
): Promise<RoleItem> {
  return put<RoleItem>(`/roles/${id}/with-permissions`, data)
}

export function batchCopyRoles(params: BatchCopyParams): Promise<BatchOperateResult> {
  return post<BatchOperateResult>('/roles/batch-copy', params)
}

export function batchUpdateRoleStatus(ids: (string | number)[], status: number): Promise<BatchOperateResult> {
  return post<BatchOperateResult>('/roles/batch-status', { ids, status })
}

export function checkRoleDependencies(id: string | number): Promise<RoleDependencies> {
  return get<RoleDependencies>(`/roles/${id}/dependencies`)
}

export function getRoleDeletionLogs(params: { keyword?: string; startTime?: string; endTime?: string }): Promise<RoleDeletionLog[]> {
  return get<RoleDeletionLog[]>('/roles/deletion-logs', params)
}

export function getPermissionExclusions(): Promise<Array<{ codes: [string, string]; reason: string }>> {
  return get<Array<{ codes: [string, string]; reason: string }>>('/roles/permission-exclusions')
}

export function checkRoleNameExists(name: string, excludeId?: string | number): Promise<boolean> {
  return get<boolean>('/roles/check-name', { name, excludeId })
}
