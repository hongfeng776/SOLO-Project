import request from '@/utils/request'
import type { Vehicle, VehicleQueryParams, VehicleAuditLog, ValidationResult, BatchImportResult, BatchOperationResult, ImportTemplate, RecalculateLevelResult } from '@/types/vehicle'
import type { PageResult } from '@/utils/request'

export const getVehicleListApi = (params: VehicleQueryParams) => {
  return request.get<PageResult<Vehicle>>('/vehicle', params)
}

export const getVehicleDetailApi = (id: number) => {
  return request.get<Vehicle>(`/vehicle/${id}`)
}

export const checkPlateApi = (plateNumber: string, excludeId?: number) => {
  return request.get<{ valid: boolean; unique: boolean; message: string }>('/vehicle/check/plate', { plateNumber, excludeId })
}

export const checkVINApi = (vin: string, excludeId?: number) => {
  return request.get<{ valid: boolean; unique: boolean; message: string }>('/vehicle/check/vin', { vin, excludeId })
}

export const validateVehicleApi = (data: Partial<Vehicle>, excludeId?: number) => {
  return request.post<ValidationResult>('/vehicle/validate', data, { params: { excludeId } })
}

export const createVehicleApi = (data: Partial<Vehicle>) => {
  return request.post<Vehicle & { levelBreakdown: any[]; totalScore: number }>('/vehicle', data)
}

export const updateVehicleApi = (id: number, data: Partial<Vehicle>) => {
  return request.put<Vehicle & { levelBreakdown: any[]; totalScore: number }>(`/vehicle/${id}`, data)
}

export const deleteVehicleApi = (id: number) => {
  return request.delete(`/vehicle/${id}`)
}

export const updateVehicleStatusApi = (id: number, status: number, remark?: string) => {
  return request.put(`/vehicle/${id}/status`, { status, remark })
}

export const auditVehicleApi = (id: number, auditStatus: number, remark?: string) => {
  return request.put(`/vehicle/${id}/audit`, { auditStatus, remark })
}

export const getVehicleAuditLogsApi = (vehicleId: number, params?: { page?: number; pageSize?: number }) => {
  return request.get<PageResult<VehicleAuditLog>>(`/vehicle/${vehicleId}/logs`, params)
}

export const batchImportApi = (vehicles: Partial<Vehicle>[]) => {
  return request.post<BatchImportResult>('/vehicle/batch/import', { vehicles })
}

export const batchReviewApi = (ids: number[], auditStatus: number, remark?: string) => {
  return request.post<BatchOperationResult>('/vehicle/batch/review', { ids, auditStatus, remark })
}

export const batchMarkExpiredApi = (filter?: { city?: string; capacityType?: number; status?: number }, remark?: string) => {
  return request.post<BatchOperationResult>('/vehicle/batch/expired', { filter, remark })
}

export const batchLockApi = (ids: number[], lockReason?: string) => {
  return request.post<BatchOperationResult>('/vehicle/batch/lock', { ids, lockReason })
}

export const getImportTemplateApi = () => {
  return request.get<ImportTemplate>('/vehicle/import/template')
}

export const recalculateLevelApi = (id: number) => {
  return request.post<RecalculateLevelResult>(`/vehicle/${id}/recalculate-level`)
}

export const lockVehicleApi = (id: number, lockReason: string) => {
  return request.post(`/vehicle/${id}/lock`, { lockReason })
}

export const unlockVehicleApi = (id: number) => {
  return request.post(`/vehicle/${id}/unlock`)
}
