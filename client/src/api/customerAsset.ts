import { get, post, put, del } from '@utils/request'
import service from '@utils/request'
import type { ICustomerAsset, IApiResponse, IPaginatedData, IPageParams, IValidationResult, IBatchImportResult } from '@/types/api'

export function getList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<ICustomerAsset>>> {
  return get<IPaginatedData<ICustomerAsset>>('/api/customers', params)
}

export function getById(id: number): Promise<IApiResponse<ICustomerAsset>> {
  return get<ICustomerAsset>(`/api/customers/${id}`)
}

export function getAuditTrail(id: number): Promise<IApiResponse<any>> {
  return get<any>(`/api/customers/${id}/audit-trail`)
}

export function create(data: Partial<ICustomerAsset>): Promise<IApiResponse<ICustomerAsset>> {
  return post<ICustomerAsset>('/api/customers', data)
}

export function update(id: number, data: Partial<ICustomerAsset>): Promise<IApiResponse<ICustomerAsset>> {
  return put<ICustomerAsset>(`/api/customers/${id}`, data)
}

export function convertToFormal(id: number): Promise<IApiResponse<ICustomerAsset>> {
  return put<ICustomerAsset>(`/api/customers/${id}/convert-formal`)
}

export function remove(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/customers/${id}`)
}

export { remove as delete }

export function batchFreeze(ids: number[]): Promise<IApiResponse<null>> {
  return put<null>('/api/customers/batch-freeze', { ids })
}

export function batchImport(dataList: any[]): Promise<IApiResponse<IBatchImportResult>> {
  return post<IBatchImportResult>('/api/customers/batch-import', { dataList })
}

export function validateData(data: any, forFormalArchive: boolean = false): Promise<IApiResponse<IValidationResult>> {
  return post<IValidationResult>('/api/customers/validate', { data, forFormalArchive })
}

export function checkPreconditions(data: any): Promise<IApiResponse<IValidationResult>> {
  return post<IValidationResult>('/api/customers/check-preconditions', data)
}

export function exportList(params: Record<string, any>): Promise<Blob> {
  return service.get('/api/customers/export', { params, responseType: 'blob' }) as unknown as Promise<Blob>
}

export function getCustomerList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<ICustomerAsset>>> {
  return getList(params)
}

export function getCustomerById(id: number): Promise<IApiResponse<ICustomerAsset>> {
  return getById(id)
}

export function createCustomer(data: Partial<ICustomerAsset>): Promise<IApiResponse<ICustomerAsset>> {
  return create(data)
}

export function updateCustomer(id: number, data: Partial<ICustomerAsset>): Promise<IApiResponse<ICustomerAsset>> {
  return update(id, data)
}

export function deleteCustomer(id: number): Promise<IApiResponse<null>> {
  return remove(id)
}
