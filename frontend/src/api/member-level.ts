import { http } from '@/utils/request'
import type {
  MemberLevelItem,
  MemberLevelLogItem,
  MemberLevelUpgradeRecordItem,
  MemberLevelConflictCheckResult,
  MemberLevelStatsResult,
  MemberLevelTraceResult,
  MemberLevelBatchActionParams,
  MemberLevelBatchActionResult,
  MemberLevelCreateForm,
  MemberLevelEditForm,
  MemberLevelQueryParams,
  PaginationResult,
} from '@/types'

const BASE = '/api/v1/member-levels'

export const getMemberLevelListApi = (
  params: MemberLevelQueryParams
): Promise<PaginationResult<MemberLevelItem>> => {
  return http.get<PaginationResult<MemberLevelItem>>(BASE, params)
}

export const getMemberLevelDetailApi = (id: number): Promise<MemberLevelItem> => {
  return http.get<MemberLevelItem>(`${BASE}/${id}`)
}

export const getMemberLevelStatsApi = (): Promise<MemberLevelStatsResult> => {
  return http.get<MemberLevelStatsResult>(`${BASE}/stats`)
}

export const checkMemberLevelConflictsApi = (params: {
  levelCode?: string
  levelName?: string
  levelTier?: number
  minScore?: number
  maxScore?: number
  privileges?: any[]
  excludeId?: number
}): Promise<MemberLevelConflictCheckResult> => {
  return http.get<MemberLevelConflictCheckResult>(`${BASE}/check-conflicts`, params)
}

export const createMemberLevelApi = (
  data: MemberLevelCreateForm
): Promise<MemberLevelItem> => {
  return http.post<MemberLevelItem>(BASE, data)
}

export const updateMemberLevelApi = (
  id: number,
  data: MemberLevelEditForm
): Promise<MemberLevelItem & { needConfirm?: boolean; message?: string }> => {
  return http.put<MemberLevelItem & { needConfirm?: boolean; message?: string }>(
    `${BASE}/${id}`,
    data
  )
}

export const enableMemberLevelApi = (id: number): Promise<MemberLevelItem> => {
  return http.post<MemberLevelItem>(`${BASE}/${id}/enable`)
}

export const disableMemberLevelApi = (
  id: number,
  confirmed = false
): Promise<MemberLevelItem> => {
  return http.post<MemberLevelItem>(`${BASE}/${id}/disable`, { confirmed })
}

export const getMemberLevelHistoryApi = (
  levelId: number,
  params?: {
    page?: number
    pageSize?: number
    modifyType?: string
    startTime?: string
    endTime?: string
  }
): Promise<PaginationResult<MemberLevelLogItem>> => {
  return http.get<PaginationResult<MemberLevelLogItem>>(
    `${BASE}/${levelId}/history`,
    params
  )
}

export const batchActionMemberLevelApi = (
  data: MemberLevelBatchActionParams
): Promise<MemberLevelBatchActionResult> => {
  return http.post<MemberLevelBatchActionResult>(`${BASE}/batch-action`, data)
}

export const getMemberLevelUpgradeRecordsApi = (params: {
  page?: number
  pageSize?: number
  endUserId?: number
  fromLevelTier?: number
  toLevelTier?: number
  levelCode?: string
  configBatch?: string
  operationBatch?: string
  upgradeType?: string
  startTime?: string
  endTime?: string
  sortBy?: string
  sortOrder?: string
}): Promise<PaginationResult<MemberLevelUpgradeRecordItem>> => {
  return http.get<PaginationResult<MemberLevelUpgradeRecordItem>>(
    `${BASE}/upgrade-records`,
    params
  )
}

export const getMemberLevelTraceApi = (params: {
  traceType: 'levelCode' | 'configBatch' | 'upgradeRecord'
  traceValue: string
}): Promise<MemberLevelTraceResult> => {
  return http.get<MemberLevelTraceResult>(`${BASE}/trace`, params)
}
