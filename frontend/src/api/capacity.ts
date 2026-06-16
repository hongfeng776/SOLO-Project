import request from '@/utils/request'
import type { CapacityType, CapacityMonitor } from '@/types/capacity'
import type { PageResult } from '@/utils/request'

export const getCapacityMonitorApi = () => {
  return request.get<CapacityMonitor>('/capacity/monitor')
}

export const getCapacityTypeListApi = (params?: any) => {
  return request.get<PageResult<CapacityType>>('/capacity/type', params)
}

export const getCapacityTypeDetailApi = (id: number) => {
  return request.get<CapacityType>(`/capacity/type/${id}`)
}

export const createCapacityTypeApi = (data: Partial<CapacityType>) => {
  return request.post<CapacityType>('/capacity/type', data)
}

export const updateCapacityTypeApi = (id: number, data: Partial<CapacityType>) => {
  return request.put<CapacityType>(`/capacity/type/${id}`, data)
}

export const deleteCapacityTypeApi = (id: number) => {
  return request.delete(`/capacity/type/${id}`)
}
