import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/api'
import type {
  SystemPermission,
  PermissionValidateResult,
  UserPermissionInfo,
  PermissionGrantResult,
  PermissionRevokeResult,
  PermissionResetResult,
  StatusChangeResult,
  PermissionTraceInfo,
  PermissionChangeLog,
  PermissionComplianceResult,
  PermissionBatchResult
} from '@/types/business'

export type { SystemPermission, UserPermissionInfo, PermissionValidateResult, StatusChangeResult }

export function getSystemPermissions(permissionGroup?: string, status?: number): Promise<ApiResponse<SystemPermission[]>> {
  const params: any = {}
  if (permissionGroup) params.permission_group = permissionGroup
  if (status !== undefined) params.status = status
  return request.get<SystemPermission[]>('/userPermission/system-permissions', { params })
}

export function getFilteredPermissions(
  userLevel: number,
  userStatus: number,
  riskLevel: number,
  permissionGroup?: string
): Promise<ApiResponse<SystemPermission[]>> {
  const params: any = {
    user_level: userLevel,
    user_status: userStatus,
    risk_level: riskLevel
  }
  if (permissionGroup) params.permission_group = permissionGroup
  return request.get<SystemPermission[]>('/userPermission/filtered-permissions', { params })
}

export function validatePermissionGrant(
  userId: number,
  permissionCodes: string[]
): Promise<ApiResponse<PermissionValidateResult>> {
  return request.post<PermissionValidateResult>(`/userPermission/validate/${userId}`, { permissionCodes })
}

export function getUserPermissions(userId: number): Promise<ApiResponse<UserPermissionInfo>> {
  return request.get<UserPermissionInfo>(`/userPermission/${userId}/permissions`)
}

export function grantPermissions(
  userId: number,
  permissionCodes: string[],
  grantType = 2,
  expireTime?: string
): Promise<ApiResponse<PermissionGrantResult>> {
  return request.post<PermissionGrantResult>(`/userPermission/${userId}/grant`, {
    permissionCodes,
    grantType,
    expireTime
  })
}

export function revokePermissions(
  userId: number,
  permissionCodes: string[],
  reason: string
): Promise<ApiResponse<PermissionRevokeResult>> {
  return request.post<PermissionRevokeResult>(`/userPermission/${userId}/revoke`, {
    permissionCodes,
    reason
  })
}

export function resetPermissions(userId: number, reason?: string): Promise<ApiResponse<PermissionResetResult>> {
  return request.post<PermissionResetResult>(`/userPermission/${userId}/reset`, { reason })
}

export function changeUserStatus(
  userId: number,
  status: number,
  freezeType?: number,
  cancelType?: number,
  reason?: string
): Promise<ApiResponse<StatusChangeResult>> {
  return request.put<StatusChangeResult>(`/userPermission/${userId}/status`, {
    status,
    freezeType,
    cancelType,
    reason
  })
}

export function batchGrantPermissions(
  ids: number[],
  permissionCodes: string[],
  scope = 'partial'
): Promise<ApiResponse<PermissionBatchResult>> {
  return request.post<PermissionBatchResult>('/userPermission/batch-grant', {
    ids,
    permissionCodes,
    scope
  })
}

export function batchRevokePermissions(
  ids: number[],
  permissionCodes: string[],
  reason: string,
  scope = 'partial'
): Promise<ApiResponse<PermissionBatchResult>> {
  return request.post<PermissionBatchResult>('/userPermission/batch-revoke', {
    ids,
    permissionCodes,
    reason,
    scope
  })
}

export function batchResetPermissions(
  ids: number[],
  scope = 'partial'
): Promise<ApiResponse<PermissionBatchResult>> {
  return request.post<PermissionBatchResult>('/userPermission/batch-reset', {
    ids,
    scope
  })
}

export function getPermissionTrace(userId: number): Promise<ApiResponse<PermissionTraceInfo>> {
  return request.get<PermissionTraceInfo>(`/userPermission/${userId}/trace`)
}

export function getPermissionLogs(
  userId: number,
  page = 1,
  pageSize = 20
): Promise<ApiResponse<PageResult<PermissionChangeLog>>> {
  return request.get<PageResult<PermissionChangeLog>>(`/userPermission/${userId}/logs`, {
    params: { page, pageSize }
  })
}

export function checkPermissionCompliance(userId: number): Promise<ApiResponse<PermissionComplianceResult>> {
  return request.get<PermissionComplianceResult>(`/userPermission/${userId}/compliance`)
}
