import { get, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export type DeviceArchiveType = 1 | 2 | 3 | 4
export type DeviceArchiveStatus = 0 | 1 | 2 | 3 | 4 | 5
export type ControlLevel = 1 | 2 | 3
export type QualificationStatus = 0 | 1 | 2

export const DEVICE_TYPE_OPTIONS = [
  { label: 'ATM设备', value: 1 },
  { label: '自助终端', value: 2 },
  { label: '柜台设备', value: 3 },
  { label: '移动展业设备', value: 4 }
]

export const DEVICE_STATUS_OPTIONS = [
  { label: '待入库', value: 0, type: 'info' },
  { label: '已入库', value: 1, type: 'success' },
  { label: '已领用', value: 2, type: 'primary' },
  { label: '维护中', value: 3, type: 'warning' },
  { label: '已报废', value: 4, type: 'danger' },
  { label: '已退回', value: 5, type: 'info' }
]

export const CONTROL_LEVEL_OPTIONS = [
  { label: '一般管控', value: 1, type: 'success' },
  { label: '重点管控', value: 2, type: 'warning' },
  { label: '严格管控', value: 3, type: 'danger' }
]

export const QUALIFICATION_STATUS_OPTIONS = [
  { label: '未提交', value: 0, type: 'info' },
  { label: '已通过', value: 1, type: 'success' },
  { label: '已过期', value: 2, type: 'danger' }
]

export const USAGE_SCENE_OPTIONS = [
  { label: '柜面', value: 'counter' },
  { label: '大堂', value: 'lobby' },
  { label: '户外', value: 'outdoor' },
  { label: '移动', value: 'mobile' }
]

export interface DeviceTypeConfig {
  device_type: DeviceArchiveType
  operation_cycle_days: number
  verification_level: number
  control_level: ControlLevel
  qualification_required: string[]
  key_operation_threshold_years: number
}

export interface DeviceConfig {
  device_types: typeof DEVICE_TYPE_OPTIONS
  statuses: typeof DEVICE_STATUS_OPTIONS
  control_levels: typeof CONTROL_LEVEL_OPTIONS
  qualification_statuses: typeof QUALIFICATION_STATUS_OPTIONS
  device_type_config: Record<number, DeviceTypeConfig>
}

export interface DevicePreCheckRequest {
  sn_code: string
  device_type: DeviceArchiveType
  device_model?: string
  org_id?: string
  install_location?: string
  usage_scene?: string
  purchase_batch?: string
  procurement_date?: string
}

export interface DevicePreCheckResult {
  passed: boolean
  blocked: boolean
  block_reason?: string
  warnings: string[]
  sn_unique: boolean
  model_compliant: boolean
  model_compliant_detail?: string
  qualification_complete: boolean
  missing_qualifications: string[]
  org_matched: boolean
  org_match_detail?: string
  location_matched: boolean
  location_match_detail?: string
  scene_matched: boolean
  scene_match_detail?: string
  device_type_config?: DeviceTypeConfig
  is_old_device: boolean
  control_level: ControlLevel
  control_level_text: string
}

export interface DeviceQualificationItem {
  qualification_type: string
  qualification_no: string
  qualification_name: string
  issue_date?: string
  expire_date?: string
  status?: QualificationStatus
}

export interface DeviceArchive {
  id: string
  sn_code: string
  device_type: DeviceArchiveType
  device_type_text: string
  device_model: string
  status: DeviceArchiveStatus
  status_text: string
  control_level: ControlLevel
  control_level_text: string
  org_id?: string
  org_name?: string
  install_location?: string
  usage_scene?: string
  usage_scene_text?: string
  purchase_batch?: string
  procurement_date?: string
  warranty_expire_date?: string
  supplier?: string
  supplier_contact?: string
  qualifications?: DeviceQualificationItem[]
  qualification_status?: QualificationStatus
  qualification_status_text?: string
  last_verification_date?: string
  next_verification_date?: string
  operation_start_date?: string
  operation_cycle_days?: number
  key_operation_threshold_years?: number
  remark?: string
  operator_id?: string
  operator_name?: string
  reviewer_id?: string
  reviewer_name?: string
  review_time?: string
  create_time?: string
  update_time?: string
  createdAt?: string
  updatedAt?: string
}

export interface DeviceArchiveQueryParams extends PageParams {
  keyword?: string
  sn_code?: string
  device_type?: DeviceArchiveType
  device_model?: string
  status?: DeviceArchiveStatus
  control_level?: ControlLevel
  org_id?: string
  usage_scene?: string
  qualification_status?: QualificationStatus
  supplier?: string
  start_time?: string
  end_time?: string
  purchase_batch?: string
}

export interface CreateDeviceArchiveRequest {
  sn_code: string
  device_type: DeviceArchiveType
  device_model: string
  org_id?: string
  install_location?: string
  usage_scene?: string
  purchase_batch?: string
  procurement_date?: string
  warranty_expire_date?: string
  supplier?: string
  supplier_contact?: string
  qualifications?: DeviceQualificationItem[]
  control_level?: ControlLevel
  remark?: string
}

export interface BatchDeviceArchiveItem {
  index?: number
  sn_code: string
  device_type: DeviceArchiveType
  device_model: string
  org_id?: string
  install_location?: string
  usage_scene?: string
  purchase_batch?: string
  procurement_date?: string
  supplier?: string
  qualifications?: DeviceQualificationItem[]
  control_level?: ControlLevel
  remark?: string
}

export interface BatchDeviceArchiveRequest {
  items: BatchDeviceArchiveItem[]
  remark?: string
}

export interface BatchDeviceArchiveResultItem {
  index: number
  success: boolean
  archive_id?: string
  sn_code?: string
  need_review?: boolean
  errors?: string[]
  warnings?: string[]
  pre_check?: DevicePreCheckResult
}

export interface BatchDeviceArchiveResult {
  success_count: number
  fail_count: number
  review_count: number
  details: BatchDeviceArchiveResultItem[]
}

export interface DeviceTraceRequest {
  sn_code?: string
  org_id?: string
  device_type?: DeviceArchiveType
}

export interface DeviceTraceResult {
  query_params: DeviceTraceRequest
  total_count: number
  records: DeviceArchive[]
  sn_duplicate_check: {
    has_duplicate: boolean
    duplicates: Array<{
      sn_code: string
      device_type: DeviceArchiveType
      create_time: string
    }>
  }
  qualification_check: {
    has_expired: boolean
    expired_items: Array<{
      sn_code: string
      qualification_type: string
      expire_date: string
    }>
  }
  verification_check: {
    has_overdue: boolean
    overdue_items: Array<{
      sn_code: string
      next_verification_date: string
      overdue_days: number
    }>
  }
  control_level_check: {
    has_violation: boolean
    violations: Array<{
      sn_code: string
      control_level: ControlLevel
      violation_detail: string
    }>
  }
  validation_passed: boolean
  risk_prompts: string[]
}

export function getDeviceArchiveConfigApi() {
  return get<DeviceConfig>('/business/device-archive/config')
}

export function preCheckDeviceApi(data: DevicePreCheckRequest) {
  return post<DevicePreCheckResult>('/business/device-archive/precheck', data)
}

export function getDeviceArchiveListApi(params: DeviceArchiveQueryParams) {
  return get<PageResult<DeviceArchive>>('/business/device-archive/list', params)
}

export function getDeviceArchiveDetailApi(id: string) {
  return get<DeviceArchive>(`/business/device-archive/${id}`)
}

export function createDeviceArchiveApi(data: CreateDeviceArchiveRequest) {
  return post<DeviceArchive>('/business/device-archive', data)
}

export function batchDeviceArchiveApi(data: BatchDeviceArchiveRequest) {
  return post<BatchDeviceArchiveResult>('/business/device-archive/batch', data)
}

export function traceDeviceArchiveApi(data: DeviceTraceRequest) {
  return post<DeviceTraceResult>('/business/device-archive/trace', data)
}

export function formatThousands(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
