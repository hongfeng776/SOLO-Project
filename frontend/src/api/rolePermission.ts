import request from '@/utils/request'
import type {
  PageResult, PageParams,
  RoleItem, RoleDetail, PermissionMenu, ValidateConfigResult,
  TraceRoleResult, RolePermissionLog, BatchCopyResult, BatchModifyResult
} from '@/types'

interface RoleListParams extends PageParams {
  keyword?: string
  type?: string
  status?: string
}

export const getRoleList = (params: RoleListParams) => {
  return request.get<PageResult<RoleItem>>('/role-permissions/roles', params)
}

export const getRoleDetail = (id: number) => {
  return request.get<RoleDetail>(`/role-permissions/roles/${id}`)
}

export const createRole = (data: {
  name: string
  code: string
  description?: string
  type?: string
  level?: number
  sort?: number
  permissionIds?: number[]
}) => {
  return request.post<RoleDetail>('/role-permissions/roles', data)
}

export const updateRolePermissions = (id: number, data: {
  name?: string
  description?: string
  level?: number
  permissionIds: number[]
  reason?: string
}) => {
  return request.put<RoleDetail>(`/role-permissions/roles/${id}`, data)
}

export const deleteRole = (id: number) => {
  return request.delete(`/role-permissions/roles/${id}`)
}

export const getPermissionMenuTree = (params?: { module?: string; level?: string }) => {
  return request.get<PermissionMenu[]>('/role-permissions/menus/tree', params)
}

export const getPermissionModules = () => {
  return request.get<PermissionMenu[]>('/role-permissions/menus/modules')
}

export const validateRoleName = (name: string, excludeId?: number) => {
  return request.get<{ valid: boolean; reason?: string }>('/role-permissions/validate/name', { name, excludeId })
}

export const validateRoleCode = (code: string, excludeId?: number) => {
  return request.get<{ valid: boolean; reason?: string }>('/role-permissions/validate/code', { code, excludeId })
}

export const validatePermissionConfig = (roleId: number, permissionIds: number[]) => {
  return request.post<ValidateConfigResult>(`/role-permissions/validate/config/${roleId}`, { permissionIds })
}

export const batchCopyTemplate = (sourceRoleId: number, targetRoleIds: number[]) => {
  return request.post<BatchCopyResult>('/role-permissions/batch/copy', { sourceRoleId, targetRoleIds })
}

export const batchModifyPermissions = (roleIds: number[], permissionIds: number[]) => {
  return request.post<BatchModifyResult>('/role-permissions/batch/modify', { roleIds, permissionIds })
}

export const traceRole = (id: number) => {
  return request.get<TraceRoleResult>(`/role-permissions/trace/${id}`)
}

export const getPermissionLogs = (params?: PageParams & {
  roleId?: number
  changeType?: string
  operatorId?: number
  startTime?: string
  endTime?: string
}) => {
  return request.get<PageResult<RolePermissionLog>>('/role-permissions/logs', params)
}

export const initDefaultData = () => {
  return request.post('/role-permissions/init')
}
