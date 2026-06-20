import { get, post } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  HotCommentItem, HotCommentStats, HotCommentLogItem,
  HotCommentTraceResult, HotCommentAnomalyResult
} from '@/types/business'

export const getHotCommentStats = (): Promise<HotCommentStats> => {
  return get<HotCommentStats>('/hot-comment/stats')
}

export const getHotCommentList = (params: Record<string, unknown>): Promise<PageResult<HotCommentItem>> => {
  return get<PageResult<HotCommentItem>>('/hot-comment', params)
}

export const computeHotCommentRank = (data: { noteId?: number; limit?: number; force?: boolean }): Promise<any> => {
  return post<any>('/hot-comment/compute', data)
}

export const refreshHotCommentRanking = (): Promise<any> => {
  return post<any>('/hot-comment/refresh-ranking')
}

export const manualTopHotComment = (ids: number[], startOrder?: number): Promise<{ total: number; success: number }> => {
  return post<{ total: number; success: number }>('/hot-comment/manual-top', { ids, startOrder })
}

export const cancelTopHotComment = (ids: number[]): Promise<{ total: number; success: number }> => {
  return post<{ total: number; success: number }>('/hot-comment/cancel-top', { ids })
}

export const batchTopHotComment = (ids: number[]): Promise<{ total: number; success: number }> => {
  return post<{ total: number; success: number }>('/hot-comment/batch-top', { ids })
}

export const batchOffHotComment = (ids: number[]): Promise<{ total: number; success: number; autoRefill: boolean }> => {
  return post<{ total: number; success: number; autoRefill: boolean }>('/hot-comment/batch-off', { ids })
}

export const getHotCommentTrace = (commentId: number): Promise<HotCommentTraceResult> => {
  return get<HotCommentTraceResult>(`/hot-comment/trace/${commentId}`)
}

export const getHotCommentLogs = (params: Record<string, unknown>): Promise<PageResult<HotCommentLogItem>> => {
  return get<PageResult<HotCommentLogItem>>('/hot-comment/logs', params)
}

export const hotCommentAnomalyDetect = (): Promise<HotCommentAnomalyResult> => {
  return get<HotCommentAnomalyResult>('/hot-comment/anomaly-detect')
}
