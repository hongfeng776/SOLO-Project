import { get, post, put, del } from '@/utils/axios'
import type { PageParams, PageResult, Status, BaseEntity } from '@/types'

export interface PromoterItem extends BaseEntity {
  name: string
  phone: string
  avatar?: string
  email?: string
  wechat?: string
  channelId?: number | string
  channelName?: string
  level: number
  totalOrders: number
  totalAmount?: number
  totalCommission: number
  availableCommission?: number
  status: Status | number
}

export interface PromoterQueryParams extends PageParams {
  name?: string
  phone?: string
  channelId?: number | string
  level?: number
  status?: Status
  keyword?: string
  startDate?: string
  endDate?: string
}

export type PromoterCreateParams = Omit<PromoterItem, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders' | 'totalCommission' | 'channelName'>
export type PromoterUpdateParams = Partial<PromoterCreateParams>

export function getPromoterList(params: PromoterQueryParams): Promise<PageResult<PromoterItem>> {
  return get<PageResult<PromoterItem>>('/promoters', params)
}

export function getPromoter(id: string | number): Promise<PromoterItem> {
  return get<PromoterItem>(`/promoters/${id}`)
}

export function createPromoter(data: PromoterCreateParams): Promise<PromoterItem> {
  return post<PromoterItem>('/promoters', data)
}

export function updatePromoter(id: string | number, data: PromoterUpdateParams): Promise<PromoterItem> {
  return put<PromoterItem>(`/promoters/${id}`, data)
}

export function deletePromoter(id: string | number): Promise<null> {
  return del<null>(`/promoters/${id}`)
}

export function batchDeletePromoters(ids: (string | number)[]): Promise<null> {
  return del<null>('/promoters/batch', { ids })
}

export function updatePromoterStatus(id: string | number, status: Status): Promise<null> {
  return put<null>(`/promoters/${id}/status`, { status })
}
