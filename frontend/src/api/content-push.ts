import { get, post, put } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  ContentPushTask,
  ContentPushTrace,
  PushCreateValidationResult,
  PushStatsResult,
  PushBatchResult,
  PushFullChainResult
} from '@/types/business'

export function getContentPushList(params: any) {
  return get<PageResult<ContentPushTask>>('/api/content-push', params)
}

export function getContentPushDetail(id: number) {
  return get<ContentPushTask>(`/api/content-push/${id}`)
}

export function validateContentPushCreate(data: { noteId: number; poolId: number; pushStrength?: number }) {
  return post<PushCreateValidationResult>('/api/content-push/validate', data)
}

export function createContentPush(data: { noteId: number; poolId: number; pushStrength?: number; expectedEndTime?: string }) {
  return post<{ success: boolean; blocked?: boolean; taskId?: number; taskNo?: string; reason?: string; detail?: string }>('/api/content-push', data)
}

export function startContentPush(id: number) {
  return put<any>(`/api/content-push/${id}/start`, {})
}

export function pauseContentPush(id: number) {
  return put<any>(`/api/content-push/${id}/pause`, {})
}

export function terminateContentPush(id: number, reason?: string) {
  return put<any>(`/api/content-push/${id}/terminate`, { reason })
}

export function adjustContentPushStrength(id: number, strength: number) {
  return put<any>(`/api/content-push/${id}/strength`, { strength })
}

export function batchContentPushOperation(data: {
  operation: 'start' | 'pause' | 'terminate' | 'strengthen' | 'downgrade' | 'enhance'
  ids?: number[]
  filter?: Record<string, any>
  reason?: string
  targetStrength?: number
}) {
  return post<PushBatchResult>('/api/content-push/batch', data)
}

export function refreshContentPushStats(id: number) {
  return put<{ exposed: number; clicks: number; interacts: number; anomalies: number; skipped?: boolean }>(`/api/content-push/${id}/refresh-stats`, {})
}

export function getContentPushStats() {
  return get<PushStatsResult>('/api/content-push/stats')
}

export function getContentPushTraces(params: any) {
  return get<PageResult<ContentPushTrace>>('/api/content-push/trace/list', params)
}

export function getContentPushFullChain(id: number) {
  return get<PushFullChainResult>(`/api/content-push/${id}/chain`)
}
