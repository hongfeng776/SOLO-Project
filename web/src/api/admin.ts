import { get, post, put, del } from '@/utils/axios'
import type { PageParams, PageResult, BaseEntity } from '@/types'

export interface AdminItem extends BaseEntity {
  username: string
  nickname: string
  email: string
  phone: string
  role: 'admin' | 'user' | 'guest'
  roleId?: string
  status: number
  position?: string
  positionLevel?: number
  createdBy?: string
  createdByName?: string
  activatedAt?: string
  lastLoginAt?: string
  lastActiveAt?: string
  permissionIds?: (string | number)[]
}

export interface AdminQueryParams extends PageParams {
  role?: string
  status?: number
  positionLevel?: number
  permissionId?: string
  keyword?: string
  startTime?: string
  endTime?: string
}

export interface CreateAdminParams {
  username: string
  password: string
  nickname: string
  email: string
  phone: string
  role: 'admin' | 'user' | 'guest'
  roleId: string
  permissionIds?: (string | number)[]
  position?: string
  positionLevel?: number
}

export interface UpdateAdminParams {
  nickname?: string
  email?: string
  phone?: string
  role?: 'admin' | 'user' | 'guest'
  roleId?: string
  permissionIds?: (string | number)[]
  status?: number
  position?: string
  positionLevel?: number
}

export interface BatchOperateResult {
  success: string[]
  failed: Array<{ id: string; reason: string }>
}

export interface PermissionConflict {
  code: string
  conflictCode: string
  reason: string
}

export interface DeleteDependency {
  type: string
  count: number
  description: string
}

export interface TraceInfo {
  id: string
  username: string
  createdBy?: string
  createdByName?: string
  createdAt: string
  activatedAt?: string
  lastLoginAt?: string
  lastActiveAt?: string
}

export function getAdminList(params: AdminQueryParams): Promise<PageResult<AdminItem>> {
  return get<PageResult<AdminItem>>('/users/admins', params)
}

export function createAdmin(data: CreateAdminParams): Promise<AdminItem> {
  return post<AdminItem>('/users/admins', data)
}

export function updateAdmin(id: string, data: UpdateAdminParams): Promise<AdminItem> {
  return put<AdminItem>(`/users/admins/${id}`, data)
}

export function deleteAdmin(id: string): Promise<null> {
  return del<null>(`/users/admins/${id}`)
}

export function batchUpdateAdminStatus(ids: string[], status: number): Promise<BatchOperateResult> {
  return post<BatchOperateResult>('/users/admins/batch-status', { ids, status })
}

export function batchResetAdminPermissions(ids: string[]): Promise<BatchOperateResult> {
  return post<BatchOperateResult>('/users/admins/batch-reset', { ids })
}

export function checkAdminDeleteDependencies(id: string): Promise<{ hasDependencies: boolean; dependencies: DeleteDependency[]; canDelete: boolean }> {
  return get<{ hasDependencies: boolean; dependencies: DeleteDependency[]; canDelete: boolean }>(`/users/admins/${id}/dependencies`)
}

export function getAdminTraceInfo(id: string): Promise<TraceInfo> {
  return get<TraceInfo>(`/users/admins/${id}/trace`)
}

export function getPermissionExclusionRules(): Promise<Array<{ codes: [string, string]; reason: string }>> {
  return get<Array<{ codes: [string, string]; reason: string }>>('/users/admins/permission-exclusions')
}
