import { get, post, put, del } from '@utils/request'
import type {
  IStockQuote,
  IApiResponse,
  IPaginatedData,
  IPageParams,
  IStockValidation,
  ITradingSession,
  IDataSourceStatus,
  IStockHistory,
  IQuoteValidationResult,
  IDataCheckResult,
  ISyncHistoryItem,
} from '@/types/api'

export function getStockList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IStockQuote>>> {
  return get<IPaginatedData<IStockQuote>>('/api/stocks', params)
}

export function getStockByCode(stockCode: string): Promise<IApiResponse<IStockQuote>> {
  return get<IStockQuote>(`/api/stocks/${stockCode}`)
}

export function createStock(data: Partial<IStockQuote>): Promise<IApiResponse<IStockQuote>> {
  return post<IStockQuote>('/api/stocks', data)
}

export function updateStock(id: number, data: Partial<IStockQuote>): Promise<IApiResponse<IStockQuote>> {
  return put<IStockQuote>(`/api/stocks/${id}`, data)
}

export function deleteStock(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/stocks/${id}`)
}

export function getList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IStockQuote>>> {
  return getStockList(params)
}

export function getById(id: number): Promise<IApiResponse<IStockQuote>> {
  return get<IStockQuote>(`/api/stocks/${id}`)
}

export function create(data: Partial<IStockQuote>): Promise<IApiResponse<IStockQuote>> {
  return createStock(data)
}

export function update(id: number, data: Partial<IStockQuote>): Promise<IApiResponse<IStockQuote>> {
  return updateStock(id, data)
}

export function deleteFn(id: number): Promise<IApiResponse<null>> {
  return deleteStock(id)
}

export { deleteFn as delete }

export function batchDelete(ids: number[]): Promise<IApiResponse<null>> {
  return post<null>('/api/stocks/batch-delete', { ids })
}

export function exportStock(params: Record<string, any>): Promise<IApiResponse<Blob>> {
  return get<Blob>('/api/stocks/export', params, { responseType: 'blob' })
}

export function validateCode(code: string, market: string): Promise<IApiResponse<IStockValidation>> {
  return get<IStockValidation>('/api/stocks/validate-code', { code, market })
}

export function getTradingSession(): Promise<IApiResponse<ITradingSession>> {
  return get<ITradingSession>('/api/stocks/trading-session')
}

export function getDataSourceStatus(): Promise<IApiResponse<IDataSourceStatus>> {
  return get<IDataSourceStatus>('/api/stocks/data-source-status')
}

export function getHistory(id: number, days: number = 30): Promise<IApiResponse<IStockHistory[]>> {
  return get<IStockHistory[]>(`/api/stocks/${id}/history`, { days })
}

export function refreshAllPrices(): Promise<IApiResponse<{ count: number }>> {
  return post<{ count: number }>('/api/stocks/refresh-all')
}

export function validateQuote(data: Partial<IStockQuote>): Promise<IApiResponse<IQuoteValidationResult>> {
  return post<IQuoteValidationResult>('/api/stocks/validate-quote', data)
}

export function getDataCheck(stockId: number): Promise<IApiResponse<IDataCheckResult>> {
  return get<IDataCheckResult>(`/api/stocks/${stockId}/data-check`)
}

export function getSyncHistory(stockId: number): Promise<IApiResponse<ISyncHistoryItem[]>> {
  return get<ISyncHistoryItem[]>(`/api/stocks/${stockId}/sync-history`)
}
