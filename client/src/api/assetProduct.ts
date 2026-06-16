import { get, post, put, del } from '@utils/request'
import type { IAssetProduct, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export function getProductList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IAssetProduct>>> {
  return get<IPaginatedData<IAssetProduct>>('/api/products', params)
}

export function getProductByCode(productCode: string): Promise<IApiResponse<IAssetProduct>> {
  return get<IAssetProduct>(`/api/products/${productCode}`)
}

export function createProduct(data: Partial<IAssetProduct>): Promise<IApiResponse<IAssetProduct>> {
  return post<IAssetProduct>('/api/products', data)
}

export function updateProduct(id: number, data: Partial<IAssetProduct>): Promise<IApiResponse<IAssetProduct>> {
  return put<IAssetProduct>(`/api/products/${id}`, data)
}

export function deleteProduct(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/products/${id}`)
}

export function getList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IAssetProduct>>> {
  return getProductList(params)
}

export function getById(id: number): Promise<IApiResponse<IAssetProduct>> {
  return get<IAssetProduct>(`/api/products/${id}`)
}

export function create(data: Partial<IAssetProduct>): Promise<IApiResponse<IAssetProduct>> {
  return createProduct(data)
}

export function update(id: number, data: Partial<IAssetProduct>): Promise<IApiResponse<IAssetProduct>> {
  return updateProduct(id, data)
}

export function deleteFn(id: number): Promise<IApiResponse<null>> {
  return deleteProduct(id)
}

export { deleteFn as delete }

export function batchDelete(ids: number[]): Promise<IApiResponse<null>> {
  return post<null>('/api/products/batch-delete', { ids })
}

export function exportProduct(params: Record<string, any>): Promise<IApiResponse<Blob>> {
  return get<Blob>('/api/products/export', params, { responseType: 'blob' })
}
