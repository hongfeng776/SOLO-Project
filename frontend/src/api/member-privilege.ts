import { http } from '@/utils/request'
import type {
  MemberPrivilegeItem,
  MemberPrivilegeLogItem,
  MemberPrivilegeRedemptionItem,
  MemberPrivilegeConflictCheckResult,
  MemberPrivilegeStatsResult,
  MemberPrivilegeTraceResult,
  MemberPrivilegeBatchActionParams,
  MemberPrivilegeBatchActionResult,
  MemberPrivilegeCreateForm,
  MemberPrivilegeEditForm,
  MemberPrivilegeQueryParams,
  MemberPrivilegeRedemptionQueryParams,
  PaginationResult,
} from '@/types'

const BASE = '/api/v1/member-privileges'

export const getMemberPrivilegeListApi = (
  params: MemberPrivilegeQueryParams
): Promise<PaginationResult<MemberPrivilegeItem>> => {
  return http.get<PaginationResult<MemberPrivilegeItem>>(BASE, params)
}

export const getMemberPrivilegeDetailApi = (id: number): Promise<MemberPrivilegeItem> => {
  return http.get<MemberPrivilegeItem>(`${BASE}/${id}`)
}

export const getMemberPrivilegeStatsApi = (): Promise<MemberPrivilegeStatsResult> => {
  return http.get<MemberPrivilegeStatsResult>(`${BASE}/stats`)
}

export const checkMemberPrivilegeConflictsApi = (params: {
  privilegeName?: string
  privilegeType?: string
  applicableLevels?: number[]
  effectiveStartTime?: string
  effectiveEndTime?: string
  permissionSwitches?: Record<string, boolean>
  excludeId?: number
}): Promise<MemberPrivilegeConflictCheckResult> => {
  return http.get<MemberPrivilegeConflictCheckResult>(`${BASE}/check-conflicts`, params as any)
}

export const createMemberPrivilegeApi = (
  data: MemberPrivilegeCreateForm
): Promise<MemberPrivilegeItem> => {
  return http.post<MemberPrivilegeItem>(BASE, data)
}

export const updateMemberPrivilegeApi = (
  id: number,
  data: Partial<MemberPrivilegeCreateForm>
): Promise<MemberPrivilegeItem & { message?: string }> => {
  return http.put<MemberPrivilegeItem & { message?: string }>(`${BASE}/${id}`, data)
}

export const changeMemberPrivilegeStatusApi = (
  id: number,
  status: number
): Promise<MemberPrivilegeItem> => {
  return http.post<MemberPrivilegeItem>(`${BASE}/${id}/status`, { status })
}

export const getMemberPrivilegeHistoryApi = (
  privilegeId: number,
  params?: {
    page?: number
    pageSize?: number
    modifyType?: string
    startTime?: string
    endTime?: string
  }
): Promise<PaginationResult<MemberPrivilegeLogItem>> => {
  return http.get<PaginationResult<MemberPrivilegeLogItem>>(
    `${BASE}/${privilegeId}/history`,
    params
  )
}

export const batchActionMemberPrivilegeApi = (
  data: MemberPrivilegeBatchActionParams
): Promise<MemberPrivilegeBatchActionResult> => {
  return http.post<MemberPrivilegeBatchActionResult>(`${BASE}/batch-action`, data)
}

export const getMemberPrivilegeRedemptionsApi = (
  params: MemberPrivilegeRedemptionQueryParams
): Promise<PaginationResult<MemberPrivilegeRedemptionItem>> => {
  return http.get<PaginationResult<MemberPrivilegeRedemptionItem>>(`${BASE}/redemptions`, params)
}

export const getMemberPrivilegeTraceApi = (params: {
  traceType: 'privilegeCode' | 'configBatch' | 'redemptionRecord'
  traceValue: string
}): Promise<MemberPrivilegeTraceResult> => {
  return http.get<MemberPrivilegeTraceResult>(`${BASE}/trace`, params)
}
