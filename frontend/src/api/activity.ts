import { get, post, put, del } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { Activity, Order } from '@/types/business'

export const getActivityList = (params: Record<string, unknown>): Promise<PageResult<Activity>> => {
  return get<PageResult<Activity>>('/activity/list', params)
}

export const getActivityDetail = (id: number): Promise<Activity> => {
  return get<Activity>(`/activity/list/${id}`)
}

export const createActivity = (data: Partial<Activity>): Promise<{ id: number }> => {
  return post<{ id: number }>('/activity/list', data)
}

export const updateActivity = (id: number, data: Partial<Activity>): Promise<{ id: number }> => {
  return put<{ id: number }>(`/activity/list/${id}`, data)
}

export const deleteActivity = (id: number): Promise<null> => {
  return del<null>(`/activity/list/${id}`)
}

export const getOrderList = (params: Record<string, unknown>): Promise<PageResult<Order>> => {
  return get<PageResult<Order>>('/activity/orders', params)
}

export const getOrderDetail = (id: number): Promise<Order> => {
  return get<Order>(`/activity/orders/${id}`)
}

export const updateOrderStatus = (
  id: number,
  status: number,
  remark?: string
): Promise<{ id: number }> => {
  return put<{ id: number }>(`/activity/orders/${id}/status`, { status, remark })
}
