import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

export interface OrderFlowLog {
  id: number
  orderId: number
  orderNo: string
  action: string
  operator: string
  operatorId: number
  operatorRole: string
  remark: string
  createdAt: string
}

export interface OrderFlowDetail {
  id: number
  orderNo: string
  userId: number
  username: string
  totalAmount: number
  payAmount: number
  status: number
  statusName: string
  payStatus: number
  payStatusName: string
  logisticsStatus: number
  logisticsStatusName: string
  payTime?: string
  shipTime?: string
  receiveTime?: string
  completeTime?: string
  cancelTime?: string
  logisticsCompany?: string
  logisticsNo?: string
  cancelReason?: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  items: OrderFlowItem[]
  logs: OrderFlowLog[]
}

export interface OrderFlowItem {
  id: number
  goodsId: number
  goodsName: string
  goodsImage: string
  specInfo: string
  price: number
  quantity: number
  subtotal: number
}

export interface CreateOrderParams {
  userId: number
  merchantId: number
  items: { goodsId: number; specId?: number; quantity: number }[]
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  remark?: string
  couponId?: number
}

export interface ShipOrderParams {
  logisticsCompany: string
  logisticsNo: string
  remark?: string
}

export interface CancelOrderParams {
  reason: string
  remark?: string
}

export function createOrder(data: CreateOrderParams): Promise<ApiResponse<{ orderId: number; orderNo: string }>> {
  return request.post('/orderFlow/create', data)
}

export function payOrder(id: number, data?: { payMethod?: string }): Promise<ApiResponse<null>> {
  return request.put(`/orderFlow/${id}/pay`, data)
}

export function shipOrder(id: number, data: ShipOrderParams): Promise<ApiResponse<null>> {
  return request.put(`/orderFlow/${id}/ship`, data)
}

export function receiveOrder(id: number): Promise<ApiResponse<null>> {
  return request.put(`/orderFlow/${id}/receive`)
}

export function completeOrder(id: number): Promise<ApiResponse<null>> {
  return request.put(`/orderFlow/${id}/complete`)
}

export function cancelOrder(id: number, data: CancelOrderParams): Promise<ApiResponse<null>> {
  return request.put(`/orderFlow/${id}/cancel`, data)
}

export function getOrderFlowLogs(orderId: number): Promise<ApiResponse<OrderFlowLog[]>> {
  return request.get(`/orderFlow/${orderId}/logs`)
}

export function getOrderFlowDetail(id: number): Promise<ApiResponse<OrderFlowDetail>> {
  return request.get(`/orderFlow/${id}/detail`)
}
