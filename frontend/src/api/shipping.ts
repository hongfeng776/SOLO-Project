import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export enum LogisticsStatus {
  PENDING_SHIP = 0,
  PICKED_UP = 1,
  IN_TRANSIT = 2,
  DELIVERING = 3,
  SIGNED = 4,
  SIGN_ABNORMAL = 5,
  RETURNED = 6,
}

export enum ShippingAbnormalType {
  NORMAL = 0,
  ADDRESS_ERROR = 1,
  STAGNANT = 2,
  REFUSED = 3,
  DAMAGED = 4,
}

export enum AbnormalLogisticsType {
  ADDRESS_ERROR = 1,
  STAGNANT = 2,
  REFUSED = 3,
  DAMAGED = 4,
  LOST = 5,
}

export enum AbnormalLevel {
  MINOR = 1,
  NORMAL = 2,
  SEVERE = 3,
}

export enum AbnormalHandleStatus {
  PENDING = 0,
  PROCESSING = 1,
  HANDLED = 2,
  CLOSED = 3,
}

export enum ProviderStatus {
  DISABLED = 0,
  ENABLED = 1,
}

export interface LogisticsProvider {
  id: number
  providerCode: string
  providerName: string
  contactPerson?: string
  contactPhone?: string
  apiUrl?: string
  status: number
  supportArea?: any
  freightTemplate?: any
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface ShipmentRecord {
  id: number
  shipmentNo: string
  orderId: number
  orderNo: string
  merchantId: number
  merchantName?: string
  userId: number
  logisticsProviderId: number
  logisticsProviderName?: string
  logisticsNo: string
  logisticsCompany?: string
  receiverName?: string
  receiverPhone?: string
  receiverProvince?: string
  receiverCity?: string
  receiverDistrict?: string
  receiverAddress?: string
  goodsList?: any
  packageCount?: number
  packageWeight?: number
  freightAmount?: number
  actualFreight?: number
  insuranceAmount?: number
  status: number
  abnormalFlag: number
  abnormalReason?: string
  shippedAt?: string
  signedAt?: string
  signerName?: string
  operatorId?: number
  operatorName?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface LogisticsTrack {
  id: number
  trackNo: string
  shipmentId: number
  shipmentNo: string
  orderId: number
  orderNo: string
  logisticsProviderId: number
  logisticsNo: string
  trackStatus: number
  location?: string
  province?: string
  city?: string
  district?: string
  description: string
  operator?: string
  operatorPhone?: string
  trackTime: string
  isAbnormal: number
  abnormalType?: string
  abnormalDesc?: string
  source: number
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface AbnormalLogisticsLog {
  id: number
  logNo: string
  shipmentId: number
  shipmentNo: string
  orderId: number
  orderNo: string
  logisticsNo?: string
  abnormalType: number
  abnormalLevel: number
  abnormalDesc: string
  status: number
  handleResult?: string
  handleMethod?: string
  operatorId?: number
  operatorName?: string
  reportedAt?: string
  handledAt?: string
  closedAt?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface ShippingValidateResult {
  valid: boolean
  errorCode?: string
  errorMessage?: string
  field?: string
}

export interface ShippingVerifyData {
  orderId: number
  logisticsProviderId: number
  logisticsNo: string
  logisticsCompany?: string
  receiverName?: string
  receiverPhone?: string
  receiverProvince?: string
  receiverCity?: string
  receiverDistrict?: string
  receiverAddress?: string
}

export interface ShipOrderData {
  orderId: number
  logisticsProviderId: number
  logisticsProviderName: string
  logisticsNo: string
  logisticsCompany: string
  freightAmount?: number
  packageCount?: number
  packageWeight?: number
  insuranceAmount?: number
  remark?: string
  operatorId?: number
  operatorName?: string
}

export interface UpdateLogisticsStatusData {
  orderId: number
  shipmentId?: number
  logisticsStatus: number
  description?: string
  location?: string
  trackTime?: string
  operatorId?: number
  operatorName?: string
}

export interface ShippingSyncResult {
  success: boolean
  orderStatus?: number
  shipmentId?: number
  errorMessage?: string
}

export interface LogisticsQueryParams extends PageParams {
  orderNo?: string
  logisticsNo?: string
  logisticsProviderId?: number
  logisticsStatus?: number
  shippingStatus?: number
  abnormalFlag?: number
  startTime?: string
  endTime?: string
  startShippedAt?: string
  endShippedAt?: string
  merchantId?: number
  userId?: number
  receiverProvince?: string
  receiverCity?: string
  isAbnormal?: number
  isSigned?: number
  ids?: number[]
}

export interface BatchShipItem {
  orderId: number
  logisticsProviderId: number
  logisticsNo: string
  logisticsCompany?: string
}

export interface BatchOperationResult {
  success: boolean
  total: number
  successCount: number
  failCount: number
  messages?: string[]
}

export interface LogisticsTraceData {
  shipmentRecord: ShipmentRecord | null
  orderInfo: any
  userInfo: any
  merchantInfo: any
  logisticsProvider: LogisticsProvider | null
  logisticsTracks: LogisticsTrack[]
  abnormalLogs: AbnormalLogisticsLog[]
  orderLogs: any[]
}

export interface LogisticsValidationReport {
  orderMatch: boolean
  logisticsNoValid: boolean
  providerValid: boolean
  trackContinuity: boolean
  noDuplicate: boolean
  addressMatch: boolean
  overallScore: number
  issues: string[]
}

export const LogisticsStatusMap: Record<number, string> = {
  [LogisticsStatus.PENDING_SHIP]: '待发货',
  [LogisticsStatus.PICKED_UP]: '已揽收',
  [LogisticsStatus.IN_TRANSIT]: '运输中',
  [LogisticsStatus.DELIVERING]: '派送中',
  [LogisticsStatus.SIGNED]: '已签收',
  [LogisticsStatus.SIGN_ABNORMAL]: '签收异常',
  [LogisticsStatus.RETURNED]: '已退回',
}

export const ShippingAbnormalMap: Record<number, string> = {
  [ShippingAbnormalType.NORMAL]: '正常',
  [ShippingAbnormalType.ADDRESS_ERROR]: '地址异常',
  [ShippingAbnormalType.STAGNANT]: '物流停滞',
  [ShippingAbnormalType.REFUSED]: '拒收',
  [ShippingAbnormalType.DAMAGED]: '破损',
}

export const AbnormalLogisticsTypeMap: Record<number, string> = {
  [AbnormalLogisticsType.ADDRESS_ERROR]: '地址异常',
  [AbnormalLogisticsType.STAGNANT]: '物流停滞',
  [AbnormalLogisticsType.REFUSED]: '拒收',
  [AbnormalLogisticsType.DAMAGED]: '破损',
  [AbnormalLogisticsType.LOST]: '丢件',
}

export const AbnormalLevelMap: Record<number, string> = {
  [AbnormalLevel.MINOR]: '轻微',
  [AbnormalLevel.NORMAL]: '一般',
  [AbnormalLevel.SEVERE]: '严重',
}

export const AbnormalHandleStatusMap: Record<number, string> = {
  [AbnormalHandleStatus.PENDING]: '待处理',
  [AbnormalHandleStatus.PROCESSING]: '处理中',
  [AbnormalHandleStatus.HANDLED]: '已处理',
  [AbnormalHandleStatus.CLOSED]: '已关闭',
}

export const ProviderStatusMap: Record<number, string> = {
  [ProviderStatus.DISABLED]: '停用',
  [ProviderStatus.ENABLED]: '启用',
}

export const TrackStatusMap: Record<number, string> = {
  1: '已揽收',
  2: '运输中',
  3: '派送中',
  4: '已签收',
  5: '异常',
  6: '退回',
}

export function verifyShipping(data: ShippingVerifyData): Promise<ApiResponse<ShippingValidateResult[]>> {
  return request.post<ShippingValidateResult[]>('/shippingValidate/verify', data)
}

export function validateShippingPayment(orderId: number): Promise<ApiResponse<ShippingValidateResult>> {
  return request.get<ShippingValidateResult>(`/shippingValidate/validate/payment/${orderId}`)
}

export function validateShippingStock(orderId: number): Promise<ApiResponse<ShippingValidateResult>> {
  return request.get<ShippingValidateResult>(`/shippingValidate/validate/stock/${orderId}`)
}

export function validateShippingProvider(providerId: number): Promise<ApiResponse<ShippingValidateResult>> {
  return request.get<ShippingValidateResult>(`/shippingValidate/validate/provider/${providerId}`)
}

export function validateShippingAddress(data: {
  receiverProvince?: string
  receiverCity?: string
  receiverDistrict?: string
  receiverAddress?: string
  receiverPhone?: string
  receiverName?: string
}): Promise<ApiResponse<ShippingValidateResult>> {
  return request.post<ShippingValidateResult>('/shippingValidate/validate/address', data)
}

export function validateLogisticsNoFormat(data: { logisticsNo: string; providerId?: number }): Promise<ApiResponse<ShippingValidateResult>> {
  return request.post<ShippingValidateResult>('/shippingValidate/validate/logistics-no', data)
}

export function checkDuplicateLogisticsNo(data: { logisticsNo: string; excludeOrderId?: number }): Promise<ApiResponse<ShippingValidateResult>> {
  return request.post<ShippingValidateResult>('/shippingValidate/check-duplicate', data)
}

export function shipOrder(data: ShipOrderData): Promise<ApiResponse<ShippingSyncResult>> {
  return request.post<ShippingSyncResult>('/shippingValidate/ship', data)
}

export function updateLogisticsStatus(data: UpdateLogisticsStatusData): Promise<ApiResponse<ShippingSyncResult>> {
  return request.put<ShippingSyncResult>('/shippingValidate/status', data)
}

export function getLogisticsProviderList(): Promise<ApiResponse<LogisticsProvider[]>> {
  return request.get<LogisticsProvider[]>('/shippingValidate/providers')
}

export function getShipmentList(params: LogisticsQueryParams): Promise<ApiResponse<PageResult<ShipmentRecord>>> {
  return request.get<PageResult<ShipmentRecord>>('/logisticsBatch/list', { params })
}

export function getFilteredShipmentIds(params: LogisticsQueryParams): Promise<ApiResponse<{ ids: number[]; count: number }>> {
  return request.post<{ ids: number[]; count: number }>('/logisticsBatch/filtered-ids', params)
}

export function batchShipOrder(items: BatchShipItem[]): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/logisticsBatch/batch-ship', { items })
}

export function batchUpdateAbnormalStatus(params: LogisticsQueryParams & {
  abnormalFlag: number
  abnormalReason?: string
}): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/logisticsBatch/batch-abnormal', params)
}

export function batchResendLogisticsNotification(params: LogisticsQueryParams): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/logisticsBatch/batch-resend', params)
}

export function batchImportShipment(items: BatchShipItem[]): Promise<ApiResponse<BatchOperationResult & { errors?: Array<{ row: number; orderId: number; reason: string }> }>> {
  return request.post<BatchOperationResult & { errors?: Array<{ row: number; orderId: number; reason: string }> }>('/logisticsBatch/batch-import', { items })
}

export function getLogisticsTraceByOrderId(orderId: number): Promise<ApiResponse<LogisticsTraceData>> {
  return request.get<LogisticsTraceData>(`/logisticsTrace/order/${orderId}`)
}

export function getLogisticsTraceByShipmentId(shipmentId: number): Promise<ApiResponse<LogisticsTraceData>> {
  return request.get<LogisticsTraceData>(`/logisticsTrace/shipment/${shipmentId}`)
}

export function getLogisticsTraceByNo(logisticsNo: string): Promise<ApiResponse<LogisticsTraceData>> {
  return request.get<LogisticsTraceData>(`/logisticsTrace/no/${logisticsNo}`)
}

export function validateLogisticsData(orderId: number): Promise<ApiResponse<LogisticsValidationReport>> {
  return request.get<LogisticsValidationReport>(`/logisticsTrace/validate/${orderId}`)
}

export function checkLogisticsMatch(orderId: number): Promise<ApiResponse<boolean>> {
  return request.get<boolean>(`/logisticsTrace/match/${orderId}`)
}

export function getLogisticsTracks(shipmentId: number): Promise<ApiResponse<LogisticsTrack[]>> {
  return request.get<LogisticsTrack[]>(`/logisticsTrace/tracks/${shipmentId}`)
}

export function getAbnormalLogisticsLogs(shipmentId: number): Promise<ApiResponse<AbnormalLogisticsLog[]>> {
  return request.get<AbnormalLogisticsLog[]>(`/logisticsTrace/abnormal/${shipmentId}`)
}
