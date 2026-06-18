import request from '@/utils/request'
import type {
  PageResult, PageParams,
  AccountPermissionItem, AccountPermissionDetail, AccountPermConflict,
  AccountRoleMatchResult, AccountTraceResult, AccountPermLog, BatchAssignResult
} from '@/types'

interface AccountListParams extends PageParams {
  keyword?: string
  status?: string
  role?: string
}

export const getAccountList = (params: AccountListParams) => {
  return request.get<PageResult<AccountPermissionItem>>('/account-permissions/accounts', params)
}

export const getAccountDetail = (id: number) => {
  return request.get<AccountPermissionDetail>(`/account-permissions/accounts/${id}`)
}

export const assignRole = (userId: number, roleId: number) => {
  return request.post<AccountPermissionDetail>('/account-permissions/assign-role', { userId, roleId })
}

export const revokeRole = (userId: number, roleId: number, reason?: string) => {
  return request.post<AccountPermissionDetail>('/account-permissions/revoke-role', { userId, roleId, reason })
}

export const addPermissions = (userId: number, permissionIds: number[]) => {
  return request.post<AccountPermissionDetail>('/account-permissions/add-permissions', { userId, permissionIds })
}

export const removePermissions = (userId: number, permissionIds: number[], reason?: string) => {
  return request.post<AccountPermissionDetail>('/account-permissions/remove-permissions', { userId, permissionIds, reason })
}

export const adjustPermissions = (id: number, data: {
  roleId?: number | null
  addPermissionIds?: number[]
  removePermissionIds?: number[]
  reason?: string
}) => {
  return request.put<AccountPermissionDetail>(`/account-permissions/adjust/${id}`, data)
}

export const batchAssignRole = (userIds: number[], roleId: number) => {
  return request.post<BatchAssignResult>('/account-permissions/batch/assign-role', { userIds, roleId })
}

export const batchAddPermissions = (userIds: number[], permissionIds: number[]) => {
  return request.post<BatchAssignResult>('/account-permissions/batch/add-permissions', { userIds, permissionIds })
}

export const validateAccountStatus = (id: number) => {
  return request.get<{ valid: boolean; reason?: string }>(`/account-permissions/validate/status/${id}`)
}

export const checkConflict = (userId: number, permissionIds: number[]) => {
  return request.post<{ hasConflict: boolean; conflicts: AccountPermConflict[] }>('/account-permissions/validate/conflict', { userId, permissionIds })
}

export const checkRoleMatch = (userId: number, roleId: number) => {
  return request.get<AccountRoleMatchResult>('/account-permissions/validate/role-match', { userId, roleId })
}

export const traceAccount = (id: number) => {
  return request.get<AccountTraceResult>(`/account-permissions/trace/${id}`)
}

export const cleanupRedundant = (id: number) => {
  return request.post<{ removedCount: number; remainingPerms: number }>(`/account-permissions/cleanup/${id}`)
}

export const getAccountLogs = (params?: PageParams & {
  userId?: number
  changeType?: string
  operatorId?: number
  startTime?: string
  endTime?: string
  batchId?: string
}) => {
  return request.get<PageResult<AccountPermLog>>('/account-permissions/logs', params)
}
