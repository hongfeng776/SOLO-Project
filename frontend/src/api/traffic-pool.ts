import { get, post, put, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  TrafficPool,
  TrafficPoolPermission,
  CreateValidationResult,
  TrafficPoolUpdateResult,
  BatchOperationResult,
  QuotaStats,
  TrafficPoolLog,
  TrafficPoolLogAnalyzeResult
} from '@/types/business'

export const getTrafficPoolList = (
  params: Record<string, unknown>
): Promise<PageResult<TrafficPool> & { permission: TrafficPoolPermission }> => {
  return get<PageResult<TrafficPool> & { permission: TrafficPoolPermission }>('/traffic-pool', params)
}

export const getTrafficPoolDetail = (
  id: number
): Promise<{ pool: TrafficPool; permission: TrafficPoolPermission }> => {
  return get<{ pool: TrafficPool; permission: TrafficPoolPermission }>(`/traffic-pool/${id}`)
}

export const validateTrafficPoolCreate = (data: {
  poolLevel: number
  contentAdaptType: string
  dailyQuota: number
  minContentScore: number
  maxViolationCount: number
}): Promise<CreateValidationResult> => {
  return post<CreateValidationResult>('/traffic-pool/validate', data)
}

export const createTrafficPool = (data: Partial<TrafficPool> & { reason?: string }): Promise<{ id: number; poolName: string }> => {
  return post<{ id: number; poolName: string }>('/traffic-pool', data)
}

export const updateTrafficPool = (
  id: number,
  data: Partial<TrafficPool> & { reason?: string }
): Promise<TrafficPoolUpdateResult> => {
  return put<TrafficPoolUpdateResult>(`/traffic-pool/${id}`, data)
}

export const deleteTrafficPool = (id: number): Promise<null> => {
  return del<null>(`/traffic-pool/${id}`)
}

export const batchUpdateTrafficPoolQuota = (data: {
  ids: number[]
  dailyQuota: number
  reason?: string
}): Promise<BatchOperationResult> => {
  return post<BatchOperationResult>('/traffic-pool/batch/quota', data)
}

export const batchUpdateTrafficPoolRules = (data: {
  ids: number[]
  minContentScore?: number
  maxViolationCount?: number
  admissionRules?: Record<string, any>
  reason?: string
}): Promise<BatchOperationResult> => {
  return post<BatchOperationResult>('/traffic-pool/batch/rules', data)
}

export const batchToggleTrafficPoolStatus = (data: {
  ids: number[]
  status: number
  reason?: string
}): Promise<BatchOperationResult> => {
  return post<BatchOperationResult>('/traffic-pool/batch/status', data)
}

export const getTrafficPoolQuotaStats = (): Promise<QuotaStats> => {
  return get<QuotaStats>('/traffic-pool/quota-stats')
}

export const getTrafficPoolLogs = (
  params: Record<string, unknown>
): Promise<PageResult<TrafficPoolLog> & { permission: TrafficPoolPermission }> => {
  return get<PageResult<TrafficPoolLog> & { permission: TrafficPoolPermission }>('/traffic-pool/logs', params)
}

export const analyzeTrafficPoolLog = (
  id: number
): Promise<TrafficPoolLogAnalyzeResult> => {
  return get<TrafficPoolLogAnalyzeResult>(`/traffic-pool/logs/${id}/analyze`)
}
