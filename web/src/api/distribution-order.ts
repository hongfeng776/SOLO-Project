import { get, post } from '@/utils/axios'
import type { PageParams, PageResult, BaseEntity } from '@/types'

export type DistributionOrderStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface DistributionOrderItem extends BaseEntity {
  orderNo: string
  channelId?: string
  channelName?: string
  promoterId?: string
  promoterName?: string
  promoterCode?: string
  productName: string
  productSku?: string
  productImage?: string
  unitPrice: number
  quantity: number
  totalAmount: number
  discountAmount?: number
  payAmount: number
  commissionRate?: number
  commissionAmount?: number
  status: DistributionOrderStatus
  payTime?: string
  shipTime?: string
  completeTime?: string
  cancelTime?: string
  cancelReason?: string
  refundAmount?: number
  remark?: string
  receiverName?: string
  receiverPhone?: string
  receiverAddress?: string
  isAbnormal: boolean
  isPendingReview: boolean
  isUnsettled: boolean
  commission?: {
    id: string
    status: number
    amount: number
    settleTime?: string
  }
}

export interface DistributionOrderQueryParams extends PageParams {
  orderNo?: string
  channelId?: string
  promoterId?: string
  productId?: string
  productName?: string
  status?: DistributionOrderStatus | DistributionOrderStatus[]
  isAbnormal?: boolean
  isPendingReview?: boolean
  isUnsettled?: boolean
  startTime?: string
  endTime?: string
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface OrderStatusStatistics {
  status: DistributionOrderStatus
  count: number
  amount: number
}

export interface DistributionOrderStatistics {
  total: number
  totalAmount: number
  totalCommission: number
  statusBreakdown: OrderStatusStatistics[]
  abnormalCount: number
  pendingReviewCount: number
  unsettledCount: number
}

export interface BatchStatistics {
  totalCount: number
  totalAmount: number
  totalCommission: number
  statusBreakdown: OrderStatusStatistics[]
  abnormalCount: number
  unsettledCount: number
}

export interface QueryValidationResult {
  valid: boolean
  message?: string
  needsConfirmation?: boolean
  confirmationType?: 'time_range' | 'large_result'
}

export interface QueryLogItem extends BaseEntity {
  userId: string
  userName: string
  queryConditions: any
  resultCount: number
  queryDuration: number
  ip: string
  userAgent?: string
}

export interface ExportParams extends DistributionOrderQueryParams {
  fields?: string[]
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface BatchMarkParams {
  ids: (string | number)[]
  remark?: string
}

export function getDistributionOrderList(
  params: DistributionOrderQueryParams
): Promise<PageResult<DistributionOrderItem>> {
  return get<PageResult<DistributionOrderItem>>('/distribution-orders', params)
}

export function validateDistributionOrderQuery(
  params: DistributionOrderQueryParams
): Promise<QueryValidationResult> {
  return get<QueryValidationResult>('/distribution-orders/validate', params)
}

export function getDistributionOrderStatistics(
  params: DistributionOrderQueryParams
): Promise<DistributionOrderStatistics> {
  return get<DistributionOrderStatistics>('/distribution-orders/statistics', params)
}

export function checkExportPermission(): Promise<{ hasPermission: boolean }> {
  return get<{ hasPermission: boolean }>('/distribution-orders/export/permission')
}

export function exportDistributionOrders(params: ExportParams): Promise<any[]> {
  return get<any[]>('/distribution-orders/export', params)
}

export function getDistributionOrderQueryLogs(
  params: PageParams & { userId?: string; startTime?: string; endTime?: string }
): Promise<PageResult<QueryLogItem>> {
  return get<PageResult<QueryLogItem>>('/distribution-orders/query-logs', params)
}

export function batchMarkOrders(params: BatchMarkParams): Promise<{ count: number; orders: any[] }> {
  return post<{ count: number; orders: any[] }>('/distribution-orders/batch-mark', params)
}

export function getBatchStatistics(ids: (string | number)[]): Promise<BatchStatistics> {
  return post<BatchStatistics>('/distribution-orders/batch-statistics', { ids })
}
