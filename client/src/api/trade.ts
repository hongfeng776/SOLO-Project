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
