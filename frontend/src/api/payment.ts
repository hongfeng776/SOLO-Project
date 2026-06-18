import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export enum PayStatus {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
  REFUNDED = 3,
}

export enum PayScenario {
  FULL = 1,
  PARTIAL = 2,
  AFTER_REFUND = 3,
}

export enum ReconcileStatus {
  PENDING = 0,
  PROCESSING = 1,
  PASSED = 2,
  ABNORMAL = 3,
}

export enum SettleStatus {
  PENDING = 0,
  SETTLED = 1,
  ABNORMAL = 2,
}

export enum RiskFlag {
  NORMAL = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  BLOCKED = 4,
}

export enum ChannelStatus {
  NORMAL = 0,
  CLOSED = 1,
}

export interface PaymentFlow {
  id: number
  flowNo: string
  orderId: number
  orderNo: string
  userId: number
  amount: number
  orderAmount: number
  diffAmount: number
  payType: number
  payScenario: number
  payStatus: number
  reconcileStatus: number
  reconcileTime?: string
  reconcileBy?: number
  reconcileRemark?: string
  settleStatus: number
  settleTime?: string
  settleAmount: number
  expireTime?: string
  channelStatus: number
  riskFlag: number
  riskReason?: string
  transactionId?: string
  payTime?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface PaymentReconcile {
  id: number
  reconcileNo: string
  flowId: number
  flowNo: string
  orderId: number
  orderNo: string
  orderAmount: number
  payAmount: number
  diffAmount: number
  status: number
  reconcileTime?: string
  reconcileBy?: number
  reconcileName?: string
  remark?: string
  exceptionRemark?: string
  createdAt: string
}

export interface FundSettlement {
  id: number
  settleNo: string
  flowId: number
  flowNo: string
  merchantId: number
  merchantName: string
  orderId: number
  orderNo: string
  orderAmount: number
  payAmount: number
  platformFee: number
  settleAmount: number
  status: number
  settleTime?: string
  operatorId?: number
  operatorName?: string
  remark?: string
  createdAt: string
}

export interface RiskAlert {
  id: number
  ruleId: number
  type: number
  targetId: number
  level: number
  content?: string
  status: number
  handlerId?: number
  handledAt?: string
  createdAt: string
}

export interface PaymentValidateResult {
  valid: boolean
  errorCode?: string
  errorMessage?: string
  riskFlag?: RiskFlag
  riskReason?: string
}

export interface PaymentVerifyData {
  flowNo: string
  orderId: number
  orderNo: string
  userId: number
  payAmount: number
  payType: number
  transactionId?: string
  payScenario?: PayScenario
}

export interface PaymentSyncResult {
  success: boolean
  orderStatus?: number
  errorMessage?: string
}

export interface PaymentQueryParams extends PageParams {
  flowNo?: string
  orderNo?: string
  userId?: number
  merchantId?: number
  payType?: number
  payStatus?: number
  reconcileStatus?: number
  settleStatus?: number
  riskFlag?: number
  channelStatus?: number
  startTime?: string
  endTime?: string
  startPayTime?: string
  endPayTime?: string
  minAmount?: number
  maxAmount?: number
  isOverdue?: number
  isException?: number
  isReconcilePending?: number
}

export interface BatchOperationResult {
  success: boolean
  total: number
  successCount: number
  failCount: number
  messages?: string[]
}

export interface PaymentTraceData {
  paymentFlow: PaymentFlow | null
  orderInfo: any
  userInfo: any
  merchantInfo: any
  reconciles: PaymentReconcile[]
  settlements: FundSettlement[]
  riskAlerts: RiskAlert[]
  orderLogs: any[]
}

export interface PaymentValidationReport {
  flowMatch: boolean
  amountMatch: boolean
  timeMatch: boolean
  noDuplicate: boolean
  noFake: boolean
  overallScore: number
  issues: string[]
}

export const PayStatusMap: Record<number, string> = {
  [PayStatus.PENDING]: '待支付',
  [PayStatus.SUCCESS]: '支付成功',
  [PayStatus.FAILED]: '支付失败',
  [PayStatus.REFUNDED]: '已退款',
}

export const PayScenarioMap: Record<number, string> = {
  [PayScenario.FULL]: '全额支付',
  [PayScenario.PARTIAL]: '部分支付',
  [PayScenario.AFTER_REFUND]: '退款后支付',
}

export const ReconcileStatusMap: Record<number, string> = {
  [ReconcileStatus.PENDING]: '待对账',
  [ReconcileStatus.PROCESSING]: '对账中',
  [ReconcileStatus.PASSED]: '对账通过',
  [ReconcileStatus.ABNORMAL]: '对账异常',
}

export const SettleStatusMap: Record<number, string> = {
  [SettleStatus.PENDING]: '待结算',
  [SettleStatus.SETTLED]: '已结算',
  [SettleStatus.ABNORMAL]: '结算异常',
}

export const RiskFlagMap: Record<number, string> = {
  [RiskFlag.NORMAL]: '正常',
  [RiskFlag.LOW]: '低风险',
  [RiskFlag.MEDIUM]: '中风险',
  [RiskFlag.HIGH]: '高风险',
  [RiskFlag.BLOCKED]: '已拦截',
}

export const ChannelStatusMap: Record<number, string> = {
  [ChannelStatus.NORMAL]: '正常',
  [ChannelStatus.CLOSED]: '已关闭',
}

export const PayTypeMap: Record<number, string> = {
  1: '微信支付',
  2: '支付宝',
  3: '银行卡',
}

export function verifyPayment(data: PaymentVerifyData): Promise<ApiResponse<PaymentValidateResult>> {
  return request.post<PaymentValidateResult>('/paymentValidate/verify', data)
}

export function validatePaymentAmount(data: { orderId: number; payAmount: number }): Promise<ApiResponse<PaymentValidateResult>> {
  return request.post<PaymentValidateResult>('/paymentValidate/validate/amount', data)
}

export function validatePaymentChannel(data: { payType: number }): Promise<ApiResponse<PaymentValidateResult>> {
  return request.post<PaymentValidateResult>('/paymentValidate/validate/channel', data)
}

export function validatePaymentTimeliness(orderId: number): Promise<ApiResponse<PaymentValidateResult>> {
  return request.get<PaymentValidateResult>(`/paymentValidate/validate/timeliness/${orderId}`)
}

export function validateUserAccount(userId: number): Promise<ApiResponse<PaymentValidateResult>> {
  return request.get<PaymentValidateResult>(`/paymentValidate/validate/user/${userId}`)
}

export function syncPaymentStatus(flowId: number, data: { payStatus: number; payScenario?: number }): Promise<ApiResponse<PaymentSyncResult>> {
  return request.put<PaymentSyncResult>(`/paymentValidate/sync/${flowId}`, data)
}

export function closeExpiredChannels(): Promise<ApiResponse<{ count: number }>> {
  return request.post<{ count: number }>('/paymentValidate/close-expired')
}

export function createPaymentFlow(data: {
  orderId: number
  orderNo: string
  userId: number
  amount: number
  payType: number
}): Promise<ApiResponse<PaymentFlow>> {
  return request.post<PaymentFlow>('/paymentValidate/flow', data)
}

export function getPaymentFlow(id: number): Promise<ApiResponse<PaymentFlow>> {
  return request.get<PaymentFlow>(`/paymentValidate/flow/${id}`)
}

export function getPaymentList(params: PaymentQueryParams): Promise<ApiResponse<PageResult<PaymentFlow>>> {
  return request.get<PageResult<PaymentFlow>>('/paymentBatch/list', { params })
}

export function getFilteredPaymentIds(params: PaymentQueryParams): Promise<ApiResponse<{ ids: number[]; count: number }>> {
  return request.post<{ ids: number[]; count: number }>('/paymentBatch/filtered-ids', params)
}

export function batchVerifyPayment(params: PaymentQueryParams): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/paymentBatch/batch-verify', params)
}

export function batchResetExpireTime(params: PaymentQueryParams): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/paymentBatch/batch-reset-expire', params)
}

export function batchMarkReconcile(params: PaymentQueryParams & {
  reconcileStatus: number
  remark?: string
}): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/paymentBatch/batch-mark-reconcile', params)
}

export function batchHandleRisk(params: PaymentQueryParams & {
  riskFlag: number
  reason?: string
}): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/paymentBatch/batch-handle-risk', params)
}

export function checkFinancePermission(): Promise<ApiResponse<{ hasPermission: boolean }>> {
  return request.get<{ hasPermission: boolean }>('/paymentBatch/check-finance-permission')
}

export function getPaymentTrace(flowId: number): Promise<ApiResponse<PaymentTraceData>> {
  return request.get<PaymentTraceData>(`/paymentTrace/flow/${flowId}`)
}

export function getPaymentTraceByOrderId(orderId: number): Promise<ApiResponse<PaymentTraceData>> {
  return request.get<PaymentTraceData>(`/paymentTrace/order/${orderId}`)
}

export function getPaymentTraceByFlowNo(flowNo: string): Promise<ApiResponse<PaymentTraceData>> {
  return request.get<PaymentTraceData>(`/paymentTrace/flow-no/${flowNo}`)
}

export function getPaymentTraceByTransactionId(transactionId: string): Promise<ApiResponse<PaymentTraceData[]>> {
  return request.get<PaymentTraceData[]>(`/paymentTrace/transaction/${transactionId}`)
}

export function validatePaymentData(flowId: number): Promise<ApiResponse<PaymentValidationReport>> {
  return request.get<PaymentValidationReport>(`/paymentTrace/validate/${flowId}`)
}

export function getReconcileList(flowId: number, params?: PageParams): Promise<ApiResponse<PageResult<PaymentReconcile>>> {
  return request.get<PageResult<PaymentReconcile>>(`/paymentTrace/reconciles/${flowId}`, { params })
}

export function getSettlementList(flowId: number, params?: PageParams): Promise<ApiResponse<PageResult<FundSettlement>>> {
  return request.get<PageResult<FundSettlement>>(`/paymentTrace/settlements/${flowId}`, { params })
}

export function getPaymentRiskAlerts(orderId: number, params?: PageParams): Promise<ApiResponse<PageResult<RiskAlert>>> {
  return request.get<PageResult<RiskAlert>>(`/paymentTrace/risk-alerts/${orderId}`, { params })
}

export function getPaymentEnumNames(params: {
  payStatus?: number
  payScenario?: number
  reconcileStatus?: number
  settleStatus?: number
  riskFlag?: number
}): Promise<ApiResponse<Record<string, string>>> {
  return request.get<Record<string, string>>('/paymentTrace/enum-names', { params })
}
