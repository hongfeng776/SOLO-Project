import { get, post, put, del } from '@/utils/axios'
import type { PageParams, PageResult, BaseEntity, TreeNode } from '@/types'

export type PermissionType = 'menu' | 'button' | 'api' | 'directory'

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
  module?: string
  level?: number
  createdBy?: string
  createdByName?: string
  isSystem?: boolean
  visibleRange?: string[]
  parentId?: string
  remark?: string
}

export interface PermissionDependencies {
  hasDependencies: boolean
  canDelete: boolean
  dependencies: Array<{ type: string; count: number; description: string }>
}

export interface BatchSortItem {
  id: string | number
  sort: number
  parentId?: string | number
  level?: number
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

export function createPermission(data: Partial<PermissionItem>): Promise<PermissionItem> {
  return post<PermissionItem>('/permissions', data)
}
export function updatePermission(id: string | number, data: Partial<PermissionItem>): Promise<PermissionItem> {
  return put<PermissionItem>(`/permissions/${id}`, data)
}
export function deletePermission(id: string | number): Promise<null> {
  return del<null>(`/permissions/${id}`)
}
export function checkPermissionDependencies(id: string | number): Promise<PermissionDependencies> {
  return get<PermissionDependencies>(`/permissions/${id}/dependencies`)
}
export function batchUpdatePermissionStatus(ids: (string | number)[], status: number): Promise<BatchOperateResult> {
  return post<BatchOperateResult>('/permissions/batch-status', { ids, status })
}
export function batchSortPermissions(items: BatchSortItem[]): Promise<BatchOperateResult> {
  return post<BatchOperateResult>('/permissions/batch-sort', { items })
}
export function getPermissionsByModule(module: string): Promise<PermissionItem[]> {
  return get<PermissionItem[]>(`/permissions/module/${module}`)
}
export function getIdlePermissions(params: any): Promise<PermissionItem[]> {
  return get<PermissionItem[]>('/permissions/idle', params)
}

export type ChangeTargetType = 'role' | 'permission' | 'user'
export type ChangeAction = 'create' | 'update' | 'delete' | 'batch_assign' | 'batch_revoke' | 'batch_copy'

export interface PermissionChangeLogItem {
  id: string
  operatorId: string
  operatorName: string
  targetId: string
  targetType: ChangeTargetType
  targetName?: string
  action: ChangeAction
  module?: string
  beforeData?: any
  afterData?: any
  changedFields?: Record<string, { before: any; after: any }>
  affectedUserIds?: string[]
  affectedUserCount?: number
  reason?: string
  ip: string
  userAgent?: string
  createdAt: string
}

export interface PermissionChangeLogQueryParams extends PageParams {
  operatorId?: string
  operatorName?: string
  targetType?: ChangeTargetType
  targetId?: string
  action?: ChangeAction
  module?: string
  startTime?: string
  endTime?: string
  keyword?: string
}

export interface AnomalyDetectionResult {
  highFrequencyOperations: Array<{
    startTime: string
    endTime: string
    count: number
    operatorId: string
    operatorName: string
    actions: string[]
    ips: string[]
    sampleLogs: PermissionChangeLogItem[]
  }>
  suspiciousAccounts: Array<{
    operatorId: string
    operatorName: string
    ip: string
    userAgent?: string
    operationCount: number
    latestOperationTime: string
    highRiskActions: string[]
  }>
  anomalyCount: number
  highFrequencyCount: number
}

export function getPermissionChangeLogList(params: PermissionChangeLogQueryParams): Promise<PageResult<PermissionChangeLogItem>> {
  return get<PageResult<PermissionChangeLogItem>>('/permission-change-logs', params)
}

export function getPermissionChangeLogDetail(id: string): Promise<PermissionChangeLogItem> {
  return get<PermissionChangeLogItem>(`/permission-change-logs/${id}`)
}

export function exportPermissionChangeLogs(params: any): Promise<void> {
  return import('@/utils/axios').then(mod => mod.download('/permission-change-logs/export', params))
}

export function detectPermissionAnomalies(params: {
  userId?: string
  timeWindowMinutes?: number
  frequencyThreshold?: number
  startTime?: string
  endTime?: string
}): Promise<AnomalyDetectionResult> {
  return get<AnomalyDetectionResult>('/permission-change-logs/anomalies', params)
}
