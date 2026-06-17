import request from '@/utils/request'
import type { Order, OrderQueryParams, OrderTraceData, EditConditionResult, PriceValidateResult, StatusLogItem, BatchOpResult } from '@/types/order'
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

export const completeOrderApi = (id: number) => {
  return request.put(`/order/${id}/complete`)
}

export const batchDispatchApi = (orderIds: number[]) => {
  return request.post('/order/batch-dispatch', { orderIds })
}

export const getEditConditionsApi = (id: number) => {
  return request.get<EditConditionResult>(`/order/${id}/edit-conditions`)
}

export const validatePriceApi = (data: { distance: number; capacityType?: number; estimatedPrice: number }) => {
  return request.post<PriceValidateResult>('/order/validate-price', data)
}

export const updateOrderBaseInfoApi = (id: number, data: Partial<Order>) => {
  return request.put<Order>(`/order/${id}/base-info`, data)
}

export const getOrderStatusLogsApi = (id: number, params?: { page?: number; pageSize?: number }) => {
  return request.get<PageResult<StatusLogItem>>(`/order/${id}/status-logs`, params)
}

export const getOrderTraceApi = (orderNo: string) => {
  return request.get<OrderTraceData>(`/order/trace/${orderNo}`)
}

export const getTraceHistoryApi = (params?: { page?: number; pageSize?: number }) => {
  return request.get('/order/trace/history', params)
}

export const getAvailableActionsApi = (id: number) => {
  return request.get<{ status: number; actions: string[] }>(`/order/${id}/actions`)
}

export const batchUpdatePriceRuleApi = (orderIds: number[], priceRule: { basePrice?: number; perKmPrice?: number }) => {
  return request.post<BatchOpResult>('/order/batch-price-rule', { orderIds, priceRule })
}
