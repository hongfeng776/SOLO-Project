import { get, post, put, del } from '@utils/request'
import service from '@utils/request'
import type { IFundFlow, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export function getList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IFundFlow>>> {
  return get<IPaginatedData<IFundFlow>>('/api/fund-flows', params)
}

export function getById(id: number | string): Promise<IApiResponse<IFundFlow>> {
  return get<IFundFlow>(`/api/fund-flows/${id}`)
}

export function create(data: Partial<IFundFlow>): Promise<IApiResponse<IFundFlow>> {
  return post<IFundFlow>('/api/fund-flows', data)
}

export function update(id: number, data: Partial<IFundFlow>): Promise<IApiResponse<IFundFlow>> {
  return put<IFundFlow>(`/api/fund-flows/${id}`, data)
}

export function remove(id: number): Promise<IApiResponse<null>> {
  return del<null>(`/api/fund-flows/${id}`)
}

export { remove as delete }

export function exportList(params: Record<string, any>): Promise<Blob> {
  return service.get('/api/fund-flows/export', { params, responseType: 'blob' }) as unknown as Promise<Blob>
}

export function getFlowList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IFundFlow>>> {
  return getList(params)
}

export function getFlowByNo(flowNo: string): Promise<IApiResponse<IFundFlow>> {
  return getById(flowNo)
}

export function createFlow(data: Partial<IFundFlow>): Promise<IApiResponse<IFundFlow>> {
  return create(data)
}

export function updateFlow(id: number, data: Partial<IFundFlow>): Promise<IApiResponse<IFundFlow>> {
  return update(id, data)
}

export function deleteFlow(id: number): Promise<IApiResponse<null>> {
  return remove(id)
}
