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

export interface StatusTransitionValidation {
  valid: boolean
  message?: string
  fromStatus: DistributionOrderStatus
  toStatus: DistributionOrderStatus
  requiresReason: boolean
  commissionImpact: boolean
  warnings: string[]
}

export interface StatusTransitionResult {
  success: boolean
  orderId: string
  fromStatus: DistributionOrderStatus
  toStatus: DistributionOrderStatus
  commissionAffected: boolean
  commissionChangeAmount: number
  promoterSynced: boolean
  channelSynced: boolean
  message: string
}

export interface BatchStatusCheckResult {
  totalCount: number
  abnormalCount: number
  pendingReviewCount: number
  normalFulfillmentCount: number
  filteredIds: string[]
  filterReason: string
}

export interface BatchConfirmAbnormalResult {
  results: StatusTransitionResult[]
  summary: {
    total: number
    successCount: number
    failCount: number
  }
}

export interface StatusChangeLogItem {
  id: string
  orderId: string
  orderNo: string
  fromStatus: DistributionOrderStatus
  toStatus: DistributionOrderStatus
  reason?: string
  operatorId: string
  operatorName: string
  commissionAffected: boolean
  commissionChangeAmount?: number
  promoterId?: string
  channelId?: string
  relatedDataChanges?: any
  ip?: string
  userAgent?: string
  createdAt: string
}

export interface ComplianceValidationResult {
  compliant: boolean
  issues: string[]
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

export function validateStatusTransition(params: {
  orderId: string
  fromStatus: number
  toStatus: number
}): Promise<StatusTransitionValidation> {
  return post<StatusTransitionValidation>('/distribution-orders/validate-transition', params)
}

export function changeOrderStatus(params: {
  orderId: string
  toStatus: number
  reason?: string
}): Promise<StatusTransitionResult> {
  return post<StatusTransitionResult>('/distribution-orders/change-status', params)
}

export function batchVerifyStatus(ids: string[]): Promise<BatchStatusCheckResult> {
  return post<BatchStatusCheckResult>('/distribution-orders/batch-verify-status', { ids })
}

export function batchConfirmAbnormal(params: {
  ids: string[]
  reason?: string
}): Promise<BatchConfirmAbnormalResult> {
  return post<BatchConfirmAbnormalResult>('/distribution-orders/batch-confirm-abnormal', params)
}

export function getStatusChangeLog(params: {
  orderId: string
  page?: number
  pageSize?: number
}): Promise<PageResult<StatusChangeLogItem>> {
  return get<PageResult<StatusChangeLogItem>>('/distribution-orders/status-change-logs', params)
}

export function validateChangeCompliance(params: {
  orderId: string
  fromStatus: number
  toStatus: number
}): Promise<ComplianceValidationResult> {
  return post<ComplianceValidationResult>('/distribution-orders/validate-compliance', params)
}

export type OrderAbnormalType =
  | 'fake_order'
  | 'brush_order'
  | 'timeout_unpaid'
  | 'refund_abnormal'
  | 'data_mismatch'
  | 'abnormal_device'
  | 'abnormal_ip'
  | 'repeat_purchase'
  | 'other'

export type OrderAbnormalSeverity = 'low' | 'medium' | 'high' | 'critical'

export type OrderAbnormalStatus = 0 | 1 | 2 | 3

export type OrderAbnormalSource =
  | 'system_auto'
  | 'rule_engine'
  | 'manual_mark'
  | 'batch_import'
  | 'third_party'

export type OrderAbnormalReviewAction = 'release' | 'reject' | 'observe'

export interface AbnormalEvidenceItem {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  uploadedAt: string
}

export interface AbnormalRootCauseItem {
  category: 'promoter' | 'channel' | 'system' | 'user' | 'product' | 'other'
  description: string
  relatedIds?: string[]
  confidence: number
  evidence?: string
}

export interface AbnormalRecordItem {
  id: string
  orderId: string
  orderNo: string
  abnormalTypes: OrderAbnormalType[]
  severity: OrderAbnormalSeverity
  status: OrderAbnormalStatus
  source: OrderAbnormalSource
  title: string
  description?: string
  evidence?: any
  isLocked: boolean
  autoSettleBlocked: boolean
  promoterId?: string
  channelId?: string
  commissionAmount?: number
  commissionBlocked?: boolean
  detectedAt: string
  detectedBy?: string
  rootCauses?: AbnormalRootCauseItem[]
  reviewAction?: OrderAbnormalReviewAction
  reviewConclusion?: string
  reviewerId?: string
  reviewerName?: string
  reviewedAt?: string
  relatedDataChanges?: any
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface AbnormalDetectionResult {
  detected: boolean
  types: OrderAbnormalType[]
  severity: OrderAbnormalSeverity
  evidence: any
  rootCauses: AbnormalRootCauseItem[]
  record?: AbnormalRecordItem
}

export interface AbnormalReviewResult {
  success: boolean
  orderId: string
  abnormalRecordId: string
  action: OrderAbnormalReviewAction
  orderStatusUpdated: boolean
  commissionStatus: number | null
  commissionChangeAmount: number
  promoterSynced: boolean
  channelSynced: boolean
  message: string
}

export interface BatchAbnormalProcessResult {
  total: number
  successCount: number
  failCount: number
  results: Array<{
    abnormalRecordId: string
    orderId: string
    success: boolean
    reason?: string
  }>
  reportUrl?: string
  generatedAt: string
}

export interface AbnormalRootCauseAnalysis {
  orderId: string
  abnormalTypes: OrderAbnormalType[]
  rootCauses: AbnormalRootCauseItem[]
  promoterRelatedAbnormals: number
  channelRelatedAbnormals: number
  suggestions: string[]
  riskOptimizations: string[]
}

export interface AbnormalStatistics {
  total: number
  pending: number
  reviewing: number
  resolved: number
  rejected: number
  locked: number
  bySeverity: Record<string, number>
  byType: Record<string, number>
}

export function detectOrderAbnormal(orderId: string): Promise<AbnormalDetectionResult> {
  return post<AbnormalDetectionResult>('/distribution-orders/detect-abnormal', { orderId })
}

export function createManualAbnormal(params: {
  orderId: string
  abnormalTypes: OrderAbnormalType[]
  severity?: OrderAbnormalSeverity
  title: string
  description?: string
}): Promise<AbnormalRecordItem> {
  return post<AbnormalRecordItem>('/distribution-orders/manual-abnormal', params)
}

export function reviewOrderAbnormal(params: {
  abnormalRecordId: string
  action: OrderAbnormalReviewAction
  conclusion: string
  evidences?: AbnormalEvidenceItem[]
}): Promise<AbnormalReviewResult> {
  return post<AbnormalReviewResult>('/distribution-orders/review-abnormal', params)
}

export function batchProcessAbnormal(params: {
  abnormalRecordIds: string[]
  action: OrderAbnormalReviewAction
  conclusion: string
  evidences?: AbnormalEvidenceItem[]
}): Promise<BatchAbnormalProcessResult> {
  return post<BatchAbnormalProcessResult>('/distribution-orders/batch-process-abnormal', params)
}

export function getAbnormalRecords(params: {
  page: number
  pageSize: number
  orderNo?: string
  abnormalType?: OrderAbnormalType
  severity?: OrderAbnormalSeverity
  status?: OrderAbnormalStatus
  promoterId?: string
  channelId?: string
  isLocked?: boolean
  startTime?: string
  endTime?: string
}): Promise<PageResult<AbnormalRecordItem>> {
  return get<PageResult<AbnormalRecordItem>>('/distribution-orders/abnormal-records', params)
}

export function getAbnormalStatistics(params?: {
  startTime?: string
  endTime?: string
}): Promise<AbnormalStatistics> {
  return get<AbnormalStatistics>('/distribution-orders/abnormal-statistics', params)
}

export function getAbnormalEvidences(abnormalRecordId: string): Promise<AbnormalEvidenceItem[]> {
  return get<AbnormalEvidenceItem[]>(`/distribution-orders/abnormal-evidences/${abnormalRecordId}`)
}

export function getAbnormalRootCause(orderId: string): Promise<AbnormalRootCauseAnalysis> {
  return get<AbnormalRootCauseAnalysis>(`/distribution-orders/abnormal-root-cause/${orderId}`)
}
