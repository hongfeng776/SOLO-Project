import request from '@/utils/request'
import type { Driver, DriverQueryParams } from '@/types/driver'
import type { PageResult } from '@/utils/request'

export const getDriverListApi = (params: DriverQueryParams) => {
  return request.get<PageResult<Driver>>('/driver', params)
}

export const getDriverDetailApi = (id: number) => {
  return request.get<Driver>(`/driver/${id}`)
}

export const createDriverApi = (data: Partial<Driver>) => {
  return request.post<Driver>('/driver', data)
}

export const updateDriverApi = (id: number, data: Partial<Driver>) => {
  return request.put<Driver>(`/driver/${id}`, data)
}

export const deleteDriverApi = (id: number) => {
  return request.delete(`/driver/${id}`)
}

export const updateDriverStatusApi = (id: number, status: number) => {
  return request.put(`/driver/${id}/status`, { status })
}

export const auditDriverApi = (id: number, auditStatus: number, remark?: string) => {
  return request.put(`/driver/${id}/audit`, { auditStatus, remark })
}

export const getPendingAuditCountApi = () => {
  return request.get<number>('/driver/audit/pending-count')
}
