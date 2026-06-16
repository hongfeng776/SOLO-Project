import { get, post, put, del } from '@/utils/axios'
import type { PageParams, PageResult, Status, BaseEntity } from '@/types'

export type MarketingType = 'discount' | 'coupon' | 'rebate' | 'seckill' | 'other'

export interface MarketingItem extends BaseEntity {
  name: string
  type: MarketingType
  description?: string
  channelId?: number | string
  channelName?: string
  startTime: string
  endTime: string
  discountRate?: number
  discountAmount?: number
  minAmount?: number
  totalBudget?: number
  usedBudget?: number
  totalCount: number
  usedCount: number
  status: Status
  coverImage?: string
  bannerImage?: string
  rules?: string
}

export interface MarketingQueryParams extends PageParams {
  name?: string
  type?: MarketingType
  channelId?: number | string
  status?: Status
  keyword?: string
  startDate?: string
  endDate?: string
}

export type MarketingCreateParams = Omit<MarketingItem, 'id' | 'createdAt' | 'updatedAt' | 'usedBudget' | 'totalCount' | 'usedCount' | 'channelName'>
export type MarketingUpdateParams = Partial<MarketingCreateParams>

export function getMarketingList(params: MarketingQueryParams): Promise<PageResult<MarketingItem>> {
  return get<PageResult<MarketingItem>>('/marketings', params)
}

export function getMarketing(id: string | number): Promise<MarketingItem> {
  return get<MarketingItem>(`/marketings/${id}`)
}

export function createMarketing(data: MarketingCreateParams): Promise<MarketingItem> {
  return post<MarketingItem>('/marketings', data)
}

export function updateMarketing(id: string | number, data: MarketingUpdateParams): Promise<MarketingItem> {
  return put<MarketingItem>(`/marketings/${id}`, data)
}

export function deleteMarketing(id: string | number): Promise<null> {
  return del<null>(`/marketings/${id}`)
}

export function updateMarketingStatus(id: string | number, status: Status): Promise<null> {
  return put<null>(`/marketings/${id}/status`, { status })
}

export function batchUpdateMarketingStatus(ids: (string | number)[], status: Status): Promise<null> {
  return post<null>('/marketings/batch-status', { ids, status })
}
