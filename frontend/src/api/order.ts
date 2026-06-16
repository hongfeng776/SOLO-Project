import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export interface Order {
  id: number
  orderNo: string
  userId: number
  username: string
  totalAmount: number
  payAmount: number
  freightAmount: number
  discountAmount: number
  status: number
  payStatus: number
  payTime?: string
  logisticsStatus: number
  logisticsNo?: string
  logisticsCompany?: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  remark?: string
  merchantId: number
  merchantName?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

export interface OrderItem {
  id: number
  orderId: number
  goodsId: number
  goodsName: string
  goodsImage: string
  specInfo: string
  price: number
  quantity: number
  subtotal: number
}

export interface OrderQueryParams extends PageParams {
  orderNo?: string
  status?: number
  userId?: number
  startTime?: string
  endTime?: string
}

export function getOrderList(params: OrderQueryParams): Promise<ApiResponse<PageResult<Order>>> {
  return request.get<PageResult<Order>>('/order/list', { params })
}

export function getOrderDetail(id: number): Promise<ApiResponse<Order>> {
  return request.get<Order>(`/order/${id}`)
}

export function updateOrderStatus(id: number, status: number): Promise<ApiResponse<null>> {
  return request.put<null>(`/order/${id}/status`, { status })
}

export function shipOrder(id: number, data: { logisticsCompany: string; logisticsNo: string }): Promise<ApiResponse<null>> {
  return request.put<null>(`/order/${id}/ship`, data)
}

export function refundOrder(id: number, data: { amount: number; reason: string }): Promise<ApiResponse<null>> {
  return request.post<null>(`/order/${id}/refund`, data)
}

export function getOrderStatistics(params: { startTime?: string; endTime?: string }): Promise<ApiResponse<unknown>> {
  return request.get('/order/statistics', { params })
}

export function createOrder(data: Partial<Order>): Promise<ApiResponse<Order>> {
  return request.post<Order>('/order/create', data)
}

export function updateOrder(id: number, data: Partial<Order>): Promise<ApiResponse<Order>> {
  return request.put<Order>(`/order/${id}`, data)
}

export function deleteOrder(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`/order/${id}`)
}

export function batchDeleteOrder(ids: number[]): Promise<ApiResponse<null>> {
  return request.post<null>('/order/batchDelete', { ids })
}
