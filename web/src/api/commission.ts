import { get, post } from '@/utils/axios'
import type { PageParams, PageResult, BaseEntity } from '@/types'

export type CommissionStatus = 'pending' | 'settling' | 'settled' | 'cancelled'

export interface CommissionItem extends BaseEntity {
  orderId: number | string
  orderNo: string
  promoterId: number | string
  promoterName: string
  channelId?: number | string
  channelName?: string
  type?: string
  amount: number
  commissionRate: number
  commission: number
  status: CommissionStatus | number
  settleTime?: string
  settledAt?: string
}

export interface CommissionQueryParams extends PageParams {
  orderNo?: string
  promoterId?: number | string
  channelId?: number | string
  status?: CommissionStatus | number
  type?: string
  keyword?: string
  startDate?: string
  endDate?: string
  settleStartDate?: string
  settleEndDate?: string
}

export interface CommissionSummary {
  totalCount: number
  totalCommission: number
  pendingCount: number
  pendingCommission: number
  settledCount: number
  settledCommission: number
}

export interface CommissionSummaryQueryParams {
  promoterId?: number | string
  channelId?: number | string
  startDate?: string
  endDate?: string
}

export function getCommissionList(params: CommissionQueryParams): Promise<PageResult<CommissionItem>> {
  return get<PageResult<CommissionItem>>('/commissions', params)
}

export function getCommission(id: string | number): Promise<CommissionItem> {
  return get<CommissionItem>(`/commissions/${id}`)
}

export function getCommissionSummary(params?: CommissionSummaryQueryParams): Promise<CommissionSummary> {
  return get<CommissionSummary>('/commissions/summary', params)
}

export function settleCommissions(ids: (string | number)[]): Promise<{ successCount: number; failedCount: number }> {
  return post<{ successCount: number; failedCount: number }>('/commissions/settle', { ids })
}
