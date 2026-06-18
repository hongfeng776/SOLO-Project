import { http } from '@/utils/request'
import type {
  EndUserItem,
  PaginationResult,
  EndUserQueryParams,
  AccountStatusLogItem,
  EndUserStats,
  StatusChangeValidation,
  DuplicateCheckResult,
  BatchEndUserResult,
  PaginationParams,
} from '@/types'

export const getEndUserListApi = (params: EndUserQueryParams): Promise<PaginationResult<EndUserItem>> => {
  return http.get<PaginationResult<EndUserItem>>('/api/v1/end-users', params)
}

export const getEndUserDetailApi = (id: number): Promise<EndUserItem> => {
  return http.get<EndUserItem>(`/api/v1/end-users/${id}`)
}

export const getEndUserByUidApi = (uid: string): Promise<EndUserItem> => {
  return http.get<EndUserItem>(`/api/v1/end-users/uid/${uid}`)
}

export const createEndUserApi = (data: Partial<EndUserItem>): Promise<{ id: number; uid: string }> => {
  return http.post<{ id: number; uid: string }>('/api/v1/end-users', data)
}

export const updateEndUserApi = (id: number, data: Partial<EndUserItem>): Promise<void> => {
  return http.put<void>(`/api/v1/end-users/${id}`, data)
}

export interface ChangeStatusParams {
  toStatus: number
  reason: string
  remark?: string
  durationDays?: number
  flowLimitLevel?: number
  operationType?: 'MANUAL' | 'BATCH' | 'SYSTEM'
  extraData?: Record<string, any>
}

export const changeEndUserStatusApi = (id: number, params: ChangeStatusParams): Promise<{ affectedPermissions: Record<string, boolean> }> => {
  return http.put<{ affectedPermissions: Record<string, boolean> }>(`/api/v1/end-users/${id}/status`, params)
}

export const validateStatusChangeApi = (id: number, toStatus: number): Promise<StatusChangeValidation> => {
  return http.get<StatusChangeValidation>(`/api/v1/end-users/${id}/validate-change`, { toStatus })
}

export interface BatchOperationParams {
  ids: number[]
  action: string
  reason?: string
  remark?: string
  flowLimitLevel?: number
  durationDays?: number
}

export const batchEndUserOperationApi = (params: BatchOperationParams): Promise<BatchEndUserResult> => {
  return http.post<BatchEndUserResult>('/api/v1/end-users/batch-operation', params)
}

export const getAccountStatusLogsApi = (
  params: PaginationParams & {
    userId?: number
    uid?: string
    operationBatch?: string
    operatorId?: number
    operationType?: string
    toStatus?: number
  }
): Promise<PaginationResult<AccountStatusLogItem>> => {
  return http.get<PaginationResult<AccountStatusLogItem>>('/api/v1/end-users/status-logs', params)
}

export const getEndUserStatsApi = (): Promise<EndUserStats> => {
  return http.get<EndUserStats>('/api/v1/end-users/stats')
}

export const validateEndUserDuplicateApi = (params: {
  username?: string
  phone?: string
  uid?: string
  checkType?: 'CREATE' | 'UPDATE' | 'ALL'
}): Promise<DuplicateCheckResult> => {
  return http.get<DuplicateCheckResult>('/api/v1/end-users/validate-duplicate', params)
}
