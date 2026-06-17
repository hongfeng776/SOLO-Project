import { get, post, put, del } from '@utils/request'
import type {
  IApiResponse,
  IPaginatedData,
  IQuoteThreshold,
  IThresholdListParams,
  IThresholdRangeCheckResult,
  IThresholdConflictCheckResult,
  IThresholdPeriodCheckResult,
  IThresholdHistoryResult,
  IActiveThreshold,
  IThresholdScenarioMatch,
  IThresholdCreateData,
  IThresholdUpdateData,
} from '@/types/api'

export function getThresholdList(params: IThresholdListParams): Promise<IApiResponse<IPaginatedData<IQuoteThreshold>>> {
  return get<IPaginatedData<IQuoteThreshold>>('/api/thresholds', params)
}

export function getActiveThresholds(sectors?: string[]): Promise<IApiResponse<IActiveThreshold[]>> {
  return get<IActiveThreshold[]>('/api/thresholds/active', sectors ? { sectors } : {})
}

export function getThresholdById(id: number): Promise<IApiResponse<IQuoteThreshold>> {
  return get<IQuoteThreshold>(`/api/thresholds/${id}`)
}

export function getThresholdHistory(id: number, days?: number): Promise<IApiResponse<IThresholdHistoryResult>> {
  return get<IThresholdHistoryResult>(`/api/thresholds/${id}/history`, days ? { days } : {})
}

export function checkRange(data: Partial<IQuoteThreshold>): Promise<IApiResponse<IThresholdRangeCheckResult>> {
  return post<IThresholdRangeCheckResult>('/api/thresholds/check-range', data)
}

export function checkConflict(data: Partial<IQuoteThreshold>): Promise<IApiResponse<IThresholdConflictCheckResult>> {
  return post<IThresholdConflictCheckResult>('/api/thresholds/check-conflict', data)
}

export function checkPeriod(data: { effectiveStart?: string; effectiveEnd?: string }): Promise<IApiResponse<IThresholdPeriodCheckResult>> {
  return post<IThresholdPeriodCheckResult>('/api/thresholds/check-period', data)
}

export function createThreshold(data: IThresholdCreateData): Promise<IApiResponse<IQuoteThreshold>> {
  return post<IQuoteThreshold>('/api/thresholds', data)
}

export function updateThreshold(id: number, data: IThresholdUpdateData): Promise<IApiResponse<IQuoteThreshold>> {
  return put<IQuoteThreshold>(`/api/thresholds/${id}`, data)
}

export function batchUpdateThresholds(ids: number[], patch: IThresholdUpdateData): Promise<IApiResponse<{ updatedCount: number }>> {
  return post<{ updatedCount: number }>('/api/thresholds/batch', { ids, patch })
}

export function deleteThreshold(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/thresholds/${id}`)
}

export function expireTemporary(): Promise<IApiResponse<{ expiredCount: number }>> {
  return post<{ expiredCount: number }>('/api/thresholds/expire-temporary', {})
}

export function matchScenarios(stockSector: string, stockVolatility: number): Promise<IApiResponse<IThresholdScenarioMatch[]>> {
  return post<IThresholdScenarioMatch[]>('/api/thresholds/match-scenarios', { stockSector, stockVolatility })
}
