import request from '@/utils/request'
import type {
  PageResult, PageParams,
  UserPermRow, UserPermDetail, MatchCheckResult, UniqueCheckResult,
  AssignResult, RemoveResult, BatchAssignResult,
  UserPermTraceResult, UserPermLog, CleanResult,
  RoleItem, UserSelectOption, StatusCheck
} from '@/types'

interface UserPermListParams extends PageParams {
  keyword?: string
  status?: string
  role?: string
}

export const getUserPermissionList = (params: UserPermListParams) => {
  return request.get<PageResult<UserPermRow>>('/user-permissions/users', params)
}

export const getUserPermissionDetail = (userId: number) => {
  return request.get<UserPermDetail>(`/user-permissions/users/${userId}`)
}

export const assignRoleToUser = (data: {
  userId: number
  roleId: number
  reason?: string
}) => {
  return request.post<UserPermDetail>('/user-permissions/assign-role', data)
}

export const addDirectPermissions = (data: {
  userId: number
  permissionIds: number[]
  expiresAt?: string
  reason?: string
}) => {
  return request.post<AssignResult>('/user-permissions/add-permissions', data)
}

export const removeDirectPermissions = (data: {
  userId: number
  permissionIds: number[]
  reason?: string
  forceRemove?: boolean
}) => {
  return request.post<RemoveResult>('/user-permissions/remove-permissions', data)
}

export const batchAssignPermissions = (data: {
  userIds: number[]
  roleId?: number
  permissionIds?: number[]
  reason?: string
}) => {
  return request.post<BatchAssignResult>('/user-permissions/batch-assign', data)
}

export const traceUserPermissions = (userId: number) => {
  return request.get<UserPermTraceResult>(`/user-permissions/trace/${userId}`)
}

export const getUserPermissionLogs = (params?: PageParams & {
  userId?: number
  changeType?: string
  operatorId?: number
  startTime?: string
  endTime?: string
}) => {
  return request.get<PageResult<UserPermLog>>('/user-permissions/logs', params)
}

export const cleanRedundantPermissions = (userId: number) => {
  return request.post<CleanResult>(`/user-permissions/clean/${userId}`)
}

export const getAllRoles = () => {
  return request.get<RoleItem[]>('/user-permissions/roles')
}

export const getUsersForSelect = (params?: {
  keyword?: string
  role?: string
}) => {
  return request.get<UserSelectOption[]>('/user-permissions/users/select', params)
}

export const validateUserStatus = (userId: number) => {
  return request.get<StatusCheck>(`/user-permissions/validate/status/${userId}`)
}

export const validateRolePermissionMatch = (data: {
  userId: number
  roleId: number
  additionalPermIds?: number[]
}) => {
  return request.post<MatchCheckResult>('/user-permissions/validate/match', data)
}

export const validatePermissionUniqueness = (data: {
  userId: number
  permissionIds: number[]
  source?: string
}) => {
  return request.post<UniqueCheckResult>('/user-permissions/validate/unique', data)
}
