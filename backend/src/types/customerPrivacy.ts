import { BaseEntity, PaginationParams } from './common';

export type PrivacySceneType = 1 | 2 | 3 | 4;
export type PrivacyOperationType = 1 | 2 | 3 | 4;
export type DesensitizationLevel = 1 | 2 | 3 | 4;
export type BlockType = 0 | 1 | 2 | 3 | 4 | 5;
export type OperatorPosition = 1 | 2 | 3 | 4 | 5;
export type SensitivityLevel = 1 | 2 | 3 | 4;
export type RuleStatus = 0 | 1;
export type CustomerType = 1 | 2;

export const PRIVACY_SCENE_MAP: Record<number, string> = {
  1: '日常运维查看',
  2: '业务审核查看',
  3: '风控核查查看',
  4: '审计溯源查看'
};

export const OPERATION_TYPE_MAP: Record<number, string> = {
  1: '查看',
  2: '导出',
  3: '修改',
  4: '删除'
};

export const DESENSITIZATION_LEVEL_MAP: Record<number, string> = {
  1: '不脱敏',
  2: '部分脱敏',
  3: '完全脱敏',
  4: '加密展示'
};

export const BLOCK_TYPE_MAP: Record<number, string> = {
  0: '无',
  1: '权限不足',
  2: '未备案',
  3: '违规操作',
  4: '高频访问',
  5: '批量恶意导出'
};

export const OPERATOR_POSITION_MAP: Record<number, string> = {
  1: '柜员',
  2: '客户经理',
  3: '风控专员',
  4: '审计员',
  5: '管理员'
};

export const SENSITIVITY_LEVEL_MAP: Record<number, string> = {
  1: '低',
  2: '中',
  3: '高',
  4: '极高'
};

export const RULE_STATUS_MAP: Record<number, string> = {
  0: '禁用',
  1: '启用'
};

export const CUSTOMER_TYPE_MAP: Record<number, string> = {
  1: '个人',
  2: '企业'
};

export const CUSTOMER_LEVEL_MAP: Record<number, string> = {
  0: '全部',
  1: '普通',
  2: '银卡',
  3: '金卡',
  4: '白金',
  5: '钻石'
};

export interface DesensitizationRuleConfig {
  field: string;
  field_name: string;
  desensitization_type: 'mask' | 'replace' | 'encrypt' | 'hide';
  mask_start?: number;
  mask_end?: number;
  mask_char?: string;
  replace_value?: string;
  encrypt_algorithm?: string;
}

export interface RetentionRuleConfig {
  retention_days: number;
  need_archive: boolean;
  archive_location?: string;
  need_approval: boolean;
  approval_position?: number[];
}

export interface PrivacyPreCheckFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface PrivacyPreCheckResult {
  passed: boolean;
  blocked: boolean;
  permission_valid: boolean;
  scene_valid: boolean;
  record_complete: boolean;
  customer_level: number;
  customer_level_text: string;
  sensitivity_level: number;
  sensitivity_level_text: string;
  desensitization_level: number;
  desensitization_level_text: string;
  time_limit: number;
  need_record: boolean;
  errors: PrivacyPreCheckFieldError[];
  warnings: string[];
  block_reason?: string;
  matched_rule_code?: string;
  matched_rule_name?: string;
}

export interface PrivacySceneAdaptResult {
  scene_type: PrivacySceneType;
  scene_type_text: string;
  desensitization_level: DesensitizationLevel;
  desensitization_level_text: string;
  desensitization_rules: DesensitizationRuleConfig[];
  retention_rules: RetentionRuleConfig;
  time_limit: number;
  need_record: boolean;
  need_operation_log: boolean;
  sensitive_fields: string[];
  adapt_rules: string[];
}

export interface PrivacyComplianceCheckResult {
  compliant: boolean;
  is_high_frequency: boolean;
  is_malicious_export: boolean;
  is_unauthorized: boolean;
  is_violation: boolean;
  violation_type?: string;
  violation_message?: string;
  risk_alert: boolean;
  risk_alert_info?: string;
}

export interface CreatePrivacyRuleRequest {
  rule_code: string;
  rule_name: string;
  customer_level?: number;
  sensitivity_level: SensitivityLevel;
  operator_position?: number;
  scene_type: PrivacySceneType;
  desensitization_rules: DesensitizationRuleConfig[];
  retention_rules: RetentionRuleConfig;
  time_limit?: number;
  sensitive_fields: string[];
  need_record?: number;
  need_operation_log?: number;
  is_global?: number;
  status?: RuleStatus;
  description?: string;
  org_id?: string;
  effective_time?: string;
  expire_time?: string;
}

export interface UpdatePrivacyRuleRequest {
  rule_name?: string;
  customer_level?: number;
  sensitivity_level?: SensitivityLevel;
  operator_position?: number;
  scene_type?: PrivacySceneType;
  desensitization_rules?: DesensitizationRuleConfig[];
  retention_rules?: RetentionRuleConfig;
  time_limit?: number;
  sensitive_fields?: string[];
  need_record?: number;
  need_operation_log?: number;
  is_global?: number;
  status?: RuleStatus;
  description?: string;
  effective_time?: string;
  expire_time?: string;
}

export interface PrivacyRuleQueryParams extends PaginationParams {
  keyword?: string;
  rule_code?: string;
  rule_name?: string;
  customer_level?: number;
  sensitivity_level?: SensitivityLevel;
  operator_position?: number;
  scene_type?: PrivacySceneType;
  is_global?: number;
  status?: RuleStatus;
  org_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface PrivacyRuleVO {
  id: string;
  rule_code: string;
  rule_name: string;
  customer_level: number;
  customer_level_text: string;
  sensitivity_level: SensitivityLevel;
  sensitivity_level_text: string;
  operator_position: number;
  operator_position_text: string;
  scene_type: PrivacySceneType;
  scene_type_text: string;
  desensitization_rules: DesensitizationRuleConfig[];
  retention_rules: RetentionRuleConfig;
  time_limit: number;
  sensitive_fields: string[];
  need_record: number;
  need_operation_log: number;
  is_global: number;
  status: RuleStatus;
  status_text: string;
  description?: string;
  org_id?: string;
  org_name?: string;
  creator_id?: string;
  creator_name?: string;
  effective_time?: string;
  expire_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PrivacyLogQueryParams extends PaginationParams {
  keyword?: string;
  log_no?: string;
  customer_id?: string;
  corporate_id?: string;
  customer_no?: string;
  customer_name?: string;
  customer_type?: CustomerType;
  customer_level?: number;
  operator_id?: string;
  operator_name?: string;
  operator_position?: OperatorPosition;
  scene_type?: PrivacySceneType;
  operation_type?: PrivacyOperationType;
  is_blocked?: number;
  block_type?: BlockType;
  is_unauthorized?: number;
  is_violation?: number;
  is_risk_alert?: number;
  rule_id?: string;
  rule_code?: string;
  start_time?: string;
  end_time?: string;
}

export interface PrivacyLogVO {
  id: string;
  log_no: string;
  customer_id?: string;
  corporate_id?: string;
  customer_no?: string;
  customer_name?: string;
  customer_type: CustomerType;
  customer_type_text: string;
  customer_level: number;
  customer_level_text: string;
  operator_id?: string;
  operator_name?: string;
  operator_position: OperatorPosition;
  operator_position_text: string;
  operator_org_id?: string;
  operator_org_name?: string;
  scene_type: PrivacySceneType;
  scene_type_text: string;
  operation_type: PrivacyOperationType;
  operation_type_text: string;
  sensitive_fields: string[];
  desensitization_level: DesensitizationLevel;
  desensitization_level_text: string;
  operation_purpose?: string;
  is_blocked: number;
  block_type: BlockType;
  block_type_text: string;
  block_reason?: string;
  is_unauthorized: number;
  is_violation: number;
  operation_ip?: string;
  operation_device?: string;
  operation_time: string;
  operation_duration: number;
  view_count: number;
  is_risk_alert: number;
  risk_alert_info?: string;
  rule_id?: string;
  rule_code?: string;
  request_params?: string;
  response_summary?: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PrivacyTraceRequest {
  customer_id?: string;
  corporate_id?: string;
  customer_no?: string;
  start_time?: string;
  end_time?: string;
}

export interface PrivacyTraceStatistics {
  total_operations: number;
  view_count: number;
  export_count: number;
  modify_count: number;
  delete_count: number;
  blocked_count: number;
  unauthorized_count: number;
  violation_count: number;
  risk_alert_count: number;
  high_frequency_count: number;
  malicious_export_count: number;
}

export interface PrivacyTraceRecord {
  id: string;
  log_no: string;
  operation_time: string;
  operator_name?: string;
  operator_position: number;
  operator_position_text: string;
  scene_type: PrivacySceneType;
  scene_type_text: string;
  operation_type: PrivacyOperationType;
  operation_type_text: string;
  is_blocked: number;
  block_type: BlockType;
  block_type_text: string;
  block_reason?: string;
  is_unauthorized: number;
  is_violation: number;
  is_risk_alert: number;
  risk_alert_info?: string;
  sensitive_fields: string[];
}

export interface PrivacyTraceResponse {
  customer_id?: string;
  corporate_id?: string;
  customer_no?: string;
  customer_name?: string;
  matched: boolean;
  statistics: PrivacyTraceStatistics;
  has_unauthorized: boolean;
  has_violation: boolean;
  has_high_frequency: boolean;
  has_malicious_export: boolean;
  has_risk_alert: boolean;
  history_records: PrivacyTraceRecord[];
  change_logs: PrivacyLogVO[];
  risk_prompts: string[];
  allowed: boolean;
  block_reason?: string;
}

export interface PrivacyBatchConfigItem {
  row_index: number;
  customer_level?: number;
  sensitivity_level?: SensitivityLevel;
  operator_position?: number;
  scene_type?: PrivacySceneType;
  desensitization_rules?: DesensitizationRuleConfig[];
  retention_rules?: RetentionRuleConfig;
  time_limit?: number;
  sensitive_fields?: string[];
}

export interface PrivacyBatchConfigRequest {
  batch_name?: string;
  org_id?: string;
  is_global: number;
  items: PrivacyBatchConfigItem[];
}

export interface PrivacyBatchConfigResultItem {
  row_index: number;
  customer_level?: number;
  sensitivity_level?: SensitivityLevel;
  process_result: 0 | 1 | 2 | 3 | 4;
  process_result_text?: string;
  process_message?: string;
  block_reason?: string;
  rule_code?: string;
  rule_id?: string;
}

export interface PrivacyBatchConfigResponse {
  batch_id: string;
  batch_name?: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  unauthorized_count: number;
  violation_count: number;
  items: PrivacyBatchConfigResultItem[];
}

export interface PrivacyViewRequest {
  customer_id?: string;
  corporate_id?: string;
  scene_type: PrivacySceneType;
  operation_purpose?: string;
  operation_type?: PrivacyOperationType;
}

export interface PrivacyViewResponse {
  allowed: boolean;
  blocked: boolean;
  block_reason?: string;
  desensitization_level: DesensitizationLevel;
  desensitization_level_text: string;
  sensitive_fields: string[];
  time_limit: number;
  customer_info?: any;
  log_id?: string;
  warnings?: string[];
}

export interface PrivacyExportRequest {
  customer_ids?: string[];
  corporate_ids?: string[];
  scene_type: PrivacySceneType;
  operation_purpose: string;
  export_fields: string[];
}

export interface PrivacyExportResponse {
  allowed: boolean;
  blocked: boolean;
  block_reason?: string;
  export_token?: string;
  desensitization_level: DesensitizationLevel;
  sensitive_fields: string[];
  export_count: number;
  warnings?: string[];
}
