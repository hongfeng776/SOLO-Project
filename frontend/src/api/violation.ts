import { get, post, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { ViolationRecord } from '@/types/business'

export const getViolationList = (params: Record<string, unknown>): Promise<PageResult<ViolationRecord>> => {
  return get<PageResult<ViolationRecord>>('/violation', params)
}

export const getViolationDetail = (id: number): Promise<ViolationRecord> => {
  return get<ViolationRecord>(`/violation/${id}`)
}

export const createViolation = (data: Partial<ViolationRecord>): Promise<{ id: number }> => {
  return post<{ id: number }>('/violation', data)
}

export const handleViolation = (
  id: number,
  data: { handleResult: number; handleNote?: string }
): Promise<{ id: number }> => {
  return post<{ id: number }>(`/violation/${id}/handle`, data)
}

export const batchHandleViolations = (
  ids: number[],
  data: { handleResult: number; handleNote?: string }
): Promise<null> => {
  return post<null>('/violation/batch-handle', { ids, ...data })
}

export const appealViolation = (
  id: number,
  data: { appealContent: string }
): Promise<{ id: number }> => {
  return post<{ id: number }>(`/violation/${id}/appeal`, data)
}

export const deleteViolation = (id: number): Promise<null> => {
  return del<null>(`/violation/${id}`)
}

export const getViolationStats = (): Promise<Record<string, number>> => {
  return get<Record<string, number>>('/violation/stats')
}
