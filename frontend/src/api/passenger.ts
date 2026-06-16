import request from '@/utils/request'
import type { Passenger, PassengerQueryParams } from '@/types/passenger'
import type { PageResult } from '@/utils/request'

export const getPassengerListApi = (params: PassengerQueryParams) => {
  return request.get<PageResult<Passenger>>('/passenger', params)
}

export const getPassengerDetailApi = (id: number) => {
  return request.get<Passenger>(`/passenger/${id}`)
}

export const createPassengerApi = (data: Partial<Passenger>) => {
  return request.post<Passenger>('/passenger', data)
}

export const updatePassengerApi = (id: number, data: Partial<Passenger>) => {
  return request.put<Passenger>(`/passenger/${id}`, data)
}

export const deletePassengerApi = (id: number) => {
  return request.delete(`/passenger/${id}`)
}

export const updatePassengerStatusApi = (id: number, status: number) => {
  return request.put(`/passenger/${id}/status`, { status })
}
