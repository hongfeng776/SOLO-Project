import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export interface Order {
  id: number
  orderNo: string
  userId: number
  merchantId: number
  merchantName?: string
  totalAmount: number
  payAmount: number
  freightAmount: number
  discountAmount: number
  payType: number
  status: number
  payStatus: number
  payTime?: string
  shippingStatus: number
  logisticsCompany?: string
  logisticsNo?: string
  receiverName: string
  receiverPhone: string
  receiverProvince: string
  receiverCity: string
  receiverDistrict: string
  receiverAddress: string
  remark?: string
  isException: number
  exceptionReason?: string
  exceptionFields?: string[]
  isArchived: number
  createdAt: string
  updatedAt: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: number
  orderId: number
  goodsId: number
  goodsName: string
  goodsImage?: string
  specInfo?: string
  price: number
  quantity: number
  subtotal: number
}

export interface OrderCreateData {
  orderNo: string
  userId: number
  merchantId: number
  items: OrderItemData[]
  totalAmount: number
  payAmount: number
  freightAmount?: number
  discountAmount?: number
  payType: number
  receiverName: string
  receiverPhone: string
  receiverProvince: string
  receiverCity: string
  receiverDistrict: string
  receiverAddress: string
  remark?: string
}

export interface OrderItemData {
  goodsId: number
  goodsName: string
  goodsImage?: string
  specInfo?: string
  price: number
  quantity: number
  subtotal: number
}

export interface OrderUpdateData {
  remark?: string
  receiverName?: string
  receiverPhone?: string
  receiverProvince?: string
  receiverCity?: string
  receiverDistrict?: string
  receiverAddress?: string
  logisticsCompany?: string
  logisticsNo?: string
}

export interface ValidationError {
  valid: boolean
  exceptionType?: number
  reason?: string
  fields?: string[]
}

export interface OrderCreateResult {
  success: boolean
  order?: Order
  validationErrors?: ValidationError[]
}

export interface EditOrderResult {
  success: boolean
  order?: Order
  error?: string
  forbiddenFields?: string[]
}

export interface BatchQueryParams extends PageParams {
  orderNo?: string
  payType?: number
  status?: number
  startTime?: string
  endTime?: string
  minAmount?: number
  maxAmount?: number
  isException?: number
  isArchived?: number
  merchantId?: number
  userId?: number
}

export interface BatchRemindResult {
  success: number
  failed: number
  total: number
  details: Array<{ id: number; orderNo: string; success: boolean; message?: string }>
}

export interface BatchResult {
  success: number
  failed: number
  total: number
}

export interface PaymentFlow {
  id: number
  flowNo: string
  orderId: number
  orderNo: string
  userId: number
  amount: number
  payType: number
  payStatus: number
  transactionId?: string
  payTime?: string
  remark?: string
  createdAt: string
}

export interface GoodsSnapshot {
  id: number
  snapshotNo: string
  orderId: number
  goodsId: number
  skuCode: string
  name: string
  price: number
  originalPrice?: number
  stock: number
  coverImage?: string
  specInfo?: string
  createdAt: string
}

export interface MerchantOrderRecord {
  id: number
  orderId: number
  orderNo: string
  merchantId: number
  merchantName: string
  operatorId: number
  operatorName: string
  action: number
  reason?: string
  acceptTime?: string
  createdAt: string
}

export interface OrderException {
  id: number
  orderId: number
  orderNo: string
  type: number
  reason?: string
  fields?: string[]
  status: number
  handlerId?: number
  handleTime?: string
  handleRemark?: string
  createdAt: string
}

export interface OrderLog {
  id: number
  orderId: number
  action: string
  operator: string
  remark?: string
  createdAt: string
}

export interface OrderTraceData {
  order: Order
  items: OrderItem[]
  user: { id: number; username: string; phone?: string }
  merchant: { id: number; name: string; contact?: string; phone?: string }
  paymentFlows: PaymentFlow[]
  goodsSnapshots: GoodsSnapshot[]
  merchantRecords: MerchantOrderRecord[]
  exceptions: OrderException[]
  orderLogs: OrderLog[]
}

export interface OrderValidationReport {
  duplicateCheck: { passed: boolean; message: string }
  amountCheck: { passed: boolean; message: string }
  fieldCheck: { passed: boolean; message: string; invalidFields: string[] }
  overall: { passed: boolean; totalChecks: number; passedChecks: number }
}

export function getOrderList(params: BatchQueryParams): Promise<ApiResponse<PageResult<Order>>> {
  return request.get<PageResult<Order>>('/order/list', { params })
}

export function getOrderDetail(id: number): Promise<ApiResponse<Order>> {
  return request.get<Order>(`/order/${id}`)
}

export function getOrderDetailWithItems(id: number): Promise<ApiResponse<{ order: Order; items: OrderItem[] }>> {
  return request.get<{ order: Order; items: OrderItem[] }>(`/order/${id}/items`)
}

export function createOrder(data: OrderCreateData): Promise<ApiResponse<OrderCreateResult>> {
  return request.post<OrderCreateResult>('/order/create', data)
}

export function updateOrder(id: number, data: OrderUpdateData): Promise<ApiResponse<EditOrderResult>> {
  return request.put<EditOrderResult>(`/order/${id}`, data)
}

export function updateOrderStatus(id: number, status: number): Promise<ApiResponse<EditOrderResult>> {
  return request.put<EditOrderResult>(`/order/${id}/status`, { status })
}

export function shipOrder(id: number, data: { logisticsCompany: string; logisticsNo: string }): Promise<ApiResponse<EditOrderResult>> {
  return request.put<EditOrderResult>(`/order/${id}/ship`, data)
}

export function completeOrder(id: number): Promise<ApiResponse<EditOrderResult>> {
  return request.put<EditOrderResult>(`/order/${id}/complete`)
}

export function cancelOrder(id: number, reason?: string): Promise<ApiResponse<EditOrderResult>> {
  return request.put<EditOrderResult>(`/order/${id}/cancel`, { reason })
}

export function deleteOrder(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`/order/${id}`)
}

export function batchDeleteOrder(ids: number[]): Promise<ApiResponse<{ count: number }>> {
  return request.post<{ count: number }>('/order/batchDelete', { ids })
}

export function createOrderWithValidation(data: OrderCreateData): Promise<ApiResponse<OrderCreateResult>> {
  return request.post<OrderCreateResult>('/orderValidate/create', data)
}

export function validateOrderBeforeCreate(data: OrderCreateData): Promise<ApiResponse<{ valid: boolean; errors: ValidationError[] }>> {
  return request.post<{ valid: boolean; errors: ValidationError[] }>('/orderValidate/preValidate', data)
}

export function getExceptionList(params: PageParams & { status?: number; type?: number; startTime?: string; endTime?: string }): Promise<ApiResponse<PageResult<OrderException>>> {
  return request.get<PageResult<OrderException>>('/orderValidate/exceptions', { params })
}

export function handleException(id: number, data: { status: number; handleRemark?: string }): Promise<ApiResponse<OrderException>> {
  return request.put<OrderException>(`/orderValidate/exception/${id}/handle`, data)
}

export function getBatchOrderList(params: BatchQueryParams): Promise<ApiResponse<PageResult<Order>>> {
  return request.get<PageResult<Order>>('/orderBatch/list', { params })
}

export function batchRemind(ids: number[]): Promise<ApiResponse<BatchRemindResult>> {
  return request.post<BatchRemindResult>('/orderBatch/remind', { ids })
}

export function batchMarkException(ids: number[]): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/orderBatch/markException', { ids })
}

export function batchArchive(ids: number[]): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/orderBatch/archive', { ids })
}

export function batchRemindByQuery(params: BatchQueryParams): Promise<ApiResponse<BatchRemindResult>> {
  return request.post<BatchRemindResult>('/orderBatch/remindByQuery', params)
}

export function batchMarkExceptionByQuery(params: BatchQueryParams): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/orderBatch/markExceptionByQuery', params)
}

export function batchArchiveByQuery(params: BatchQueryParams): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>('/orderBatch/archiveByQuery', params)
}

export function getOrderTrace(id: number): Promise<ApiResponse<OrderTraceData>> {
  return request.get<OrderTraceData>(`/orderTrace/${id}/trace`)
}

export function validateOrderData(id: number): Promise<ApiResponse<OrderValidationReport>> {
  return request.get<OrderValidationReport>(`/orderTrace/${id}/validate`)
}

export function getOrderStatistics(id: number): Promise<ApiResponse<unknown>> {
  return request.get(`/orderTrace/${id}/statistics`)
}

export function getUserOrderHistory(userId: number, limit?: number): Promise<ApiResponse<PageResult<Order>>> {
  return request.get<PageResult<Order>>(`/orderTrace/user/${userId}/history`, { params: { limit } })
}

export function getPaymentFlows(orderId: number): Promise<ApiResponse<PaymentFlow[]>> {
  return request.get<PaymentFlow[]>(`/orderTrace/${orderId}/paymentFlows`)
}

export function getGoodsSnapshots(orderId: number): Promise<ApiResponse<GoodsSnapshot[]>> {
  return request.get<GoodsSnapshot[]>(`/orderTrace/${orderId}/goodsSnapshots`)
}

export function getMerchantOrderRecords(orderId: number): Promise<ApiResponse<MerchantOrderRecord[]>> {
  return request.get<MerchantOrderRecord[]>(`/orderTrace/${orderId}/merchantRecords`)
}

export function getOrderLogs(orderId: number): Promise<ApiResponse<OrderLog[]>> {
  return request.get<OrderLog[]>(`/orderTrace/${orderId}/logs`)
}
