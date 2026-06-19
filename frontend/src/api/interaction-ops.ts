import { get, post } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  InteractionData, InteractionAnomalyLog, InteractionOpsStats, InteractionTraceResult
} from '@/types/business'

export const getInteractionStats = (): Promise<InteractionOpsStats> => {
  return get<InteractionOpsStats>('/interaction-ops/stats')
}

export const getInteractionList = (params: Record<string, unknown>): Promise<PageResult<InteractionData>> => {
  return get<PageResult<InteractionData>>('/interaction-ops', params)
}

export const refreshInteractionData = (noteId: number): Promise<any> => {
  return post<any>(`/interaction-ops/refresh/${noteId}`)
}

export const batchCalibrateInteraction = (ids: number[]): Promise<{ total: number; success: number }> => {
  return post<{ total: number; success: number }>('/interaction-ops/batch-calibrate', { ids })
}

export const batchCleanFakeInteraction = (ids: number[]): Promise<{ total: number; success: number }> => {
  return post<{ total: number; success: number }>('/interaction-ops/batch-clean-fake', { ids })
}

export const batchMarkQualityInteraction = (ids: number[]): Promise<{ total: number; success: number }> => {
  return post<{ total: number; success: number }>('/interaction-ops/batch-mark-quality', { ids })
}

export const linkInteractionWeight = (noteId: number): Promise<any> => {
  return post<any>(`/interaction-ops/link-weight/${noteId}`)
}

export const getInteractionTrace = (noteId: number): Promise<InteractionTraceResult> => {
  return get<InteractionTraceResult>(`/interaction-ops/trace/${noteId}`)
}

export const getInteractionAnomalyLogs = (params: Record<string, unknown>): Promise<PageResult<InteractionAnomalyLog>> => {
  return get<PageResult<InteractionAnomalyLog>>('/interaction-ops/anomaly-logs', params)
}
