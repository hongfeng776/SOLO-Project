import request from '@/utils/request'
import type { Vehicle, VehicleQueryParams } from '@/types/vehicle'
import type { PageResult } from '@/utils/request'

export const getVehicleListApi = (params: VehicleQueryParams) => {
  return request.get<PageResult<Vehicle>>('/vehicle', params)
}

export const getVehicleDetailApi = (id: number) => {
  return request.get<Vehicle>(`/vehicle/${id}`)
}

export const createVehicleApi = (data: Partial<Vehicle>) => {
  return request.post<Vehicle>('/vehicle', data)
}

export const updateVehicleApi = (id: number, data: Partial<Vehicle>) => {
  return request.put<Vehicle>(`/vehicle/${id}`, data)
}

export const deleteVehicleApi = (id: number) => {
  return request.delete(`/vehicle/${id}`)
}

export const updateVehicleStatusApi = (id: number, status: number) => {
  return request.put(`/vehicle/${id}/status`, { status })
}

export const auditVehicleApi = (id: number, auditStatus: number, remark?: string) => {
  return request.put(`/vehicle/${id}/audit`, { auditStatus, remark })
}
