import request from '@/utils/request'
import type { Order, OrderQueryParams } from '@/types/order'
import type { PageResult } from '@/utils/request'

export const getOrderListApi = (params: OrderQueryParams) => {
  return request.get<PageResult<Order>>('/order', params)
}

export const getOrderDetailApi = (id: number) => {
  return request.get<Order>(`/order/${id}`)
}

export const createOrderApi = (data: Partial<Order>) => {
  return request.post<Order>('/order', data)
}

export const updateOrderApi = (id: number, data: Partial<Order>) => {
  return request.put<Order>(`/order/${id}`, data)
}

export const deleteOrderApi = (id: number) => {
  return request.delete(`/order/${id}`)
}

export const dispatchOrderApi = (id: number, driverId: number) => {
  return request.put(`/order/${id}/dispatch`, { driverId })
}

export const cancelOrderApi = (id: number, reason: string) => {
  return request.put(`/order/${id}/cancel`, { reason })
}

export const getOrderStatisticsApi = () => {
  return request.get('/order/statistics')
}
