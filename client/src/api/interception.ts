import { get, post, put } from '@utils/request'
import type {
  IApiResponse,
  IPaginatedData,
  ITradePreCheckParams,
  ITradePreCheckResult,
  IInterceptionRecord,
  IInterceptionListParams,
  IInterceptionStats,
  IAppealCreateData,
  IAppealRecord,
  IInterceptionHandleData,
  IAccountRiskStatus,
  IAlertMessage,
} from '@/types/api'
import { InterceptionStatus } from '@/enums'

export function preCheckTrade(data: ITradePreCheckParams): Promise<IApiResponse<ITradePreCheckResult>> {
  return post<ITradePreCheckResult>('/api/interception/pre-check', data)
}

export function getInterceptionList(
  params: IInterceptionListParams,
): Promise<IApiResponse<IPaginatedData<IInterceptionRecord>>> {
  return get<IPaginatedData<IInterceptionRecord>>('/api/interception/list', params)
}

export function getInterceptionById(id: number): Promise<IApiResponse<IInterceptionRecord>> {
  return get<IInterceptionRecord>(`/api/interception/${id}`)
}

export function getInterceptionStats(
  params?: { startDate?: string; endDate?: string },
): Promise<IApiResponse<IInterceptionStats>> {
  return get<IInterceptionStats>('/api/interception/stats', params)
}

export function handleInterception(
  data: IInterceptionHandleData,
): Promise<IApiResponse<IInterceptionRecord>> {
  return post<IInterceptionRecord>('/api/interception/handle', data)
}

export function releaseInterception(id: number, remark: string): Promise<IApiResponse<IInterceptionRecord>> {
  return post<IInterceptionRecord>(`/api/interception/${id}/release`, { remark })
}

export function batchReleaseInterception(
  ids: number[],
  remark: string,
): Promise<IApiResponse<{ success: number; failed: number; failedItems: Array<{ id: number; reason: string }> }>> {
  return post('/api/interception/batch-release', { ids, remark })
}

export function createAppeal(data: IAppealCreateData): Promise<IApiResponse<IAppealRecord>> {
  return post<IAppealRecord>('/api/interception/appeal', data)
}

export function getAppealList(params: {
  page: number
  pageSize: number
  interceptionId?: number
  customerId?: number
  status?: string
}): Promise<IApiResponse<IPaginatedData<IAppealRecord>>> {
  return get<IPaginatedData<IAppealRecord>>('/api/interception/appeal/list', params)
}

export function reviewAppeal(
  appealId: number,
  approve: boolean,
  remark: string,
  releaseInterception?: boolean,
): Promise<IApiResponse<IAppealRecord>> {
  return post<IAppealRecord>(`/api/interception/appeal/review`, {
    appealId,
    approve,
    remark,
    releaseInterception,
  })
}

export function getAccountRiskStatus(customerId: number): Promise<IApiResponse<IAccountRiskStatus>> {
  return get<IAccountRiskStatus>(`/api/interception/account-risk/${customerId}`)
}

export function scanAccountRisk(customerId: number): Promise<IApiResponse<IAccountRiskStatus>> {
  return post<IAccountRiskStatus>(`/api/interception/scan-risk/${customerId}`)
}

export function getAlertMessages(params: {
  page: number
  pageSize: number
  isRead?: boolean
  level?: string
}): Promise<IApiResponse<IPaginatedData<IAlertMessage>>> {
  return get<IPaginatedData<IAlertMessage>>('/api/interception/alerts', params)
}

export function markAlertRead(alertId: number): Promise<IApiResponse<null>> {
  return post<null>(`/api/interception/alerts/${alertId}/read`)
}

export function markAllAlertsRead(): Promise<IApiResponse<{ count: number }>> {
  return post<{ count: number }>('/api/interception/alerts/read-all')
}

export function updateInterceptionStatus(
  id: number,
  targetStatus: InterceptionStatus,
  remark: string,
): Promise<IApiResponse<IInterceptionRecord>> {
  return put<IInterceptionRecord>(`/api/interception/${id}/status`, { targetStatus, remark })
}

export function getInterceptionExport(params: IInterceptionListParams): Promise<IApiResponse<{ downloadUrl: string; fileName: string }>> {
  return get<{ downloadUrl: string; fileName: string }>('/api/interception/export', params)
}
