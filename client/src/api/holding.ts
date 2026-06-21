import { get, post, put } from '@utils/request'
import type { ICustomerHolding, IHoldingDetail, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export interface IHoldingListParams extends IPageParams {
  customerName?: string
  stockCode?: string
  stockName?: string
  lockStatus?: string
  riskLevel?: string
  profitStatus?: string
  keyword?: string
}

export function getHoldingList(params: IHoldingListParams): Promise<IApiResponse<IPaginatedData<ICustomerHolding>>> {
  return get<IPaginatedData<ICustomerHolding>>('/api/holdings', params)
}

export function getHoldingById(id: number): Promise<IApiResponse<ICustomerHolding>> {
  return get<ICustomerHolding>(`/api/holdings/${id}`)
}

export function getHoldingByCustomer(customerId: number): Promise<IApiResponse<ICustomerHolding[]>> {
  return get<ICustomerHolding[]>(`/api/holdings/by-customer/${customerId}`)
}

export function getHoldingRecords(holdingId: number): Promise<IApiResponse<IHoldingDetail[]>> {
  return get<IHoldingDetail[]>(`/api/holdings/${holdingId}/records`)
}

export function getHoldingStats(): Promise<IApiResponse<{
  totalMarketValue: number
  totalFloatingProfit: number
  totalProfitRate: number
  holdingStockCount: number
}>> {
  return get('/api/holdings/stats')
}

export function lockHolding(id: number, reason: string): Promise<IApiResponse<ICustomerHolding>> {
  return put<ICustomerHolding>(`/api/holdings/${id}/lock`, { reason })
}

export function unlockHolding(id: number): Promise<IApiResponse<ICustomerHolding>> {
  return put<ICustomerHolding>(`/api/holdings/${id}/unlock`)
}

export function adjustHolding(data: {
  holdingId: number
  adjustType: 'quantity' | 'cost_price'
  newQuantity?: number
  newCostPrice?: number
  reason: string
}): Promise<IApiResponse<any>> {
  return post<any>('/api/holdings/adjust', data)
}

export function batchLockHolding(holdingIds: number[], reason: string): Promise<IApiResponse<any>> {
  return post<any>('/api/holdings/batch-lock', { holdingIds, reason })
}

export function batchUnlockHolding(holdingIds: number[]): Promise<IApiResponse<any>> {
  return post<any>('/api/holdings/batch-unlock', { holdingIds })
}

export function batchLockByFilter(params: {
  stockCode?: string
  minMarketValue?: number
  maxMarketValue?: number
  riskLevel?: string
  reason: string
}): Promise<IApiResponse<any>> {
  return post<any>('/api/holdings/batch-lock-by-filter', params)
}

export function getHoldingAuditTrail(id: number): Promise<IApiResponse<any>> {
  return get<any>(`/api/holdings/${id}/audit-trail`)
}

export function validateHoldingOperation(holdingId: number, operationType: string): Promise<IApiResponse<any>> {
  return post<any>('/api/holdings/validate', { holdingId, operationType })
}

export function syncHoldingsMarketValue(): Promise<IApiResponse<any>> {
  return post<any>('/api/holdings/sync-market-value')
}
