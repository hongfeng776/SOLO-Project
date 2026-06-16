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
