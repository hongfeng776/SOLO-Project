import { get, post, put } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  UserAccount,
  UserAccountDetail,
  UserPreCheckResult,
  ValidateResult,
  UserUpdateResult,
  BatchOperationParams,
  BatchOperationResult,
  UserTraceResult,
  UserIntegrityResult,
  UserAbnormalLog,
  UserAccountLog,
  UserAccountPermission
} from '@/types/business'

export const queryUsers = (params: Record<string, unknown>): Promise<PageResult<UserAccount> & { permission: UserAccountPermission }> => {
  return get<PageResult<UserAccount> & { permission: UserAccountPermission }>('/user-account/query', params)
}

export const getUserDetail = (id: number): Promise<UserAccountDetail> => {
  return get<UserAccountDetail>(`/user-account/${id}/detail`)
}

export const preCheckUser = (id: number): Promise<UserPreCheckResult> => {
  return get<UserPreCheckResult>(`/user-account/${id}/precheck`)
}

export const traceUserAccount = (id: number): Promise<UserTraceResult> => {
  return get<UserTraceResult>(`/user-account/${id}/trace`)
}

export const checkUserIntegrity = (id: number): Promise<UserIntegrityResult> => {
  return get<UserIntegrityResult>(`/user-account/${id}/integrity`)
}

export const validatePhone = (data: { phone: string }): Promise<ValidateResult> => {
  return post<ValidateResult>('/user-account/validate/phone', data)
}

export const validateNickname = (data: { nickname: string; excludeUserId?: number }): Promise<ValidateResult & { suggestions?: string[] }> => {
  return post<ValidateResult & { suggestions?: string[] }>('/user-account/validate/nickname', data)
}

export const validateAvatar = (data: { avatar: string }): Promise<ValidateResult> => {
  return post<ValidateResult>('/user-account/validate/avatar', data)
}

export const updateUserInfo = (
  id: number,
  data: { nickname?: string; avatar?: string; phone?: string; email?: string; reason?: string }
): Promise<UserUpdateResult> => {
  return put<UserUpdateResult>(`/user-account/${id}/info`, data)
}

export const batchUpdateUsers = (data: BatchOperationParams): Promise<BatchOperationResult> => {
  return post<BatchOperationResult>('/user-account/batch/update', data)
}

export const batchResetConfig = (data: {
  userIds?: number[]
  filterType?: string
  scope: string
  resetItems: string[]
  reason?: string
}): Promise<BatchOperationResult> => {
  return post<BatchOperationResult>('/user-account/batch/reset', data)
}

export const getAbnormalUsers = (params: Record<string, unknown>): Promise<PageResult<UserAbnormalLog> & { stats: Array<{ abnormalType: string; count: number }>; permission: UserAccountPermission }> => {
  return get<PageResult<UserAbnormalLog> & { stats: Array<{ abnormalType: string; count: number }>; permission: UserAccountPermission }>('/user-account/abnormal/list', params)
}

export const handleAbnormalLog = (id: number, data: { handleResult: string; handled?: number }): Promise<{ success: boolean; message: string }> => {
  return put<{ success: boolean; message: string }>(`/user-account/abnormal/${id}/handle`, data)
}

export const getAccountLogs = (params: Record<string, unknown>): Promise<PageResult<UserAccountLog>> => {
  return get<PageResult<UserAccountLog>>('/user-account/logs/list', params)
}
