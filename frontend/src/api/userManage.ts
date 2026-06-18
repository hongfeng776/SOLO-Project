import request from '@/utils/request'
import type { PageResult, UserInfo, PageParams, Member, AccountValidationResult, UserEditLog, TraceResultItem, AccountComplianceLog, BatchUpdateResult, UserStatusLog, RiskPreview, ChangeStatusResult, BatchChangeStatusResult, ChangeStats } from '@/types'

interface UserListParams extends PageParams {
  keyword?: string
  role?: string
  status?: string
  tag?: string
  permissionGroup?: string
}

export const getUserList = (params: UserListParams) => {
  return request.get<PageResult<UserInfo>>('/users', params)
}

export const getUserDetail = (id: number) => {
  return request.get<UserInfo>(`/users/${id}`)
}

export const createUser = (data: Partial<UserInfo> & { password: string }) => {
  return request.post<UserInfo>('/users', data)
}

export const updateUser = (id: number, data: Partial<UserInfo> & { verifyPassword?: string; editStep?: number }) => {
  return request.put<{ user: UserInfo; editLogs: UserEditLog[] }>(`/users/${id}`, data)
}

export const deleteUser = (id: number) => {
  return request.delete(`/users/${id}`)
}

export const batchDeleteUser = (ids: number[]) => {
  return request.post('/users/batch-delete', { ids })
}

export const updateUserStatus = (id: number, data: {
  status: string
  reason?: string
  statusExpireAt?: string
  linkedViolationId?: number
  linkedAppealId?: number
  force?: boolean
}) => {
  return request.put<ChangeStatusResult>(`/users/${id}/status`, data)
}

export const batchChangeUserStatus = (data: {
  ids: number[]
  status: string
  reason?: string
  statusExpireAt?: string
  force?: boolean
}) => {
  return request.post<BatchChangeStatusResult>('/users/batch-change-status', data)
}

export const getRiskPreview = (id: number, newStatus: string) => {
  return request.get<RiskPreview>(`/users/${id}/risk-preview`, { newStatus })
}

export const getStatusLogs = (userId: number, params?: PageParams & { newStatus?: string; changeType?: string }) => {
  return request.get<PageResult<UserStatusLog>>(`/users/${userId}/status-logs`, params)
}

export const getChangeStats = (userId: number) => {
  return request.get<ChangeStats>(`/users/${userId}/change-stats`)
}

export const validateAccount = (params: { phone?: string; nickname?: string; uid?: string; excludeUserId?: number }) => {
  return request.get<AccountValidationResult>('/users/validate', params)
}

export const getEditLogs = (userId: number, params?: PageParams) => {
  return request.get<PageResult<UserEditLog>>(`/users/${userId}/edit-logs`, params)
}

export const batchUpdateUsers = (data: {
  ids: number[]
  nicknameSuffix?: string
  tags?: string[]
  permissionGroup?: string
}) => {
  return request.post<BatchUpdateResult>('/users/batch-update', data)
}

export const traceAccount = (params: {
  uid?: string
  phone?: string
  username?: string
  registerTimeStart?: string
  registerTimeEnd?: string
  page?: number
  pageSize?: number
}) => {
  return request.get<PageResult<TraceResultItem>>('/users/trace', params)
}

export const getComplianceLogs = (params?: PageParams & {
  userId?: number
  uid?: string
  checkType?: string
  checkResult?: string
}) => {
  return request.get<PageResult<AccountComplianceLog>>('/users/compliance-logs', params)
}

export const partialRefreshUsers = (ids: number[]) => {
  return getUserList({ page: 1, pageSize: 100 })
}

interface MemberListParams extends PageParams {
  keyword?: string
  level?: string
}

export const getMemberList = (params: MemberListParams) => {
  return request.get<PageResult<Member>>('/members', params)
}

export const getMemberDetail = (id: number) => {
  return request.get<Member>(`/members/${id}`)
}

export const updateMemberLevel = (id: number, level: string) => {
  return request.put(`/members/${id}/level`, { level })
}
