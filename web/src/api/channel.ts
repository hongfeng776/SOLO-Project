import { get, post, put, del } from '@/utils/axios'
import type { PageParams, PageResult, BaseEntity } from '@/types'

export type ChannelType = 'wechat' | 'douyin' | 'kuaishou' | 'xiaohongshu' | 'weibo' | 'other'
export type ChannelStatus = 0 | 1

export interface ChannelItem extends BaseEntity {
  name: string
  code: string
  type: ChannelType
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  commissionRate: number
  status: ChannelStatus
  remark?: string
  sort?: number
}

export interface ChannelQueryParams extends PageParams {
  keyword?: string
  type?: ChannelType
  status?: ChannelStatus
}

export type ChannelCreateParams = Omit<ChannelItem, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
export type ChannelUpdateParams = Partial<ChannelCreateParams>

export function getChannelList(params: ChannelQueryParams): Promise<PageResult<ChannelItem>> {
  return get<PageResult<ChannelItem>>('/channels', params)
}

export function getChannel(id: string | number): Promise<ChannelItem> {
  return get<ChannelItem>(`/channels/${id}`)
}

export function createChannel(data: ChannelCreateParams): Promise<ChannelItem> {
  return post<ChannelItem>('/channels', data)
}

export function updateChannel(id: string | number, data: ChannelUpdateParams): Promise<ChannelItem> {
  return put<ChannelItem>(`/channels/${id}`, data)
}

export function deleteChannel(id: string | number): Promise<null> {
  return del<null>(`/channels/${id}`)
}

export function batchDeleteChannels(ids: (string | number)[]): Promise<null> {
  return del<null>('/channels/batch', { ids })
}

export function updateChannelStatus(id: string | number, status: ChannelStatus): Promise<null> {
  return put<null>(`/channels/${id}/status`, { status })
}

export function batchUpdateChannelStatus(ids: (string | number)[], status: ChannelStatus): Promise<null> {
  return post<null>('/channels/batch-status', { ids, status })
}
