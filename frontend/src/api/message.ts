import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export interface Message {
  id: number
  title: string
  content: string
  type: number
  typeName: string
  category: number
  categoryName: string
  priority: number
  priorityName: string
  sender: string
  senderId: number
  receiverId: number
  receiverName: string
  isRead: boolean
  readTime?: string
  relatedType?: string
  relatedId?: number
  createdAt: string
}

export interface MessageQueryParams extends PageParams {
  type?: number
  category?: number
  priority?: number
  isRead?: boolean
  startTime?: string
  endTime?: string
  keyword?: string
}

export interface SendMessageParams {
  title: string
  content: string
  type: number
  category: number
  priority: number
  receiverIds: number[]
  relatedType?: string
  relatedId?: number
}

export interface MessageStatistics {
  total: number
  unread: number
  today: number
  byType: { type: number; typeName: string; count: number; unread: number }[]
  byCategory: { category: number; categoryName: string; count: number; unread: number }[]
}

export function getMessageList(params: MessageQueryParams): Promise<ApiResponse<PageResult<Message>>> {
  return request.get<PageResult<Message>>('/message/list', { params })
}

export function getMessage(id: number): Promise<ApiResponse<Message>> {
  return request.get<Message>(`/message/${id}`)
}

export function sendMessage(data: SendMessageParams): Promise<ApiResponse<null>> {
  return request.post<null>('/message/send', data)
}

export function markAsRead(id: number): Promise<ApiResponse<null>> {
  return request.put<null>(`/message/${id}/read`)
}

export function markAllAsRead(): Promise<ApiResponse<null>> {
  return request.put<null>('/message/all/read')
}

export function deleteMessage(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`/message/${id}`)
}

export function batchDeleteMessage(ids: number[]): Promise<ApiResponse<null>> {
  return request.post<null>('/message/batchDelete', { ids })
}

export function getMessageStatistics(): Promise<ApiResponse<MessageStatistics>> {
  return request.get<MessageStatistics>('/message/statistics')
}
