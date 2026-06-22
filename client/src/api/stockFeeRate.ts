import { get, post, put, del } from '@utils/request'
import type { IStockFeeRate, IStockFeeRateValidation, IStockFeeRateConflict, IStockFeeRateBatchResult, IStockFeeRateTraceData, IStockFeeCalculationDetail, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export function getList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IStockFeeRate>>> {
  return get<IPaginatedData<IStockFeeRate>>('/api/stock-fee-rates', params)
}

export function getById(id: number): Promise<IApiResponse<IStockFeeRate>> {
  return get<IStockFeeRate>(`/api/stock-fee-rates/${id}`)
}

export function create(data: Partial<IStockFeeRate>): Promise<IApiResponse<IStockFeeRate>> {
  return post<IStockFeeRate>('/api/stock-fee-rates', data)
}

export function update(id: number, data: Partial<IStockFeeRate>): Promise<IApiResponse<IStockFeeRate>> {
  return put<IStockFeeRate>(`/api/stock-fee-rates/${id}`, data)
}

export function deleteFn(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/stock-fee-rates/${id}`)
}

export { deleteFn as delete }

export function validateFeeRate(data: Partial<IStockFeeRate>): Promise<IApiResponse<IStockFeeRateValidation>> {
  return post<IStockFeeRateValidation>('/api/stock-fee-rates/validate', data)
}

export function activateFee(id: number): Promise<IApiResponse<IStockFeeRate>> {
  return put<IStockFeeRate>(`/api/stock-fee-rates/${id}/activate`)
}

export function deactivateFee(id: number): Promise<IApiResponse<IStockFeeRate>> {
  return put<IStockFeeRate>(`/api/stock-fee-rates/${id}/deactivate`)
}

export function batchUpdate(data: {
  feeRateValue?: number
  minFee?: number
  maxFee?: number
  productType?: string
  customerLevel?: string
  tradeScene?: string
  scopeType: string
  targetProductCodes?: string[]
  targetClassIds?: number[]
}): Promise<IApiResponse<IStockFeeRateBatchResult>> {
  return post<IStockFeeRateBatchResult>('/api/stock-fee-rates/batch-update', data)
}

export function batchActivate(ids: number[]): Promise<IApiResponse<IStockFeeRateBatchResult>> {
  return post<IStockFeeRateBatchResult>('/api/stock-fee-rates/batch-activate', { ids })
}

export function getTrace(id: number): Promise<IApiResponse<IStockFeeRateTraceData>> {
  return get<IStockFeeRateTraceData>(`/api/stock-fee-rates/${id}/trace`)
}

export function calculateFee(data: { tradeAmount: number; feeRateId: number; tradeScene: string }): Promise<IApiResponse<IStockFeeCalculationDetail>> {
  return post<IStockFeeCalculationDetail>('/api/stock-fee-rates/calculate', data)
}

export function checkConflicts(id: number): Promise<IApiResponse<IStockFeeRateConflict[]>> {
  return get<IStockFeeRateConflict[]>(`/api/stock-fee-rates/${id}/conflicts`)
}

export function resolveConflict(conflictId: number, resolution: string): Promise<IApiResponse<null>> {
  return put<null>(`/api/stock-fee-rates/conflicts/${conflictId}/resolve`, { resolution })
}
