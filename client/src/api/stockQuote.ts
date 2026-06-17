import { get, post, put, del } from '@utils/request'
import service from '@utils/request'
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
  IQuoteValidationError,
  IQuoteImportResult,
  IQuoteAuditTrail,
  IImportProgress,
} from '@/types/api'

export function getStockList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IStockQuote>>> {
  return get<IPaginatedData<IStockQuote>>('/api/stocks', params)
}

export function getStockByCode(stockCode: string): Promise<IApiResponse<IStockQuote>> {
  return get<IStockQuote>(`/api/stocks/code/${stockCode}`)
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

export function batchDelete(ids: number[]): Promise<IApiResponse<{ deletedCount: number }>> {
  return post<{ deletedCount: number }>('/api/stocks/batch-delete', { ids })
}

export function exportStock(params: Record<string, any>): Promise<Blob> {
  return service.get('/api/stocks/export', { params, responseType: 'blob' }) as unknown as Promise<Blob>
}

export function validateCode(code: string, market?: string): Promise<IApiResponse<IStockValidation>> {
  return get<IStockValidation>('/api/stocks/validate-code', { code, market })
}

export function getTradingSession(): Promise<IApiResponse<ITradingSession>> {
  return get<ITradingSession>('/api/stocks/trading-session')
}

export function getDataSourceStatus(): Promise<IApiResponse<IDataSourceStatus>> {
  return get<IDataSourceStatus>('/api/stocks/data-source-status')
}

export function getHistory(id: number, days: number = 30): Promise<IApiResponse<IStockHistory>> {
  return get<IStockHistory>(`/api/stocks/${id}/history`, { days })
}

export function refreshAllPrices(): Promise<IApiResponse<{ refreshedCount: number }>> {
  return post<{ refreshedCount: number }>('/api/stocks/refresh-prices', {})
}

export function validateQuote(data: Partial<IStockQuote> | Partial<IStockQuote>[]): Promise<IApiResponse<IQuoteValidationResult>> {
  return post<IQuoteValidationResult>('/api/stocks/validate', Array.isArray(data) ? data : [data])
}

// ====== 行情数据录入相关 API ======

export function downloadTemplate(): Promise<Blob> {
  return service.get('/api/stocks/template', { responseType: 'blob' }) as unknown as Promise<Blob>
}

export function batchImport(formData: FormData): Promise<IApiResponse<IQuoteImportResult>> {
  return service.post('/api/stocks/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as unknown as Promise<IApiResponse<IQuoteImportResult>>
}

export function getImportProgress(taskId: string): Promise<IApiResponse<IImportProgress>> {
  return get<IImportProgress>(`/api/stocks/import/progress/${taskId}`)
}

export function checkRegistered(stockCode: string): Promise<IApiResponse<{ registered: boolean; stockInfo?: IStockQuote }>> {
  return get<{ registered: boolean; stockInfo?: IStockQuote }>('/api/stocks/check-registered', { stockCode })
}

export function checkFluctuation(
  stockId: number,
  newPrice: number,
  baseDate?: string,
): Promise<IApiResponse<{
  withinThreshold: boolean
  previousClose: number
  newPrice: number
  changeRate: number
  threshold: number
  needConfirm: boolean
}>> {
  return get(`/api/stocks/${stockId}/check-fluctuation`, { newPrice, baseDate })
}

export function validateRecord(data: Partial<IStockQuote>): Promise<IApiResponse<{
  valid: boolean
  errors: IQuoteValidationError[]
  warnings: IQuoteValidationError[]
  accuracyLevel: 'high' | 'medium' | 'low'
}>> {
  return post('/api/stocks/validate-record', data)
}

export function getAuditTrail(stockId: number, days: number = 30): Promise<IApiResponse<{
  list: IQuoteAuditTrail[]
  stats: {
    operatorStats: any[]
    operationTypeStats: any[]
    periodStats: any[]
    avgConsistencyScore: number
  }
}>> {
  return get(`/api/stocks/${stockId}/audit-trail`, { days })
}

export function checkConsistency(stockId: number): Promise<IApiResponse<{
  score: number
  status: 'verified' | 'pending' | 'rejected'
  issues: Array<{ field: string; message: string; level: 'high' | 'medium' | 'low'; suggestion?: string }>
}>> {
  return get(`/api/stocks/${stockId}/consistency`)
}

export function createWithAudit(
  data: Partial<IStockQuote> & { confirmed?: boolean; remark?: string },
): Promise<IApiResponse<{
  stockQuote: IStockQuote
  auditTrail: IQuoteAuditTrail
  period: { period: string; periodLabel: string; storageRule: string }
}>> {
  return post('/api/stocks/create-with-audit', data)
}
