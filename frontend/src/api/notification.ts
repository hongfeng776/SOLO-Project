import request from '@/utils/request'
import type { PageResult, PageParams, Notification } from '@/types'

interface NotificationListParams extends PageParams {
  keyword?: string
  type?: string
  isRead?: boolean
}

export const getNotificationList = (params: NotificationListParams) => {
  return request.get<PageResult<Notification>>('/notifications', params)
}

export const getUnreadCount = () => {
  return request.get<{ count: number }>('/notifications/unread-count')
}

export const markAsRead = (id: number) => {
  return request.put(`/notifications/${id}/read`)
}

export const markAllAsRead = () => {
  return request.put('/notifications/read-all')
}
