import { get, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export type DeviceMonitorStatus = 1 | 2 | 3 | 4
export type FaultLevel = 1 | 2 | 3 | 4
export type MonitorStrategy = 1 | 2
export type DataConnectStatus = 0 | 1 | 2
export type FaultStatus = 0 | 1 | 2 | 3
export type MonitorLogType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export const MONITOR_STATUS_OPTIONS = [
  { label: '正常运行', value: 1, type: 'success', color: 'green' },
  { label: '待机休眠', value: 2, type: 'info', color: 'gray' },
  { label: '故障告警', value: 3, type: 'danger', color: 'red' },
  { label: '停机维护', value: 4, type: 'warning', color: 'orange' }
]

export const FAULT_LEVEL_OPTIONS = [
  { label: '轻度', value: 1, type: 'success' },
  { label: '中度', value: 2, type: 'warning' },
  { label: '严重', value: 3, type: 'danger' },
  { label: '紧急', value: 4, type: 'danger' }
]

export const CONNECT_STATUS_OPTIONS = [
  { label: '数据中断', value: 0, type: 'danger' },
  { label: '数据正常', value: 1, type: 'success' },
  { label: '数据延迟', value: 2, type: 'warning' }
]

export const FAULT_STATUS_OPTIONS = [
  { label: '待处理', value: 0, type: 'warning' },
  { label: '处理中', value: 1, type: 'primary' },
  { label: '已修复', value: 2, type: 'success' },
  { label: '已忽略', value: 3, type: 'info' }
]

export const MONITOR_STRATEGY_OPTIONS = [
  { label: '定时轮询', value: 1, type: 'info' },
  { label: '重点监控', value: 2, type: 'warning' }
]

export const MONITOR_LOG_TYPE_OPTIONS = [
  { label: '状态变更', value: 1 },
  { label: '故障上报', value: 2 },
  { label: '数据接入', value: 3 },
  { label: '数据中断', value: 4 },
  { label: '参数异常', value: 5 },
  { label: '运维操作', value: 6 },
  { label: '预警通知', value: 7 },
  { label: '合规校验', value: 8 }
]

export interface DeviceMonitorVO {
  id: string
  archive_no: string
  sn_code: string
  device_type: number
  device_type_text: string
  device_model: string
  manufacturer: string
  monitor_status: DeviceMonitorStatus
  monitor_status_text: string
  fault_level?: FaultLevel
  fault_level_text?: string
  fault_code?: string
  connect_status: DataConnectStatus
  connect_status_text: string
  monitor_strategy: MonitorStrategy
  monitor_strategy_text: string
  last_data_time?: string
  data_delay_seconds?: number
  cpu_usage?: number
  memory_usage?: number
  disk_usage?: number
  temperature?: number
  network_speed?: number
  run_duration_days?: number
  fault_count_7d?: number
  org_id?: string
  org_name?: string
  install_location?: string
  is_key_device: boolean
  remark?: string
  last_fault_time?: string
  created_at?: string
  updated_at?: string
}

export interface DeviceFaultRecordVO {
  id: string
  fault_no: string
  device_id: string
  archive_no: string
  sn_code: string
  device_type: number
  device_type_text: string
  fault_level: FaultLevel
  fault_level_text: string
  fault_code: string
  fault_description: string
  fault_status: FaultStatus
  fault_status_text: string
  occur_time: string
  recover_time?: string
  handler_id?: string
  handler_name?: string
  handle_remark?: string
  org_id?: string
  org_name?: string
  duration_minutes?: number
  is_auto_recovered: boolean
  is_false_alarm: boolean
  created_at?: string
}

export interface DeviceMonitorLogVO {
  id: string
  device_id: string
  archive_no: string
  log_type: MonitorLogType
  log_type_text: string
  before_status?: DeviceMonitorStatus
  before_status_text?: string
  after_status?: DeviceMonitorStatus
  after_status_text?: string
  fault_level?: FaultLevel
  fault_level_text?: string
  fault_code?: string
  operation_detail?: string
  operator_id?: string
  operator_name?: string
  operation_remark?: string
  is_alert: boolean
  created_at?: string
}

export interface DeviceDataCheckResult {
  passed: boolean
  blocked: boolean
  block_reason?: string
  warnings: string[]
  connect_checked: boolean
  connect_status: DataConnectStatus
  connect_status_text: string
  timeliness_checked: boolean
  last_data_time?: string
  data_delay_seconds?: number
  param_complete: boolean
  missing_params: string[]
  fault_codes: string[]
  online_status: DeviceMonitorStatus
  online_status_text: string
  monitor_strategy?: MonitorStrategy
}

export interface DeviceMonitorStatistics {
  total_count: number
  online_count: number
  offline_count: number
  fault_count: number
  normal_ratio: number
  fault_ratio: number
  offline_ratio: number
  today_fault_count: number
  today_recovered_count: number
  key_device_count: number
  key_device_online_count: number
  avg_online_rate: number
}

export interface DeviceMonitorTraceResult {
  device_info?: DeviceMonitorVO
  duplicate_check: {
    passed: boolean
    issues: string[]
    has_fake_online: boolean
    fake_online_count: number
  }
  fault_check: {
    passed: boolean
    issues: string[]
    missed_fault_count: number
    false_alarm_count: number
  }
  data_check: {
    passed: boolean
    issues: string[]
    data_tampering_count: number
    abnormal_records: number
  }
  risk_prompts: string[]
  run_logs: DeviceMonitorLogVO[]
  fault_records: DeviceFaultRecordVO[]
}

export interface DeviceMonitorQueryParams extends PageParams {
  keyword?: string
  archive_no?: string
  sn_code?: string
  device_type?: number
  monitor_status?: DeviceMonitorStatus
  fault_level?: FaultLevel
  connect_status?: DataConnectStatus
  monitor_strategy?: MonitorStrategy
  org_id?: string
  is_key_device?: boolean
  install_location?: string
  start_time?: string
  end_time?: string
}

export interface DeviceFaultQueryParams extends PageParams {
  keyword?: string
  fault_no?: string
  archive_no?: string
  sn_code?: string
  device_type?: number
  fault_level?: FaultLevel
  fault_status?: FaultStatus
  fault_code?: string
  org_id?: string
  is_auto_recovered?: boolean
  is_false_alarm?: boolean
  start_time?: string
  end_time?: string
}

export interface BatchMonitorUpdateResult {
  success_count: number
  fail_count: number
  details: Array<{
    archive_no: string
    sn_code: string
    success: boolean
    error_message?: string
    before_status: DeviceMonitorStatus
    after_status: DeviceMonitorStatus
  }>
}

export function getDeviceMonitorConfigApi() {
  return get('/business/device-monitor/config')
}

export function checkDeviceDataApi(archive_no: string, sn_code: string, device_type: number) {
  return post<DeviceDataCheckResult>('/business/device-monitor/check', {
    archive_no,
    sn_code,
    device_type
  })
}

export function getDeviceMonitorListApi(params: DeviceMonitorQueryParams) {
  return get<PageResult<DeviceMonitorVO>>('/business/device-monitor/list', params)
}

export function getDeviceMonitorStatisticsApi(params?: DeviceMonitorQueryParams) {
  return get<DeviceMonitorStatistics>('/business/device-monitor/statistics', params)
}

export function getDeviceMonitorDetailApi(id: string) {
  return get<DeviceMonitorVO>(`/business/device-monitor/${id}`)
}

export function updateDeviceMonitorApi(
  archive_no: string,
  monitor_status: DeviceMonitorStatus,
  fault_level?: FaultLevel,
  fault_code?: string,
  fault_description?: string,
  operation_remark?: string
) {
  return post<DeviceMonitorVO>('/business/device-monitor/update', {
    archive_no,
    monitor_status,
    fault_level,
    fault_code,
    fault_description,
    operation_remark
  })
}

export function batchUpdateMonitorApi(
  archive_nos: string[],
  target_status: DeviceMonitorStatus,
  fault_level?: FaultLevel,
  fault_code?: string,
  operation_remark?: string
) {
  return post<BatchMonitorUpdateResult>('/business/device-monitor/batch-update', {
    archive_nos,
    target_status,
    fault_level,
    fault_code,
    operation_remark
  })
}

export function getDeviceFaultListApi(params: DeviceFaultQueryParams) {
  return get<PageResult<DeviceFaultRecordVO>>('/business/device-monitor/fault-list', params)
}

export function getDeviceFaultDetailApi(id: string) {
  return get<DeviceFaultRecordVO>(`/business/device-monitor/fault/${id}`)
}

export function handleDeviceFaultApi(
  id: string,
  fault_status: FaultStatus,
  handle_remark?: string
) {
  return post<DeviceFaultRecordVO>(`/business/device-monitor/fault/handle`, {
    id,
    fault_status,
    handle_remark
  })
}

export function getDeviceMonitorLogListApi(params: DeviceMonitorQueryParams & { device_id?: string }) {
  return get<PageResult<DeviceMonitorLogVO>>('/business/device-monitor/log-list', params)
}

export function traceDeviceMonitorApi(
  archive_no?: string,
  sn_code?: string,
  trace_type?: number
) {
  return post<DeviceMonitorTraceResult>('/business/device-monitor/trace', {
    archive_no,
    sn_code,
    trace_type
  })
}
