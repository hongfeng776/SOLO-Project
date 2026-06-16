import { get, post, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { Notification } from '@/types/business'

export const getNotificationList = (params: Record<string, unknown>): Promise<PageResult<Notification>> => {
  return get<PageResult<Notification>>('/notification', params)
}

export const getNotificationDetail = (id: number): Promise<Notification> => {
  return get<Notification>(`/notification/${id}`)
}

export const createNotification = (data: Partial<Notification>): Promise<{ id: number }> => {
  return post<{ id: number }>('/notification', data)
}

export const markNotificationAsRead = (id: number): Promise<{ id: number }> => {
  return post<{ id: number }>(`/notification/${id}/read`)
}

export const markAllNotificationsAsRead = (): Promise<null> => {
  return post<null>('/notification/mark-all-read')
}

export const getUnreadNotificationCount = (): Promise<{ count: number }> => {
  return get<{ count: number }>('/notification/unread-count')
}

export const deleteNotification = (id: number): Promise<null> => {
  return del<null>(`/notification/${id}`)
}
