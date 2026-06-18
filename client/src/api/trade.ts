import { get, post, put } from '@utils/request'
import type { ITrade, ITradeCreateParams, IApiResponse, IPaginatedData, IPageParams, ICustomer, IStockQuote } from '@/types/api'

export interface ITradeListParams extends IPageParams {
  keyword?: string
  customerId?: number | string
  customerName?: string
  tradeType?: string
  status?: string
  startDate?: string
  endDate?: string
  stockCode?: string
}

export interface ITradingSession {
  inSession: boolean
  currentPeriod: string
  nextSessionAt: string
}

export interface IOrderValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  tradeAmount?: number
  totalCost?: number
}

export interface ISubmitOrderResult {
  trade: ITrade
  validation: IOrderValidationResult
  needAudit: boolean
  isHighRisk: boolean
}

export interface IOrderCheckPoint {
  name: string
  passed: boolean
  message: string
  time: string
}

export interface IOrderTraceInfo {
  orderId: number
  tradeNo: string
  customerName: string
  stockName: string
  tradeType: string
  price: number
  quantity: number
  amount: number
  status: string
  operator: string
  ip: string
  userAgent: string
  submitAt: string
  checkPoints: IOrderCheckPoint[]
}

export interface IBatchSubmitResult {
  total: number
  successCount: number
  failedCount: number
  auditCount: number
  results: Array<{
    success: boolean
    order?: ITrade
    error?: string
    needAudit?: boolean
  }>
}

export interface IBatchProcessResult {
  total: number
  successCount: number
  failedCount: number
  results: Array<{
    id: number
    success: boolean
    error?: string
  }>
}

export function getTradeList(params: ITradeListParams): Promise<IApiResponse<IPaginatedData<ITrade>>> {
  return get<IPaginatedData<ITrade>>('/api/trades', params)
}

export function getTradeById(id: number): Promise<IApiResponse<ITrade>> {
  return get<ITrade>(`/api/trades/${id}`)
}

export function getTradeByNo(tradeNo: string): Promise<IApiResponse<ITrade>> {
  return get<ITrade>('/api/trades/by-no', { tradeNo })
}

export function createTrade(data: ITradeCreateParams): Promise<IApiResponse<ITrade>> {
  return post<ITrade>('/api/trades', data)
}

export function approveTrade(id: number, opinion: string): Promise<IApiResponse<ITrade>> {
  return put<ITrade>(`/api/trades/${id}/approve`, { opinion })
}

export function rejectTrade(id: number, opinion: string): Promise<IApiResponse<ITrade>> {
  return put<ITrade>(`/api/trades/${id}/reject`, { opinion })
}

export function cancelTrade(id: number): Promise<IApiResponse<ITrade>> {
  return put<ITrade>(`/api/trades/${id}/cancel`)
}

export function exportTradeList(params: Record<string, any>): Promise<IApiResponse<Blob>> {
  return get<Blob>('/api/trades/export', params, { responseType: 'blob' })
}

export function getCustomerList(): Promise<IApiResponse<ICustomer[]>> {
  return get<ICustomer[]>('/api/customers/list')
}

export function getStockList(): Promise<IApiResponse<IStockQuote[]>> {
  return get<IStockQuote[]>('/api/stocks/list')
}

export function getTradingSession(): Promise<IApiResponse<ITradingSession>> {
  return get<ITradingSession>('/api/trades/trading-session')
}

export function validateOrder(data: {
  customerId: number
  stockId: number
  direction: string
  price: number
  quantity: number
  checkSession?: boolean
}): Promise<IApiResponse<IOrderValidationResult>> {
  return post<IOrderValidationResult>('/api/trades/validate', data)
}

export function submitOrder(data: {
  customerId: number
  stockId: number
  tradeType: string
  direction: string
  price: number
  quantity: number
  remark?: string
}): Promise<IApiResponse<ISubmitOrderResult>> {
  return post<ISubmitOrderResult>('/api/trades/submit', data)
}

export function batchSubmitOrders(orders: Array<{
  customerId: number
  stockId: number
  tradeType: string
  direction: string
  price: number
  quantity: number
  remark?: string
}>): Promise<IApiResponse<IBatchSubmitResult>> {
  return post<IBatchSubmitResult>('/api/trades/batch-submit', { orders })
}

export function getOrderTrace(id: number): Promise<IApiResponse<IOrderTraceInfo>> {
  return get<IOrderTraceInfo>(`/api/trades/${id}/trace`)
}

export function getPendingOrders(params: IPageParams & {
  riskLevel?: string
  customerId?: number
}): Promise<IApiResponse<IPaginatedData<ITrade>>> {
  return get<IPaginatedData<ITrade>>('/api/trades/pending', params)
}

export function processBatchOrders(data: {
  ids: number[]
  action: 'approve' | 'reject'
  opinion?: string
}): Promise<IApiResponse<IBatchProcessResult>> {
  return post<IBatchProcessResult>('/api/trades/batch-process', data)
}

export interface IMatchingValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  orderValid: boolean
  marketLiquidity: 'high' | 'medium' | 'low' | 'none'
  ruleActive: boolean
  stockTradable: boolean
}

export interface IMatchingResult {
  success: boolean
  matchStatus: 'full' | 'partial' | 'failed'
  matchPrice: number
  matchQuantity: number
  matchAmount: number
  remainQuantity: number
  trade: ITrade
}

export interface IMatchingProgress {
  total: number
  partialDealed: number
  fullDealed: number
  failed: number
  paused: number
  dealedAmount: string
  progressRate: string
}

export interface IMatchingTraceNode {
  name: string
  passed: boolean
  message: string
  time: string
}

export interface IMatchingTrace {
  orderId: number
  tradeNo: string
  matchRule: string
  matchPrice: number
  matchQuantity: number
  matchAmount: number
  marketPrice: number
  priceDeviation: number
  matchedAt: string
  counterParty: string
  priceConsistent: boolean
  traceNodes: IMatchingTraceNode[]
}

export interface IBatchMatchingResult {
  total: number
  successCount: number
  partialCount: number
  failedCount: number
  results: Array<{
    id: number
    success: boolean
    matchStatus?: string
    matchQuantity?: number
    matchAmount?: number
    error?: string
  }>
}

export function validateMatchingOrder(id: number): Promise<IApiResponse<IMatchingValidation>> {
  return get<IMatchingValidation>(`/api/trades/${id}/matching-validate`)
}

export function executeMatching(id: number): Promise<IApiResponse<IMatchingResult>> {
  return post<IMatchingResult>(`/api/trades/matching/${id}/execute`)
}

export function batchExecuteMatching(ids: number[]): Promise<IApiResponse<IBatchMatchingResult>> {
  return post<IBatchMatchingResult>('/api/trades/matching/batch-execute', { ids })
}

export function getMatchingOrders(params: IPageParams & {
  matchStatus?: string
  stockCode?: string
  direction?: string
}): Promise<IApiResponse<IPaginatedData<ITrade>>> {
  return get<IPaginatedData<ITrade>>('/api/trades/matching', params)
}

export function getMatchingProgress(): Promise<IApiResponse<IMatchingProgress>> {
  return get<IMatchingProgress>('/api/trades/matching-progress')
}

export function batchControlOrders(data: {
  ids: number[]
  action: 'pause' | 'resume' | 'clear'
}): Promise<IApiResponse<IBatchProcessResult>> {
  return post<IBatchProcessResult>('/api/trades/matching/batch-control', data)
}

export function getMatchingTrace(id: number): Promise<IApiResponse<IMatchingTrace>> {
  return get<IMatchingTrace>(`/api/trades/${id}/matching-trace`)
}

export interface IStatusValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  allowedActions: string[]
  currentStatus: string
  targetStatus: string
}

export interface IStatusChangeResult {
  success: boolean
  tradeId: number
  previousStatus: string
  newStatus: string
  changeType: 'manual' | 'system'
  dataConsistent: boolean
  fundDiff: number
  holdingDiff: number
  message: string
}

export interface IStatusTraceRecord {
  id: number
  tradeId: number
  tradeNo: string
  fromStatus: string
  toStatus: string
  changeType: 'manual' | 'system'
  operatorId: number | null
  operatorName: string
  reason: string
  fundBefore: number
  fundAfter: number
  fundDiff: number
  holdingBefore: number
  holdingAfter: number
  holdingDiff: number
  dataConsistent: boolean
  createdAt: string
}

export interface IStatusTraceInfo {
  orderId: number
  tradeNo: string
  currentStatus: string
  records: IStatusTraceRecord[]
  sequenceValid: boolean
  sequenceErrors: string[]
  dataSummary: {
    totalFundChange: number
    totalHoldingChange: number
    allConsistent: boolean
  }
}

export interface IBatchStatusChangeResult {
  total: number
  successCount: number
  failedCount: number
  results: IStatusChangeResult[]
}

export function validateStatusOperation(id: number, targetStatus: string): Promise<IApiResponse<IStatusValidation>> {
  return get<IStatusValidation>(`/api/trades/${id}/status-validate`, { targetStatus })
}

export function manualChangeStatus(data: {
  id: number
  targetStatus: string
  reason: string
}): Promise<IApiResponse<IStatusChangeResult>> {
  return put<IStatusChangeResult>(`/api/trades/${data.id}/status`, {
    targetStatus: data.targetStatus,
    reason: data.reason,
  })
}

export function batchChangeStatus(data: {
  ids: number[]
  targetStatus: string
  reason: string
  filters?: {
    riskLevel?: string
    minAmount?: number
    maxAmount?: number
    startDate?: string
    endDate?: string
  }
}): Promise<IApiResponse<IBatchStatusChangeResult>> {
  return put<IBatchStatusChangeResult>('/api/trades/batch-status', data)
}

export function getStatusTrace(id: number): Promise<IApiResponse<IStatusTraceInfo>> {
  return get<IStatusTraceInfo>(`/api/trades/${id}/status-trace`)
}
