import { get, post } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { Settlement } from '@/types/business'

export const getSettlementList = (params: Record<string, unknown>): Promise<PageResult<Settlement>> => {
  return get<PageResult<Settlement>>('/settlement', params)
}

export const getSettlementDetail = (id: number): Promise<Settlement> => {
  return get<Settlement>(`/settlement/${id}`)
}

export const createSettlement = (data: Partial<Settlement>): Promise<{ id: number }> => {
  return post<{ id: number }>('/settlement', data)
}

export const settleSettlement = (id: number, remark?: string): Promise<{ id: number }> => {
  return post<{ id: number }>(`/settlement/${id}/settle`, { remark })
}

export const rejectSettlement = (id: number, remark: string): Promise<{ id: number }> => {
  return post<{ id: number }>(`/settlement/${id}/reject`, { remark })
}

export const batchSettleSettlements = (ids: number[], remark?: string): Promise<null> => {
  return post<null>('/settlement/batch-settle', { ids, remark })
}

export const getSettlementStats = (): Promise<Record<string, number>> => {
  return get<Record<string, number>>('/settlement/stats')
}
