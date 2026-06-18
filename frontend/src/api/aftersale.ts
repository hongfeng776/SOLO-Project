import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export enum AfterSaleType {
  REFUND = 1,
  RETURN_REFUND = 2,
  EXCHANGE = 3,
  REPAIR = 4,
}

export enum AfterSaleStatus {
  PENDING = 0,
  AUDIT_PASS = 1,
  PROCESSING = 2,
  COMPLETED = 3,
  REJECTED = 4,
  CANCELLED = 5,
  CLOSED = 6,
}

export enum CancelScene {
  NONE = 0,
  ACTIVE = 1,
  TIMEOUT = 2,
  VIOLATION = 3,
}

export enum TerminateType {
  NONE = 0,
  ACTIVE_CANCEL = 1,
  TIMEOUT_CANCEL = 2,
  VIOLATION_CANCEL = 3,
  AFTER_SALE_TERMINATE = 4,
}

export enum RefundStatus {
  NONE = 0,
  REFUNDING = 1,
  REFUNDED = 2,
  REFUND_REJECTED = 3,
}

export enum StockRollbackStatus {
  NONE = 0,
  DONE = 1,
  FAILED = 2,
}

export interface AfterSaleRecord {
  id: number
  afterSaleNo: string
  orderId: number
  orderNo: string
  userId: number
  merchantId: number
  merchantName?: string
  type: number
  status: number
  reason?: string
  amount?: number
  orderPayAmount?: number
  applyCount?: number
  cancelScene?: number
  items?: any
  evidenceImages?: string
  deadline?: string
  stockRollbackStatus?: number
  settleDeductAmount?: number
  pointsRollback?: number
  handleRemark?: string
  auditedAt?: string
  completedAt?: string
  operatorId?: number
  operatorName?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface AfterSaleValidateResult {
  valid: boolean
  errorCode?: string
  errorMessage?: string
  restrictionRules?: string[]
}

export interface AfterSaleApplyData {
  orderId: number
  userId?: number
  type: number
  reason?: string
  amount?: number
  items?: any
}

export interface ProcessAfterSaleData {
  afterSaleId: number
  action: string
  status: number
  handleRemark?: string
}

export interface CancelOrderData {
  orderId: number
  cancelScene: number
  reason?: string
}

export interface AfterSaleQueryParams extends PageParams {
  orderNo?: string
  afterSaleNo?: string
  afterSaleType?: number
  status?: number
  cancelScene?: number
  userId?: number
  merchantId?: number
  startTime?: string
  endTime?: string
  startCompletedAt?: string
  endCompletedAt?: string
  afterSaleStatus?: number
  terminateType?: number
  refundStatus?: number
  isOverdue?: number
  ids?: number[]
}

export interface AfterSaleLedger {
  id: number
  ledgerNo: string
  afterSaleId: number
  afterSaleNo: string
  orderId: number
  orderNo: string
  userId: number
  merchantId: number
  merchantName?: string
  afterSaleType: number
  cancelScene: number
  refundAmount: number
  stockRollbackItems?: any
  stockRollbackStatus: number
  settleDeductAmount: number
  pointsRollback: number
  orderFinalStatus: number
  processResult?: string
  operatorId?: number
  operatorName?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface AfterSaleOperationLog {
  id: number
  afterSaleId: number
  afterSaleNo: string
  orderId: number
  orderNo: string
  action: string
  actionDesc: string
  oldStatus?: number
  newStatus?: number
  operatorId?: number
  operatorName?: string
  operatorType: number
  detail?: any
  fundChange?: any
  stockChange?: any
  remark?: string
  createdAt: string
}

export interface AfterSaleTraceData {
  afterSale: AfterSaleRecord | null
  orderInfo: any
  userInfo: any
  merchantInfo: any
  operationLogs: AfterSaleOperationLog[]
  ledger: AfterSaleLedger | null
  orderLogs: any[]
  fundSettlements: any[]
}

export interface AfterSaleValidationReport {
  processCompliance: boolean
  dataConsistency: boolean
  noDuplicate: boolean
  fundMatch: boolean
  stockMatch: boolean
  statusConsistency: boolean
  overallScore: number
  issues: string[]
}

export const AfterSaleTypeMap: Record<number, string> = {
  [AfterSaleType.REFUND]: '退款',
  [AfterSaleType.RETURN_REFUND]: '退货退款',
  [AfterSaleType.EXCHANGE]: '换货',
  [AfterSaleType.REPAIR]: '维修',
}

export const AfterSaleStatusMap: Record<number, string> = {
  [AfterSaleStatus.PENDING]: '待审核',
  [AfterSaleStatus.AUDIT_PASS]: '审核通过',
  [AfterSaleStatus.PROCESSING]: '处理中',
  [AfterSaleStatus.COMPLETED]: '已完成',
  [AfterSaleStatus.REJECTED]: '已拒绝',
  [AfterSaleStatus.CANCELLED]: '已取消',
  [AfterSaleStatus.CLOSED]: '已关闭',
}

export const CancelSceneMap: Record<number, string> = {
  [CancelScene.NONE]: '非取消',
  [CancelScene.ACTIVE]: '主动取消',
  [CancelScene.TIMEOUT]: '超时取消',
  [CancelScene.VIOLATION]: '违规取消',
}

export const TerminateTypeMap: Record<number, string> = {
  [TerminateType.NONE]: '未终止',
  [TerminateType.ACTIVE_CANCEL]: '主动取消',
  [TerminateType.TIMEOUT_CANCEL]: '超时取消',
  [TerminateType.VIOLATION_CANCEL]: '违规取消',
  [TerminateType.AFTER_SALE_TERMINATE]: '售后终止',
}

export const RefundStatusMap: Record<number, string> = {
  [RefundStatus.NONE]: '无退款',
  [RefundStatus.REFUNDING]: '退款中',
  [RefundStatus.REFUNDED]: '已退款',
  [RefundStatus.REFUND_REJECTED]: '退款拒绝',
}

export const StockRollbackStatusMap: Record<number, string> = {
  [StockRollbackStatus.NONE]: '未回退',
  [StockRollbackStatus.DONE]: '已回退',
  [StockRollbackStatus.FAILED]: '回退失败',
}

export function applyAfterSale(data: AfterSaleApplyData): Promise<ApiResponse<AfterSaleRecord>> {
  return request.post<AfterSaleRecord>('/afterSaleValidate/apply', data)
}

export function verifyAfterSaleApply(data: AfterSaleApplyData): Promise<ApiResponse<AfterSaleValidateResult[]>> {
  return request.post<AfterSaleValidateResult[]>('/afterSaleValidate/verify', data)
}

export function verifyOrderTerminate(data: CancelOrderData): Promise<ApiResponse<AfterSaleValidateResult[]>> {
  return request.post<AfterSaleValidateResult[]>('/afterSaleValidate/verify-terminate', data)
}

export function cancelOrderApi(data: CancelOrderData): Promise<ApiResponse<any>> {
  return request.post<any>('/afterSaleValidate/cancel', data)
}

export function processAfterSale(data: ProcessAfterSaleData): Promise<ApiResponse<any>> {
  return request.put<any>('/afterSaleValidate/process', data)
}

export function validateAfterSaleDeadline(orderId: number): Promise<ApiResponse<AfterSaleValidateResult>> {
  return request.get<AfterSaleValidateResult>(`/afterSaleValidate/validate/deadline/${orderId}`)
}

export function validateUserCredit(userId: number): Promise<ApiResponse<AfterSaleValidateResult>> {
  return request.get<AfterSaleValidateResult>(`/afterSaleValidate/validate/credit/${userId}`)
}

export function getAfterSaleList(params: AfterSaleQueryParams): Promise<ApiResponse<PageResult<AfterSaleRecord>>> {
  return request.get<PageResult<AfterSaleRecord>>('/afterSaleBatch/list', { params })
}

export function getFilteredAfterSaleIds(params: AfterSaleQueryParams): Promise<ApiResponse<{ ids: number[]; count: number }>> {
  return request.post<{ ids: number[]; count: number }>('/afterSaleBatch/filtered-ids', params)
}

export function batchAuditAfterSale(params: AfterSaleQueryParams & { status: number; remark?: string }): Promise<ApiResponse<{ success: boolean; total: number; successCount: number; failCount: number; messages?: string[] }>> {
  return request.post<any>('/afterSaleBatch/batch-audit', params)
}

export function batchCloseInvalidAfterSale(params: { ids: number[]; reason: string }): Promise<ApiResponse<{ success: boolean; total: number; successCount: number; failCount: number }>> {
  return request.post<any>('/afterSaleBatch/batch-close', params)
}

export function batchArchiveTerminated(params: AfterSaleQueryParams): Promise<ApiResponse<{ success: boolean; total: number; successCount: number; failCount: number }>> {
  return request.post<any>('/afterSaleBatch/batch-archive', params)
}

export function getAfterSaleTrace(afterSaleId: number): Promise<ApiResponse<AfterSaleTraceData>> {
  return request.get<AfterSaleTraceData>(`/afterSaleTrace/${afterSaleId}`)
}

export function getAfterSaleTraceByOrderId(orderId: number): Promise<ApiResponse<AfterSaleTraceData>> {
  return request.get<AfterSaleTraceData>(`/afterSaleTrace/order/${orderId}`)
}

export function getAfterSaleTraceByNo(afterSaleNo: string): Promise<ApiResponse<AfterSaleTraceData>> {
  return request.get<AfterSaleTraceData>(`/afterSaleTrace/no/${afterSaleNo}`)
}

export function validateAfterSaleData(afterSaleId: number): Promise<ApiResponse<AfterSaleValidationReport>> {
  return request.get<AfterSaleValidationReport>(`/afterSaleTrace/validate/${afterSaleId}`)
}

export function getAfterSaleOperationLogs(afterSaleId: number): Promise<ApiResponse<AfterSaleOperationLog[]>> {
  return request.get<AfterSaleOperationLog[]>(`/afterSaleTrace/logs/${afterSaleId}`)
}

export function getAfterSaleLedger(afterSaleId: number): Promise<ApiResponse<AfterSaleLedger>> {
  return request.get<AfterSaleLedger>(`/afterSaleTrace/ledger/${afterSaleId}`)
}
