import request from '@/utils/request'
import type {
  PageResult, UserInfo, PageParams, Member, AccountValidationResult, UserEditLog,
  TraceResultItem, AccountComplianceLog, BatchUpdateResult, UserStatusLog, RiskPreview,
  ChangeStatusResult, BatchChangeStatusResult, ChangeStats,
  TagDefinition, MemberLevelLog, MemberTagLog, BenefitItem,
  LevelPreviewResult, ChangeLevelResult, AddTagsResult,
  BatchApplyTagsResult, TagTraceResult, CleanTagsResult,
  LevelCriteriaMeta, TagMeta, TagMatchResult
} from '@/types'

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

// ================ 用户层级管理 ================

export const getLevelCriteriaMeta = () => {
  return request.get<LevelCriteriaMeta>('/users/level/criteria-meta')
}

export const getLevelPreview = (userId: number, targetLevel: string, force = false) => {
  return request.get<LevelPreviewResult>(`/users/${userId}/level-preview`, { targetLevel, force })
}

export const changeMemberLevel = (userId: number, data: { targetLevel: string; force?: boolean; reason?: string }) => {
  return request.put<ChangeLevelResult>(`/users/${userId}/level`, data)
}

export const getMemberLevelLogs = (userId: number, params?: PageParams & { changeType?: string }) => {
  return request.get<PageResult<MemberLevelLog>>(`/users/${userId}/level-logs`, params)
}

// ================ 用户标签管理 ================

export const getTagMeta = () => {
  return request.get<TagMeta>('/users/tag/meta')
}

export const validateTagName = (name: string, excludeId?: number) => {
  return request.get<{ valid: boolean; reason?: string }>('/users/tag/validate-name', { name, excludeId })
}

export const listTagDefinitions = (params?: PageParams & { status?: string; dimension?: string; keyword?: string }) => {
  return request.get<PageResult<TagDefinition>>('/users/tag/definitions', params)
}

export const createTagDefinition = (data: Partial<TagDefinition> & { name: string; applicableLevels: string[] }) => {
  return request.post<TagDefinition>('/users/tag/definitions', data)
}

export const updateTagDefinition = (id: number, data: Partial<TagDefinition>) => {
  return request.put<TagDefinition>(`/users/tag/definitions/${id}`, data)
}

export const checkUserTagMatch = (userId: number, tagName: string) => {
  return request.get<TagMatchResult>(`/users/${userId}/tag-match`, { tagName })
}

export const addUserTags = (userId: number, data: { tagNames: string[]; reason?: string }) => {
  return request.post<AddTagsResult>(`/users/${userId}/tags`, data)
}

export const removeUserTags = (userId: number, data: { tagNames: string[]; reason?: string }) => {
  return request.delete<AddTagsResult>(`/users/${userId}/tags`, data)
}

export const batchApplyTags = (data: {
  userIds?: number[]
  tagNames: string[]
  filterBy?: string | null
  activeRange?: [number | null, number | null] | null
  consumeLevel?: string | null
}) => {
  return request.post<BatchApplyTagsResult>('/users/tag/batch-apply', data)
}

export const getMemberTagLogs = (userId: number, params?: PageParams & { changeType?: string }) => {
  return request.get<PageResult<MemberTagLog>>(`/users/${userId}/tag-logs`, params)
}

export const getTagTrace = (userId: number) => {
  return request.get<TagTraceResult>(`/users/${userId}/tag-trace`)
}

export const cleanRedundantTags = (userId: number) => {
  return request.post<CleanTagsResult>(`/users/${userId}/tag-clean`)
