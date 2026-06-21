import { BaseEntity, PaginationParams } from './common';

export type DeviceArchiveType = 1 | 2 | 3 | 4;
export type DeviceArchiveStatus = 0 | 1 | 2 | 3 | 4 | 5;
export type ControlLevel = 1 | 2 | 3;
export type QualificationStatus = 0 | 1 | 2;

export const DeviceArchiveTypeText: Record<number, string> = {
  1: 'ATM设备',
  2: '自助终端',
  3: '柜台设备',
  4: '移动展业设备'
};

export const DeviceArchiveStatusText: Record<number, string> = {
  0: '待入库',
  1: '已入库',
  2: '已领用',
  3: '维护中',
  4: '已报废',
  5: '已退回'
};

export const ControlLevelText: Record<number, string> = {
  1: '一般管控',
  2: '重点管控',
  3: '严格管控'
};

export const QualificationStatusText: Record<number, string> = {
  0: '未提交',
  1: '已通过',
  2: '已过期'
};

export interface DeviceTypeConfig {
  device_type: DeviceArchiveType;
  operation_cycle_days: number;
  verification_level: number;
  control_level: ControlLevel;
  qualification_required: string[];
  key_operation_threshold_years: number;
}

export const DEVICE_TYPE_CONFIG: Record<number, DeviceTypeConfig> = {
  1: { device_type: 1, operation_cycle_days: 90, verification_level: 2, control_level: 2, qualification_required: ['network_license', 'security_cert', 'atm_cert'], key_operation_threshold_years: 5 },
  2: { device_type: 2, operation_cycle_days: 60, verification_level: 1, control_level: 1, qualification_required: ['network_license', 'security_cert'], key_operation_threshold_years: 4 },
  3: { device_type: 3, operation_cycle_days: 120, verification_level: 2, control_level: 2, qualification_required: ['network_license', 'security_cert', 'counter_cert'], key_operation_threshold_years: 6 },
  4: { device_type: 4, operation_cycle_days: 30, verification_level: 3, control_level: 3, qualification_required: ['network_license', 'security_cert', 'mobile_cert', 'encryption_cert'], key_operation_threshold_years: 3 }
};

export const OLD_DEVICE_THRESHOLD_YEARS = 5;

export interface DevicePreCheckRequest {
  sn_code: string;
  device_type: DeviceArchiveType;
  device_model?: string;
  org_id?: string;
  install_location?: string;
  usage_scene?: string;
  purchase_batch?: string;
  procurement_date?: string;
}

export interface DevicePreCheckResult {
  passed: boolean;
  blocked: boolean;
  block_reason?: string;
  warnings: string[];
  sn_unique: boolean;
  model_compliant: boolean;
  model_compliant_detail?: string;
  qualification_complete: boolean;
  missing_qualifications: string[];
  org_matched: boolean;
  org_match_detail?: string;
  location_matched: boolean;
  location_match_detail?: string;
  scene_matched: boolean;
  scene_match_detail?: string;
  device_type_config?: DeviceTypeConfig;
  is_old_device: boolean;
  control_level: ControlLevel;
  control_level_text: string;
}

export interface CreateDeviceArchiveRequest {
  sn_code: string;
  device_type: DeviceArchiveType;
  device_model: string;
  manufacturer?: string;
  production_date?: string;
  procurement_date?: string;
  purchase_batch?: string;
  org_id?: string;
  org_name?: string;
  install_location?: string;
  usage_scene?: string;
  network_date?: string;
  qualifications?: DeviceQualificationItem[];
  remark?: string;
}

export interface DeviceQualificationItem {
  qualification_type: string;
  qualification_no: string;
  qualification_name: string;
  issue_date?: string;
  expire_date?: string;
  status?: number;
}

export interface DeviceArchiveQueryParams extends PaginationParams {
  keyword?: string;
  archive_no?: string;
  sn_code?: string;
  device_type?: DeviceArchiveType;
  device_model?: string;
  manufacturer?: string;
  status?: DeviceArchiveStatus;
  control_level?: ControlLevel;
  qualification_status?: QualificationStatus;
  org_id?: string;
  purchase_batch?: string;
  is_old_device?: number;
  start_time?: string;
  end_time?: string;
}

export interface DeviceArchive extends BaseEntity {
  archive_no: string;
  sn_code: string;
  device_type: DeviceArchiveType;
  device_model: string;
  manufacturer?: string;
  production_date?: string;
  procurement_date?: string;
  purchase_batch?: string;
  org_id?: string;
  org_name?: string;
  install_location?: string;
  usage_scene?: string;
  network_date?: string;
  control_level: ControlLevel;
  operation_cycle_days: number;
  qualification_status: QualificationStatus;
  qualifications?: string;
  is_old_device: number;
  is_key_operation: number;
  status: DeviceArchiveStatus;
  creator_id?: string;
  batch_id?: string;
  batch_no?: string;
  remark?: string;
}

export interface DeviceArchiveVO extends DeviceArchive {
  device_type_text?: string;
  status_text?: string;
  control_level_text?: string;
  qualification_status_text?: string;
  creator_name?: string;
  org_name_resolved?: string;
  remaining_operation_days?: number;
  qualification_items?: DeviceQualificationItem[];
}

export interface BatchDeviceArchiveItem {
  index?: number;
  sn_code: string;
  device_type: DeviceArchiveType;
  device_model: string;
  manufacturer?: string;
  production_date?: string;
  procurement_date?: string;
  purchase_batch?: string;
  org_id?: string;
  install_location?: string;
  usage_scene?: string;
  remark?: string;
}

export interface BatchDeviceArchiveRequest {
  items: BatchDeviceArchiveItem[];
  purchase_batch?: string;
  remark?: string;
}

export interface BatchDeviceArchiveResultItem {
  index: number;
  success: boolean;
  archive_id?: string;
  archive_no?: string;
  error?: string;
  warning?: string;
  is_old_device?: boolean;
  pre_check_result?: DevicePreCheckResult;
}

export interface DeviceTraceRequest {
  sn_code?: string;
  archive_no?: string;
  org_id?: string;
  device_type?: DeviceArchiveType;
  start_time?: string;
  end_time?: string;
}

export interface DeviceTraceDuplicateItem {
  archive_no: string;
  sn_code: string;
  device_type: number;
  create_time: string;
}

export interface DeviceTraceFakeDeviceItem {
  archive_no: string;
  sn_code: string;
  issue: string;
  detail: string;
}

export interface DeviceTraceExpiredQualItem {
  archive_no: string;
  sn_code: string;
  qualification_type: string;
  qualification_name: string;
  expire_date: string;
  overdue_days: number;
}

export interface DeviceTraceResult {
  query_params: DeviceTraceRequest;
  total_count: number;
  records: DeviceArchiveVO[];
  duplicate_check: {
    has_duplicate: boolean;
    duplicates: DeviceTraceDuplicateItem[];
  };
  fake_device_check: {
    has_fake: boolean;
    fakes: DeviceTraceFakeDeviceItem[];
  };
  qualification_check: {
    has_expired: boolean;
    expired_items: DeviceTraceExpiredQualItem[];
  };
  validation_passed: boolean;
  risk_prompts: string[];
}
