import { http } from '@/utils/request'
import type { MessageItem, PaginationParams, PaginationResult, UnreadCountResult } from '@/types'

export const getMessageListApi = (params: PaginationParams): Promise<PaginationResult<MessageItem>> => {
  return http.get<PaginationResult<MessageItem>>('/api/v1/messages', params)
}

export const getMessageDetailApi = (id: number): Promise<MessageItem> => {
  return http.get<MessageItem>(`/api/v1/messages/${id}`)
}

export const createMessageApi = (data: Partial<MessageItem>): Promise<{ id: number }> => {
  return http.post<{ id: number }>('/api/v1/messages', data)
}

export const markMessageReadApi = (id: number): Promise<void> => {
  return http.put<void>(`/api/v1/messages/${id}/read`)
}

export const markAllMessageReadApi = (): Promise<void> => {
  return http.put<void>('/api/v1/messages/read-all')
}

export const deleteMessageApi = (id: number): Promise<void> => {
  return http.delete<void>(`/api/v1/messages/${id}`)
}

export const getUnreadCountApi = (): Promise<UnreadCountResult> => {
  return http.get<UnreadCountResult>('/api/v1/messages/unread-count')
}
