import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'
import type {
  LogisticsProvider,
  LogisticsProviderFullInfo,
  ProviderEditPermission,
  ValidationResult,
  ProviderStatistics
} from '@/types/business'

export enum LogisticsProviderLevel {
  ENTRY = 1,
  BRONZE = 2,
  SILVER = 3,
  GOLD = 4,
  PLATINUM = 5,
}

export enum LogisticsProviderStatus {
  DISABLED = 0,
  ENABLED = 1,
  PENDING_REVIEW = 2,
  ARCHIVED = 3,
}

export enum CooperationStatus {
  NOT_COOPERATING = 0,
  COOPERATING = 1,
  COOPERATION_SUSPENDED = 2,
  COOPERATION_TERMINATED = 3,
}

export const ProviderLevelMap: Record<number, { label: string; type: string }> = {
  [LogisticsProviderLevel.ENTRY]: { label: '入门级', type: 'info' },
  [LogisticsProviderLevel.BRONZE]: { label: '青铜', type: 'warning' },
  [LogisticsProviderLevel.SILVER]: { label: '白银', type: 'info' },
  [LogisticsProviderLevel.GOLD]: { label: '黄金', type: 'warning' },
  [LogisticsProviderLevel.PLATINUM]: { label: '铂金', type: 'danger' },
}

export const ProviderStatusMap: Record<number, { label: string; type: string }> = {
  [LogisticsProviderStatus.DISABLED]: { label: '已禁用', type: 'info' },
  [LogisticsProviderStatus.ENABLED]: { label: '已启用', type: 'success' },
  [LogisticsProviderStatus.PENDING_REVIEW]: { label: '待审核', type: 'warning' },
  [LogisticsProviderStatus.ARCHIVED]: { label: '已归档', type: 'info' },
}

export const CooperationStatusMap: Record<number, { label: string; type: string }> = {
  [CooperationStatus.NOT_COOPERATING]: { label: '未合作', type: 'info' },
  [CooperationStatus.COOPERATING]: { label: '合作中', type: 'success' },
  [CooperationStatus.COOPERATION_SUSPENDED]: { label: '合作暂停', type: 'warning' },
  [CooperationStatus.COOPERATION_TERMINATED]: { label: '合作终止', type: 'danger' },
}

export interface ProviderQueryParams extends PageParams {
  keyword?: string
  level?: number
  status?: number
  cooperationStatus?: number
  province?: string
  city?: string
  serviceCapability?: string
  startDate?: string
  endDate?: string
  supportCod?: number
  supportColdChain?: number
}

export interface ProviderCreateData extends Partial<LogisticsProvider> {
  confirmPassword?: string
}

export interface ProviderUpdateData {
  id: number
  data: Partial<LogisticsProvider>
  isCoreChange?: boolean
  confirmedByName?: string
  changeReason?: string
}

export interface ProviderStatusUpdate {
  status: number
  reason?: string
}

export interface CooperationStatusUpdate {
  cooperationStatus: number
  effectiveDate?: string
  terminateDate?: string
  reason?: string
}

export interface FieldValidateError {
  field: string
  message: string
  isFormat?: boolean
}

export function getProviderList(params: ProviderQueryParams): Promise<ApiResponse<PageResult<LogisticsProvider>>> {
  return request.get<PageResult<LogisticsProvider>>('/logisticsProvider/list', { params })
}

export function getProviderDetail(id: number): Promise<ApiResponse<LogisticsProvider>> {
  return request.get<LogisticsProvider>(`/logisticsProvider/detail/${id}`)
}

export function getProviderFullInfo(id: number): Promise<ApiResponse<LogisticsProviderFullInfo>> {
  return request.get<LogisticsProviderFullInfo>(`/logisticsProvider/full-info/${id}`)
}

export function getStatistics(): Promise<ApiResponse<ProviderStatistics>> {
  return request.get<ProviderStatistics>('/logisticsProvider/statistics')
}

export function generateProviderCode(): Promise<ApiResponse<{ code: string }>> {
  return request.get<{ code: string }>('/logisticsProvider/generate-code')
}

export function getEditPermission(id: number): Promise<ApiResponse<ProviderEditPermission>> {
  return request.get<ProviderEditPermission>(`/logisticsProvider/edit-permission/${id}`)
}

export function validateBeforeCreate(data: Partial<LogisticsProvider>): Promise<ApiResponse<{
  passed: boolean
  blockItems: FieldValidateError[]
  warningItems: FieldValidateError[]
}>> {
  return request.post('/logisticsProvider/validate-before-create', data)
}

export function createProvider(data: ProviderCreateData): Promise<ApiResponse<LogisticsProvider>> {
  return request.post<LogisticsProvider>('/logisticsProvider/create', data)
}

export function updateProvider(data: ProviderUpdateData): Promise<ApiResponse<LogisticsProvider>> {
  return request.put<LogisticsProvider>(`/logisticsProvider/update/${data.id}`, data)
}

export function deleteProvider(id: number): Promise<ApiResponse<boolean>> {
  return request.delete<boolean>(`/logisticsProvider/delete/${id}`)
}

export function archiveProvider(id: number, reason?: string): Promise<ApiResponse<boolean>> {
  return request.post<boolean>(`/logisticsProvider/archive/${id}`, { reason })
}

export function updateProviderStatus(id: number, data: ProviderStatusUpdate): Promise<ApiResponse<LogisticsProvider>> {
  return request.put<LogisticsProvider>(`/logisticsProvider/status/${id}`, data)
}

export function updateCooperationStatus(id: number, data: CooperationStatusUpdate): Promise<ApiResponse<LogisticsProvider>> {
  return request.put<LogisticsProvider>(`/logisticsProvider/cooperation-status/${id}`, data)
}
