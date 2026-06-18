import { get, post, put } from '@/utils/axios'
import type { PageParams, PageResult } from '@/types'

export interface LevelConfig {
  level: string
  commissionRate: number
  maxChannels: number
  canUseCoupon: boolean
  canUseCashback: boolean
  minOrderAmount: number
  dailyWithdrawLimit: number
}

export interface PermissionCheckResult {
  allowed: boolean
  deniedFields: string[]
  userRole: string
}

export interface FieldValidateResult {
  valid: boolean
  message?: string
}

export interface UniquenessCheckResult {
  valid: boolean
  duplicateFields: {
    field: string
    value: string
    duplicatePromoters: any[]
  }[]
}

export interface QualificationValidateResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface BatchUpdateResult {
  total: number
  success: number
  failed: number
  skipped: number
  details: {
    id: string
    name: string
    status: 'success' | 'failed' | 'skipped'
    reason?: string
  }[]
}

export interface ChangeLogItem {
  id: string
  promoterId: string
  operatorId?: string
  operatorName?: string
  fieldName: string
  fieldLabel?: string
  oldValue?: string
  newValue?: string
  changeType: string
  remark?: string
  metadata?: any
  createdAt: string
  changedAt?: string
}

export interface PromoterManageDetail {
  id: string
  name: string
  phone: string
  avatar?: string
  email?: string
  wechatId?: string
  realName?: string
  idCard?: string
  level: string
  levelConfig?: LevelConfig
  verifyStatus: number
  promoteStatus: number
  settleStatus: number
  commissionRate: number
  channelId?: string
  channelName?: string
  totalOrders?: number
  totalAmount?: number
  totalCommission?: number
  availableCommission?: number
  qualifications?: any[]
  createdAt: string
  updatedAt: string
}

export function getLevelConfigs(): Promise<LevelConfig[]> {
  return get<LevelConfig[]>('/promoter-manage/level-configs')
}

export function checkEditPermission(id: string, editFields: string[]): Promise<PermissionCheckResult> {
  return post<PermissionCheckResult>(`/promoter-manage/${id}/check-permission`, { editFields })
}

export function validateField(field: string, value: any): Promise<FieldValidateResult> {
  return post<FieldValidateResult>('/promoter-manage/validate-field', { field, value })
}

export function checkUniqueness(data: {
  phone?: string
  wechatId?: string
  idCard?: string
  excludePromoterId?: string
}): Promise<UniquenessCheckResult> {
  return post<UniquenessCheckResult>('/promoter-manage/check-uniqueness', data)
}

export function updatePromoterInfo(id: string, data: any): Promise<PromoterManageDetail> {
  return put<PromoterManageDetail>(`/promoter-manage/${id}`, data)
}

export function validateQualification(data: any): Promise<QualificationValidateResult> {
  return post<QualificationValidateResult>('/promoter-manage/validate-qualification', data)
}

export function submitQualification(id: string, data: any): Promise<{ qualificationId: string; warnings: string[] }> {
  return post<{ qualificationId: string; warnings: string[] }>(`/promoter-manage/${id}/qualification`, data)
}

export function reviewQualification(
  qualificationId: string,
  data: { passed: boolean; remark?: string }
): Promise<null> {
  return put<null>(`/promoter-manage/qualification/${qualificationId}/review`, data)
}

export function batchUpdateLevel(ids: string[], targetLevel: string): Promise<BatchUpdateResult> {
  return post<BatchUpdateResult>('/promoter-manage/batch-level', { ids, targetLevel })
}

export function batchUpdatePromoteStatus(
  ids: string[],
  status: number,
  remark?: string
): Promise<BatchUpdateResult> {
  return post<BatchUpdateResult>('/promoter-manage/batch-promote-status', { ids, status, remark })
}

export function batchUpdateSettleStatus(
  ids: string[],
  status: number,
  remark?: string
): Promise<BatchUpdateResult> {
  return post<BatchUpdateResult>('/promoter-manage/batch-settle-status', { ids, status, remark })
}

export function getChangeLogs(id: string, params: PageParams): Promise<PageResult<ChangeLogItem>> {
  return get<PageResult<ChangeLogItem>>(`/promoter-manage/${id}/change-logs`, params)
}

export function getChangeDiff(
  id: string,
  logId: string
): Promise<{ fieldName: string; fieldLabel: string; before: any; after: any }> {
  return get<{ fieldName: string; fieldLabel: string; before: any; after: any }>(
    `/promoter-manage/${id}/change-diff/${logId}`
  )
}

export function getPromoterManageDetail(id: string): Promise<PromoterManageDetail> {
  return get<PromoterManageDetail>(`/promoter-manage/${id}`)
}
