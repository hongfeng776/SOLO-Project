import { get, post, put } from '@utils/request'
import type { IRiskAlert, IApiResponse, IPaginatedData, IPageParams } from '@/types/api'

export function getList(params: IPageParams & Record<string, any>): Promise<IApiResponse<IPaginatedData<IRiskAlert>>> {
  return get<IPaginatedData<IRiskAlert>>('/api/risk-alerts', params)
}

export function getById(id: number): Promise<IApiResponse<IRiskAlert>> {
  return get<IRiskAlert>(`/api/risk-alerts/${id}`)
}

export function create(data: Partial<IRiskAlert>): Promise<IApiResponse<IRiskAlert>> {
  return post<IRiskAlert>('/api/risk-alerts', data)
}

export function confirm(id: number): Promise<IApiResponse<IRiskAlert>> {
  return put<IRiskAlert>(`/api/risk-alerts/${id}/confirm`)
}

export function resolve(id: number, opinion: string, handlerId: number): Promise<IApiResponse<IRiskAlert>> {
  return put<IRiskAlert>(`/api/risk-alerts/${id}/resolve`, { opinion, handlerId })
}

export function ignore(id: number, opinion: string): Promise<IApiResponse<IRiskAlert>> {
  return put<IRiskAlert>(`/api/risk-alerts/${id}/ignore`, { opinion })
}
