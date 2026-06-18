import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'
import type {
  UserEditPermission,
  RegisterChannel,
  UserProfileLog,
  UserStatistic,
  UserTraceInfo,
  UserLoginTrace,
  UserConsumptionLedger,
  UserRegisterLog,
  ComplianceCheckResult,
  ValidateError
} from '@/types/business'

export interface User {
  id: number
  username: string
  nickname?: string
  realName?: string
  idCard?: string
  gender?: number
  birthday?: string
  phone: string
  email?: string
  avatar?: string
  status: number
  level: number
  levelName?: string
  tags?: string
  totalAmount: number
  totalOrders: number
  registerChannel?: string
  registerChannelName?: string
  registerIp?: string
  lastLoginTime?: string
  lastLoginIp?: string
  remark?: string
  frozenReason?: string
  frozenTime?: string
  cancelTime?: string
  riskWarning?: number
  riskLevel?: number
  complianceScore?: number
  createdAt: string
  updatedAt: string
}

export interface UserQueryParams {
  page?: number
  pageSize?: number
  username?: string
  phone?: string
  status?: number
  level?: number
  registerChannel?: string
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  riskWarning?: number
  tags?: string
}

export interface UserCreateData {
  username: string
  nickname?: string
  realName?: string
  idCard?: string
  gender?: number
  birthday?: string
  phone: string
  email?: string
  avatar?: string
  status?: number
  level?: number
  tags?: string
  registerChannel?: string
  remark?: string
}

export interface UserUpdateData {
  username?: string
  nickname?: string
  realName?: string
  idCard?: string
  gender?: number
  birthday?: string
  phone?: string
  email?: string
  avatar?: string
  status?: number
  level?: number
  tags?: string
  remark?: string
  frozenReason?: string
}

export interface FieldValidateResult {
  valid: boolean
  error?: ValidateError
  patterns: Record<string, RegExp>
}

export function getUserList(params: UserQueryParams): Promise<ApiResponse<PageResult<User>>> {
  return request.get<PageResult<User>>('/user/list', { params })
}

export function getUserDetail(id: number): Promise<ApiResponse<User>> {
  return request.get<User>(`/user/detail/${id}`)
}

export function getUserFullInfo(id: number): Promise<ApiResponse<User>> {
  return request.get<User>(`/user/full-info/${id}`)
}

export function createUser(data: UserCreateData): Promise<ApiResponse<User>> {
  return request.post<User>('/user/create', data)
}

export function updateUser(id: number, data: UserUpdateData): Promise<ApiResponse<User>> {
  return request.put<User>(`/user/update/${id}`, data)
}

export function deleteUser(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`/user/delete/${id}`)
}

export function batchDeleteUsers(ids: number[]): Promise<ApiResponse<{ count: number }>> {
  return request.post<{ count: number }>('/user/batch-delete', { ids })
}

export function updateUserStatus(id: number, status: number, reason?: string): Promise<ApiResponse<User>> {
  return request.put<User>(`/user/status/${id}`, { status, reason })
}

export function getUserEditPermission(status: number): Promise<ApiResponse<UserEditPermission>> {
  return request.get<UserEditPermission>('/user/edit-permission', { params: { status } })
}

export function getRegisterChannels(): Promise<ApiResponse<RegisterChannel[]>> {
  return request.get<RegisterChannel[]>('/user/register-channels')
}

export function validateUserField(field: string, value: any, userId?: number): Promise<ApiResponse<FieldValidateResult>> {
  return request.post<FieldValidateResult>('/user/validate', { field, value, userId })
}

export function getUserStatistics(startDate?: string, endDate?: string): Promise<ApiResponse<UserStatistic>> {
  const params = startDate && endDate ? { startDate, endDate } : {}
  return request.get<UserStatistic>('/user/statistics', { params })
}

export function updateUserStatistics(): Promise<ApiResponse<UserStatistic>> {
  return request.post<UserStatistic>('/user/statistics/update')
}

export function getUserProfileLogs(id: number): Promise<ApiResponse<UserProfileLog[]>> {
  return request.get<UserProfileLog[]>(`/user/profile-logs/${id}`)
}
