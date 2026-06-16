import { get, put } from '@/utils/axios'
import type { PageParams, PageResult, BaseEntity } from '@/types'

export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded'

export interface OrderItem extends BaseEntity {
  orderNo: string
  channelId?: number | string
  channelName: string
  promoterId?: number | string
  promoterName: string
  productId?: number | string
  productName: string
  productImage?: string
  productSku?: string
  quantity: number
  amount: number
  commission: number
  commissionRate: number
  status: OrderStatus
  payTime?: string
  cancelTime?: string
  completeTime?: string
  refundTime?: string
  remark?: string
}

export interface OrderQueryParams extends PageParams {
  orderNo?: string
  channelId?: number | string
  promoterId?: number | string
  status?: OrderStatus
  keyword?: string
  startDate?: string
  endDate?: string
}

export type OrderUpdateParams = Partial<{
  status: OrderStatus
  remark: string
}>

export interface OrderBatchUpdateParams {
  ids: (string | number)[]
  status?: OrderStatus
  remark?: string
}

export function getOrderList(params: OrderQueryParams): Promise<PageResult<OrderItem>> {
  return get<PageResult<OrderItem>>('/orders', params)
}

export function getOrder(id: string | number): Promise<OrderItem> {
  return get<OrderItem>(`/orders/${id}`)
}

export function updateOrder(id: string | number, data: OrderUpdateParams): Promise<OrderItem> {
  return put<OrderItem>(`/orders/${id}`, data)
}

export function exportOrders(params: OrderQueryParams): Promise<{ url: string }> {
  return get<{ url: string }>('/orders/export', params)
}

export function batchUpdateOrders(ids: (string | number)[], data: OrderUpdateParams): Promise<null> {
  return put<null>('/orders/batch', { ids, ...data })
}

export function updateOrderStatus(id: string | number, status: number): Promise<null> {
  return put<null>(`/orders/${id}/status`, { status })
}
