import { get, post, put, del } from '@utils/request'
import type { IStockClassification, IStockClassValidation, IStockClassDeleteCheck, IStockClassBatchResult, IStockClassTraceData, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export function getList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IStockClassification>>> {
  return get<IPaginatedData<IStockClassification>>('/api/stock-classifications', params)
}

export function getById(id: number): Promise<IApiResponse<IStockClassification>> {
  return get<IStockClassification>(`/api/stock-classifications/${id}`)
}

export function create(data: Partial<IStockClassification>): Promise<IApiResponse<IStockClassification>> {
  return post<IStockClassification>('/api/stock-classifications', data)
}

export function update(id: number, data: Partial<IStockClassification>): Promise<IApiResponse<IStockClassification>> {
  return put<IStockClassification>(`/api/stock-classifications/${id}`, data)
}

export function deleteFn(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/stock-classifications/${id}`)
}

export { deleteFn as delete }

export function validateClass(data: Partial<IStockClassification>): Promise<IApiResponse<IStockClassValidation>> {
  return post<IStockClassValidation>('/api/stock-classifications/validate', data)
}

export function checkDelete(id: number): Promise<IApiResponse<IStockClassDeleteCheck>> {
  return get<IStockClassDeleteCheck>(`/api/stock-classifications/${id}/delete-check`)
}

export function updateStatus(id: number, status: string): Promise<IApiResponse<IStockClassification>> {
  return put<IStockClassification>(`/api/stock-classifications/${id}/status`, { classStatus: status })
}

export function batchMigrate(data: { sourceClassIds: number[]; targetClassId: number }): Promise<IApiResponse<IStockClassBatchResult>> {
  return post<IStockClassBatchResult>('/api/stock-classifications/batch-migrate', data)
}

export function batchAddTags(data: { classIds: number[]; tags: string[] }): Promise<IApiResponse<IStockClassBatchResult>> {
  return post<IStockClassBatchResult>('/api/stock-classifications/batch-add-tags', data)
}

export function batchInvalidate(ids: number[]): Promise<IApiResponse<IStockClassBatchResult>> {
  return post<IStockClassBatchResult>('/api/stock-classifications/batch-invalidate', { ids })
}

export function getTrace(id: number): Promise<IApiResponse<IStockClassTraceData>> {
  return get<IStockClassTraceData>(`/api/stock-classifications/${id}/trace`)
}

export function getChildren(parentId: number): Promise<IApiResponse<IStockClassification[]>> {
  return get<IStockClassification[]>(`/api/stock-classifications/${parentId}/children`)
}
