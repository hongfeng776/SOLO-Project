import request from '@/utils/request'
import type { Vehicle, VehicleQueryParams, VehicleAuditLog, ValidationResult, BatchImportResult, BatchOperationResult, ImportTemplate, RecalculateLevelResult, VehicleMaintenanceRecord, VehicleViolationRecord, VehicleStatusLog, StatusChangeValidation, CapacityDashboard, VehicleComplianceCheck, VehicleRectification, ComplianceStandards, ComplianceReport, FieldValidationResult, MaintenancePriorityResult, MaintenanceValidationResult, MaintenanceCostStatistics } from '@/types/vehicle'
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

export const changeOperationStatusApi = (id: number, operationStatus: number, remark?: string) => {
  return request.post<{ validation: StatusChangeValidation; capacityImpact: any }>(`/vehicle/${id}/operation-status`, { operationStatus, remark })
}

export const getMaintenanceRecordsApi = (vehicleId: number, params?: { page?: number; pageSize?: number; maintenanceType?: number; maintenanceStatus?: number }) => {
  return request.get<PageResult<VehicleMaintenanceRecord>>(`/vehicle/${vehicleId}/maintenance`, params)
}

export const createMaintenanceRecordApi = (vehicleId: number, data: Partial<VehicleMaintenanceRecord>) => {
  return request.post<VehicleMaintenanceRecord>(`/vehicle/${vehicleId}/maintenance`, data)
}

export const updateMaintenanceRecordApi = (id: number, recordId: number, data: Partial<VehicleMaintenanceRecord>) => {
  return request.put<VehicleMaintenanceRecord>(`/vehicle/${id}/maintenance/${recordId}`, data)
}

export const getViolationRecordsApi = (vehicleId: number, params?: { page?: number; pageSize?: number; violationType?: number; violationStatus?: number }) => {
  return request.get<PageResult<VehicleViolationRecord>>(`/vehicle/${vehicleId}/violations`, params)
}

export const createViolationRecordApi = (vehicleId: number, data: Partial<VehicleViolationRecord>) => {
  return request.post<VehicleViolationRecord>(`/vehicle/${vehicleId}/violations`, data)
}

export const getStatusLogsApi = (vehicleId: number, params?: { page?: number; pageSize?: number; changeType?: number; triggerType?: number; alertLevel?: number; isAnomaly?: number }) => {
  return request.get<PageResult<VehicleStatusLog>>(`/vehicle/${vehicleId}/status-logs`, params)
}

export const batchRestoreOperationApi = (ids: number[], remark?: string) => {
  return request.post<BatchOperationResult>('/vehicle/batch/restore', { ids, remark })
}

export const batchInitiateMaintenanceApi = (ids: number[], data?: Partial<VehicleMaintenanceRecord>) => {
  return request.post<BatchOperationResult>('/vehicle/batch/maintenance', { ids, ...data })
}

export const batchRemindRenewalApi = (ids: number[]) => {
  return request.post<BatchOperationResult>('/vehicle/batch/remind-renewal', { ids })
}

export const getCapacityDashboardApi = () => {
  return request.get<CapacityDashboard>('/vehicle/capacity/dashboard')
}

export const validateStatusChangeApi = (id: number, operationStatus: number) => {
  return request.post<StatusChangeValidation>(`/vehicle/${id}/validate-status`, { operationStatus })
}

export const performComplianceCheckApi = (id: number, checkType: number = 4) => {
  return request.post<VehicleComplianceCheck>(`/vehicle/${id}/compliance-check`, { checkType })
}

export const getComplianceChecksApi = (vehicleId: number, params?: {
  page?: number
  pageSize?: number
  checkType?: number
  checkStatus?: number
  complianceLevel?: number
}) => {
  return request.get<PageResult<VehicleComplianceCheck>>(`/vehicle/${vehicleId}/compliance-checks`, params)
}

export const getComplianceStandardsApi = (city: string) => {
  return request.get<ComplianceStandards>('/vehicle/compliance/standards', { city })
}

export const validateComplianceFieldApi = (field: string, value: any, vehicleId?: number) => {
  return request.post<FieldValidationResult>('/vehicle/compliance/validate-field', { field, value, vehicleId })
}

export const createRectificationApi = (vehicleId: number, data: Partial<VehicleRectification>) => {
  return request.post<VehicleRectification>(`/vehicle/${vehicleId}/rectification`, data)
}

export const getRectificationsApi = (vehicleId: number, params?: {
  page?: number
  pageSize?: number
  rectificationType?: number
  rectificationStatus?: number
}) => {
  return request.get<PageResult<VehicleRectification>>(`/vehicle/${vehicleId}/rectifications`, params)
}

export const reviewRectificationApi = (id: number, rectId: number, reviewResult: number, reviewRemark?: string) => {
  return request.put<VehicleRectification>(`/vehicle/${id}/rectification/${rectId}/review`, { reviewResult, reviewRemark })
}

export const batchComplianceCheckApi = (ids: number[], checkType: number = 4) => {
  return request.post<BatchOperationResult>('/vehicle/batch/compliance-check', { ids, checkType })
}

export const batchRemindRectificationApi = (ids: number[]) => {
  return request.post<BatchOperationResult>('/vehicle/batch/remind-rectification', { ids })
}

export const exportComplianceReportApi = (vehicleId: number) => {
  return request.get<ComplianceReport>(`/vehicle/${vehicleId}/compliance-report`)
}

export const getMaintenancePriorityApi = (id: number) => {
  return request.get<MaintenancePriorityResult>(`/vehicle/${id}/maintenance-priority`)
}

export const verifyMaintenanceRecordApi = (id: number, recordId: number, data: { verifiedBy: string; reviewRemark?: string }) => {
  return request.post<VehicleMaintenanceRecord>(`/vehicle/${id}/maintenance/${recordId}/verify`, data)
}

export const batchScheduleMaintenanceApi = (vehicleIds: number[], scheduleData: { scheduledDate: string; maintenanceType: number; maintenanceStation: string }) => {
  return request.post<BatchOperationResult>('/vehicle/maintenance/batch-schedule', { vehicleIds, scheduleData })
}

export const batchUpdateMaintenanceStatusApi = (maintenanceIds: number[], newStatus: number) => {
  return request.post<BatchOperationResult>('/vehicle/maintenance/batch-update-status', { maintenanceIds, newStatus })
}

export const batchMaintenanceCostStatsApi = (vehicleIds: number[], dateRange?: { startDate: string; endDate: string }) => {
  return request.post<MaintenanceCostStatistics>('/vehicle/maintenance/cost-statistics', { vehicleIds, dateRange })
}
