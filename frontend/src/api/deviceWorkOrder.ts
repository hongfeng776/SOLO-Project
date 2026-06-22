import { get, post, put } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export type WorkOrderType = 1 | 2 | 3 | 4
export type WorkOrderStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type MaintenanceLevel = 1 | 2 | 3 | 4
export type AcceptanceStatus = 0 | 1 | 2 | 3
export type TaskStatus = 0 | 1 | 2 | 3 | 4
export type WorkOrderLogType = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type WarrantyStatus = 0 | 1 | 2

export const WORK_ORDER_TYPE_OPTIONS = [
  { label: '日常保养', value: 1, type: 'info', color: '#909399' },
  { label: '故障维修', value: 2, type: 'danger', color: '#f56c6c' },
  { label: '定期检修', value: 3, type: 'warning', color: '#e6a23c' },
  { label: '报废核验', value: 4, type: 'primary', color: '#409eff' }
]

export const WORK_ORDER_STATUS_OPTIONS = [
  { label: '草稿', value: 0, type: 'info', color: '#909399' },
  { label: '待派单', value: 1, type: 'warning', color: '#e6a23c' },
  { label: '已派单', value: 2, type: 'primary', color: '#409eff' },
  { label: '处理中', value: 3, type: 'primary', color: '#409eff' },
  { label: '待验收', value: 4, type: 'warning', color: '#e6a23c' },
  { label: '已完成', value: 5, type: 'success', color: '#67c23a' },
  { label: '已取消', value: 6, type: 'info', color: '#909399' }
]

export const MAINTENANCE_LEVEL_OPTIONS = [
  { label: '一级', value: 1, type: 'success', color: '#67c23a' },
  { label: '二级', value: 2, type: 'info', color: '#909399' },
  { label: '三级', value: 3, type: 'warning', color: '#e6a23c' },
  { label: '四级', value: 4, type: 'danger', color: '#f56c6c' }
]

export const ACCEPTANCE_STATUS_OPTIONS = [
  { label: '未验收', value: 0, type: 'info', color: '#909399' },
  { label: '通过', value: 1, type: 'success', color: '#67c23a' },
  { label: '不通过', value: 2, type: 'danger', color: '#f56c6c' },
  { label: '验收中', value: 3, type: 'warning', color: '#e6a23c' }
]

export const TASK_STATUS_OPTIONS = [
  { label: '草稿', value: 0, type: 'info', color: '#909399' },
  { label: '待执行', value: 1, type: 'warning', color: '#e6a23c' },
  { label: '执行中', value: 2, type: 'primary', color: '#409eff' },
  { label: '已完成', value: 3, type: 'success', color: '#67c23a' },
  { label: '已取消', value: 4, type: 'info', color: '#909399' }
]

export const WORK_ORDER_LOG_TYPE_OPTIONS = [
  { label: '工单创建', value: 1, type: 'info' },
  { label: '工单派单', value: 2, type: 'primary' },
  { label: '开始处理', value: 3, type: 'primary' },
  { label: '提交验收', value: 4, type: 'warning' },
  { label: '验收通过', value: 5, type: 'success' },
  { label: '验收不通过', value: 6, type: 'danger' },
  { label: '工单取消', value: 7, type: 'info' }
]

export const PRIORITY_OPTIONS = [
  { label: '低', value: 1, type: 'info', color: '#909399' },
  { label: '中', value: 2, type: 'primary', color: '#409eff' },
  { label: '高', value: 3, type: 'warning', color: '#e6a23c' },
  { label: '紧急', value: 4, type: 'danger', color: '#f56c6c' }
]

export const WARRANTY_STATUS_OPTIONS = [
  { label: '不在保', value: 0, type: 'info', color: '#909399' },
  { label: '在保', value: 1, type: 'success', color: '#67c23a' },
  { label: '即将到期', value: 2, type: 'warning', color: '#e6a23c' }
]

export interface WorkOrderTypeConfig {
  order_type: WorkOrderType
  order_type_text: string
  maintenance_level: MaintenanceLevel
  maintenance_level_text: string
  standard_process: string[]
  acceptance_standard: string[]
  cost_calculation_rule: string
  estimated_hours: number
  required_qualifications: string[]
}

export interface WorkOrderPreCheckResult {
  passed: boolean
  blocked: boolean
  block_reason?: string
  warnings: string[]
  fault_checked: boolean
  has_active_fault: boolean
  fault_description?: string
  permission_checked: boolean
  has_permission: boolean
  qualification_checked: boolean
  has_valid_qualification: boolean
  missing_qualifications: string[]
  warranty_checked: boolean
  warranty_status: WarrantyStatus
  warranty_status_text: string
  warranty_expire_date?: string
  banned_checked: boolean
  is_banned: boolean
  ban_reason?: string
  normal_device_blocked: boolean
  normal_device_detail?: string
  order_type_config?: WorkOrderTypeConfig
}

export interface DeviceWorkOrderVO {
  id: string
  order_no: string
  archive_no: string
  sn_code: string
  device_type: number
  device_type_text: string
  device_model: string
  manufacturer: string
  order_type: WorkOrderType
  order_type_text: string
  maintenance_level: MaintenanceLevel
  maintenance_level_text: string
  status: WorkOrderStatus
  status_text: string
  fault_description?: string
  fault_code?: string
  maintenance_content?: string
  maintenance_result?: string
  acceptance_status: AcceptanceStatus
  acceptance_status_text: string
  acceptance_remark?: string
  acceptance_time?: string
  acceptance_by?: string
  acceptance_by_name?: string
  assignee_id?: string
  assignee_name?: string
  creator_id: string
  creator_name: string
  org_id?: string
  org_name?: string
  install_location?: string
  priority: number
  priority_text: string
  expected_finish_time?: string
  actual_finish_time?: string
  cost_estimate?: number
  cost_actual?: number
  is_overdue: number
  warranty_status: WarrantyStatus
  warranty_status_text: string
  remark?: string
  used_parts?: string
  maintenance_hours?: number
  created_at?: string
  updated_at?: string
}

export interface DeviceMaintenanceTaskVO {
  id: string
  task_no: string
  task_name: string
  order_type: WorkOrderType
  order_type_text: string
  task_status: TaskStatus
  task_status_text: string
  total_count: number
  completed_count: number
  pending_count: number
  progress: number
  start_date: string
  end_date: string
  priority: number
  priority_text: string
  assignee_id?: string
  assignee_name?: string
  creator_id: string
  creator_name: string
  org_id?: string
  org_name?: string
  is_old_device_filter: number
  fault_frequency_min?: number
  min_usage_years?: number
  max_usage_years?: number
  remark?: string
  device_list?: string
  created_at?: string
  updated_at?: string
}

export interface DeviceWorkOrderLogVO {
  id: string
  order_id: string
  order_no: string
  log_type: WorkOrderLogType
  log_type_text: string
  before_status?: WorkOrderStatus
  before_status_text?: string
  after_status?: WorkOrderStatus
  after_status_text?: string
  operation_detail?: string
  operator_id: string
  operator_name: string
  operation_remark?: string
  created_at?: string
}

export interface WorkOrderTraceResult {
  device_info?: {
    archive_no: string
    sn_code: string
    device_type: number
    device_type_text: string
    usage_years: number
    fault_count_total: number
    maintenance_count_total: number
    avg_recovery_hours: number
  }
  fake_maintenance_check: {
    passed: boolean
    issues: string[]
    fake_count: number
  }
  violation_check: {
    passed: boolean
    issues: string[]
    violation_count: number
  }
  acceptance_check: {
    passed: boolean
    issues: string[]
    perfunctory_count: number
  }
  risk_prompts: string[]
  work_order_history: DeviceWorkOrderVO[]
  maintenance_logs: DeviceWorkOrderLogVO[]
}

export interface WorkOrderStatistics {
  total_count: number
  pending_count: number
  processing_count: number
  acceptance_count: number
  completed_count: number
  cancelled_count: number
  overdue_count: number
  today_created_count: number
  today_completed_count: number
  avg_processing_hours: number
  monthly_cost: number
  type_distribution: Record<number, number>
}

export interface WorkOrderQueryParams extends PageParams {
  keyword?: string
  order_no?: string
  archive_no?: string
  sn_code?: string
  device_type?: number
  order_type?: WorkOrderType
  status?: WorkOrderStatus
  maintenance_level?: MaintenanceLevel
  acceptance_status?: AcceptanceStatus
  assignee_id?: string
  org_id?: string
  priority?: number
  is_overdue?: number
  start_time?: string
  end_time?: string
}

export interface MaintenanceTaskQueryParams extends PageParams {
  keyword?: string
  task_no?: string
  order_type?: WorkOrderType
  task_status?: TaskStatus
  assignee_id?: string
  org_id?: string
  start_time?: string
  end_time?: string
}

export interface CreateWorkOrderRequest {
  archive_no: string
  sn_code: string
  device_type: number
  order_type: WorkOrderType
  maintenance_level?: MaintenanceLevel
  fault_description?: string
  fault_code?: string
  expected_finish_time?: string
  assignee_id?: string
  assignee_name?: string
  org_id?: string
  priority?: 1 | 2 | 3 | 4
  remark?: string
  cost_estimate?: number
}

export interface UpdateWorkOrderRequest {
  status: WorkOrderStatus
  maintenance_content?: string
  maintenance_result?: string
  acceptance_status?: AcceptanceStatus
  acceptance_remark?: string
  cost_actual?: number
  used_parts?: string
  maintenance_hours?: number
  assignee_id?: string
  assignee_name?: string
  remark?: string
}

export interface CreateBatchTaskRequest {
  order_type: WorkOrderType
  task_name: string
  device_type?: number
  org_id?: string
  is_old_device?: number
  fault_frequency_min?: number
  min_usage_years?: number
  max_usage_years?: number
  start_date: string
  end_date: string
  priority?: number
  assignee_id?: string
  assignee_name?: string
  remark?: string
}

export interface WorkOrderConfig {
  order_types: typeof WORK_ORDER_TYPE_OPTIONS
  statuses: typeof WORK_ORDER_STATUS_OPTIONS
  maintenance_levels: typeof MAINTENANCE_LEVEL_OPTIONS
  acceptance_statuses: typeof ACCEPTANCE_STATUS_OPTIONS
  priorities: typeof PRIORITY_OPTIONS
  order_type_config: Record<number, WorkOrderTypeConfig>
}

export function getWorkOrderConfigApi() {
  return get<WorkOrderConfig>('/business/device-workorder/config')
}

export function preCheckWorkOrderApi(archive_no: string, sn_code: string, order_type: WorkOrderType) {
  return post<WorkOrderPreCheckResult>('/business/device-workorder/precheck', {
    archive_no,
    sn_code,
    order_type
  })
}

export function getWorkOrderListApi(params: WorkOrderQueryParams) {
  return get<PageResult<DeviceWorkOrderVO>>('/business/device-workorder/list', params)
}

export function getWorkOrderStatisticsApi(params?: WorkOrderQueryParams) {
  return get<WorkOrderStatistics>('/business/device-workorder/statistics', params)
}

export function getWorkOrderDetailApi(id: string) {
  return get<DeviceWorkOrderVO>(`/business/device-workorder/${id}`)
}

export function createWorkOrderApi(data: CreateWorkOrderRequest) {
  return post<DeviceWorkOrderVO>('/business/device-workorder/', data)
}

export function updateWorkOrderApi(id: string, status: WorkOrderStatus, data?: Partial<UpdateWorkOrderRequest>) {
  return put<DeviceWorkOrderVO>(`/business/device-workorder/${id}`, {
    status,
    ...data
  })
}

export function getMaintenanceTaskListApi(params: MaintenanceTaskQueryParams) {
  return get<PageResult<DeviceMaintenanceTaskVO>>('/business/device-workorder/task/list', params)
}

export function getMaintenanceTaskDetailApi(id: string) {
  return get<DeviceMaintenanceTaskVO>(`/business/device-workorder/task/${id}`)
}

export function createBatchTaskApi(data: CreateBatchTaskRequest) {
  return post<DeviceMaintenanceTaskVO>('/business/device-workorder/task/batch', data)
}

export function getWorkOrderLogListApi(params: WorkOrderQueryParams & { order_id?: string }) {
  return get<PageResult<DeviceWorkOrderLogVO>>('/business/device-workorder/log/list', params)
}

export function traceWorkOrderApi(
  archive_no?: string,
  sn_code?: string,
  trace_type?: number
) {
  return post<WorkOrderTraceResult>('/business/device-workorder/trace', {
    archive_no,
    sn_code,
    trace_type
  })
}
