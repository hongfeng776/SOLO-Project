import { get, post, put, del } from '@utils/request'
import type { IStockProduct, IStockProductValidation, IStockProductArchiveResult, IStockProductBatchImportResult, IStockProductAuditTrailData, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export function getList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IStockProduct>>> {
  return get<IPaginatedData<IStockProduct>>('/api/stock-products', params)
}

export function getById(id: number): Promise<IApiResponse<IStockProduct>> {
  return get<IStockProduct>(`/api/stock-products/${id}`)
}

export function create(data: Partial<IStockProduct>): Promise<IApiResponse<IStockProductArchiveResult>> {
  return post<IStockProductArchiveResult>('/api/stock-products', data)
}

export function update(id: number, data: Partial<IStockProduct>): Promise<IApiResponse<IStockProduct>> {
  return put<IStockProduct>(`/api/stock-products/${id}`, data)
}

export function deleteFn(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/stock-products/${id}`)
}

export { deleteFn as delete }

export function batchDelete(ids: number[]): Promise<IApiResponse<null>> {
  return post<null>('/api/stock-products/batch-delete', { ids })
}

export function validateStockCode(stockCode: string, market: string): Promise<IApiResponse<IStockProductValidation>> {
  return post<IStockProductValidation>('/api/stock-products/validate-code', { stockCode, market })
}

export function validateArchive(data: Partial<IStockProduct>): Promise<IApiResponse<IStockProductValidation>> {
  return post<IStockProductValidation>('/api/stock-products/validate-archive', data)
}

export function batchImport(data: any[]): Promise<IApiResponse<IStockProductBatchImportResult>> {
  return post<IStockProductBatchImportResult>('/api/stock-products/batch-import', data)
}

export function getAuditTrail(id: number): Promise<IApiResponse<IStockProductAuditTrailData>> {
  return get<IStockProductAuditTrailData>(`/api/stock-products/${id}/audit-trail`)
}

export function updateStatus(id: number, status: string): Promise<IApiResponse<IStockProduct>> {
  return put<IStockProduct>(`/api/stock-products/${id}/status`, { productStatus: status })
}

export function exportStockProducts(params: Record<string, any>): Promise<IApiResponse<Blob>> {
  return get<Blob>('/api/stock-products/export', params, { responseType: 'blob' })
}
