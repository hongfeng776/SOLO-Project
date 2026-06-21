import { BaseEntity, PaginationParams } from './common';

export type DeviceMonitorStatus = 1 | 2 | 3 | 4;
export type FaultLevel = 1 | 2 | 3 | 4;
export type MonitorStrategy = 1 | 2;
export type DataConnectStatus = 0 | 1 | 2;
export type FaultStatus = 0 | 1 | 2 | 3;
export type MonitorLogType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const DeviceMonitorStatusText: Record<number, string> = {
  1: '正常运行',
  2: '待机休眠',
  3: '故障告警',
  4: '停机维护'
};

export const FaultLevelText: Record<number, string> = {
  1: '轻度',
  2: '中度',
  3: '严重',
  4: '紧急'
};

export const MonitorStrategyText: Record<number, string> = {
  1: '定时轮询',
  2: '重点监控'
};

export const DataConnectStatusText: Record<number, string> = {
  0: '数据中断',
  1: '数据正常',
  2: '数据延迟'
};

export const FaultStatusText: Record<number, string> = {
  0: '待处理',
  1: '处理中',
  2: '已修复',
  3: '已忽略'
};

export const MonitorLogTypeText: Record<number, string> = {
  1: '状态变更',
  2: '故障上报',
  3: '数据接入',
  4: '数据中断',
  5: '参数异常',
  6: '运维操作',
  7: '预警通知',
  8: '合规校验'
};

export interface MonitorStatusConfig {
  status: DeviceMonitorStatus;
  status_text: string;
  color: string;
  polling_interval_seconds: number;
  is_alert: boolean;
  fault_level_required?: FaultLevel;
}

export const MONITOR_STATUS_CONFIG: Record<number, MonitorStatusConfig> = {
  1: { status: 1, status_text: '正常运行', color: '#67C23A', polling_interval_seconds: 300, is_alert: false },
  2: { status: 2, status_text: '待机休眠', color: '#909399', polling_interval_seconds: 600, is_alert: false },
  3: { status: 3, status_text: '故障告警', color: '#F56C6C', polling_interval_seconds: 30, is_alert: true, fault_level_required: 2 },
  4: { status: 4, status_text: '停机维护', color: '#E6A23C', polling_interval_seconds: 1200, is_alert: false }
};

export interface DeviceMonitorStrategyConfig {
  device_type: number;
  strategy: MonitorStrategy;
  strategy_text: string;
  polling_interval_seconds: number;
  fault_alert_threshold: number;
  data_timeout_seconds: number;
}

export const DEVICE_MONITOR_STRATEGY: Record<number, DeviceMonitorStrategyConfig> = {
  1: { device_type: 1, strategy: 2, strategy_text: '重点监控', polling_interval_seconds: 60, fault_alert_threshold: 2, data_timeout_seconds: 120 },
  2: { device_type: 2, strategy: 1, strategy_text: '定时轮询', polling_interval_seconds: 300, fault_alert_threshold: 3, data_timeout_seconds: 300 },
  3: { device_type: 3, strategy: 2, strategy_text: '重点监控', polling_interval_seconds: 120, fault_alert_threshold: 2, data_timeout_seconds: 180 },
  4: { device_type: 4, strategy: 2, strategy_text: '重点监控', polling_interval_seconds: 180, fault_alert_threshold: 3, data_timeout_seconds: 240 }
};

export const FAULT_CODE_PATTERNS: Record<string, { level: FaultLevel; description: string }> = {
  'E001': { level: 4, description: '设备硬件严重故障' },
  'E002': { level: 3, description: '网络连接异常' },
  'E003': { level: 2, description: '传感器数据异常' },
  'E004': { level: 3, description: '通信模块故障' },
  'E005': { level: 1, description: '存储空间不足' },
  'E006': { level: 2, description: '电源电压异常' },
  'E007': { level: 4, description: '安全模块故障' },
  'E008': { level: 3, description: '打印机故障' },
  'E009': { level: 2, description: '读卡器故障' },
  'E010': { level: 1, description: '温度过高告警' }
};

export interface DeviceDataCheckRequest {
  archive_no: string;
  sn_code: string;
  device_type: number;
}

export interface DeviceDataCheckResult {
  passed: boolean;
  blocked: boolean;
  block_reason?: string;
  warnings: string[];
  connect_checked: boolean;
  connect_status: DataConnectStatus;
  connect_status_text: string;
  timeliness_checked: boolean;
  last_data_time?: string;
  data_delay_seconds?: number;
  param_complete: boolean;
  missing_params: string[];
  fault_codes: string[];
  online_status: DeviceMonitorStatus;
  online_status_text: string;
  monitor_strategy?: DeviceMonitorStrategyConfig;
}

export interface DeviceMonitorQueryParams extends PaginationParams {
  keyword?: string;
  archive_no?: string;
  sn_code?: string;
  device_type?: number;
  monitor_status?: DeviceMonitorStatus;
  fault_level?: FaultLevel;
  connect_status?: DataConnectStatus;
  monitor_strategy?: MonitorStrategy;
  org_id?: string;
  is_key_device?: number;
  has_fault?: number;
  start_time?: string;
  end_time?: string;
}

export interface DeviceMonitorVO extends BaseEntity {
  archive_no: string;
  sn_code: string;
  device_type: number;
  device_type_text: string;
  device_model: string;
  manufacturer: string;
  monitor_status: DeviceMonitorStatus;
  monitor_status_text: string;
  fault_level?: FaultLevel;
  fault_level_text?: string;
  fault_code?: string;
  connect_status: DataConnectStatus;
  connect_status_text: string;
  monitor_strategy: MonitorStrategy;
  monitor_strategy_text: string;
  last_data_time?: string;
  data_delay_seconds?: number;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  temperature?: number;
  network_speed?: number;
  run_duration_days?: number;
  fault_count_7d?: number;
  org_id?: string;
  org_name?: string;
  install_location?: string;
  is_key_device: number;
  remark?: string;
  last_fault_time?: string;
}

export interface DeviceMonitorUpdateRequest {
  archive_no: string;
  monitor_status: DeviceMonitorStatus;
  fault_level?: FaultLevel;
  fault_code?: string;
  fault_description?: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  temperature?: number;
  network_speed?: number;
  operation_remark?: string;
  operator_id?: string;
}

export interface DeviceFaultRecordVO extends BaseEntity {
  fault_no: string;
  device_id: string;
  archive_no: string;
  sn_code: string;
  device_type: number;
  device_type_text: string;
  fault_level: FaultLevel;
  fault_level_text: string;
  fault_code: string;
  fault_description: string;
  fault_status: FaultStatus;
  fault_status_text: string;
  occur_time: string;
  recover_time?: string;
  handler_id?: string;
  handler_name?: string;
  handle_remark?: string;
  org_id?: string;
  org_name?: string;
  duration_minutes?: number;
  is_auto_recovered: number;
  is_false_alarm: number;
}

export interface DeviceFaultQueryParams extends PaginationParams {
  keyword?: string;
  fault_no?: string;
  archive_no?: string;
  sn_code?: string;
  device_type?: number;
  fault_level?: FaultLevel;
  fault_status?: FaultStatus;
  fault_code?: string;
  org_id?: string;
  is_false_alarm?: number;
  start_time?: string;
  end_time?: string;
}

export interface DeviceMonitorLogVO extends BaseEntity {
  device_id: string;
  archive_no: string;
  log_type: MonitorLogType;
  log_type_text: string;
  before_status?: DeviceMonitorStatus;
  before_status_text?: string;
  after_status?: DeviceMonitorStatus;
  after_status_text?: string;
  fault_level?: FaultLevel;
  fault_level_text?: string;
  fault_code?: string;
  operation_detail?: string;
  operator_id?: string;
  operator_name?: string;
  operation_remark?: string;
  is_alert: number;
}

export interface DeviceMonitorLogQueryParams extends PaginationParams {
  device_id?: string;
  archive_no?: string;
  log_type?: MonitorLogType;
  is_alert?: number;
  start_time?: string;
  end_time?: string;
}

export interface DeviceMonitorTraceRequest {
  archive_no?: string;
  sn_code?: string;
  trace_type?: 'run' | 'fault' | 'data' | 'all';
}

export interface DeviceMonitorTraceResult {
  device_info?: DeviceMonitorVO;
  duplicate_check: {
    passed: boolean;
    issues: string[];
    has_fake_online: boolean;
    fake_online_count: number;
  };
  fault_check: {
    passed: boolean;
    issues: string[];
    missed_fault_count: number;
    false_alarm_count: number;
  };
  data_check: {
    passed: boolean;
    issues: string[];
    data_tampering_count: number;
    abnormal_records: number;
  };
  risk_prompts: string[];
  run_logs: DeviceMonitorLogVO[];
  fault_records: DeviceFaultRecordVO[];
}

export interface DeviceMonitorStatistics {
  total_count: number;
  online_count: number;
  offline_count: number;
  fault_count: number;
  normal_ratio: number;
  fault_ratio: number;
  offline_ratio: number;
  today_fault_count: number;
  today_recovered_count: number;
  key_device_count: number;
  key_device_online_count: number;
  avg_online_rate: number;
}

export interface BatchMonitorUpdateRequest {
  archive_nos: string[];
  target_status: DeviceMonitorStatus;
  fault_level?: FaultLevel;
  fault_code?: string;
  operation_remark?: string;
}

export interface BatchMonitorUpdateResult {
  success_count: number;
  fail_count: number;
  details: {
    archive_no: string;
    sn_code: string;
    success: boolean;
    error_message?: string;
    before_status: DeviceMonitorStatus;
    after_status: DeviceMonitorStatus;
  }[];
}
