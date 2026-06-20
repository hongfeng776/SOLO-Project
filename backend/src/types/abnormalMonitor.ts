export enum AlertType {
  HIGH_FREQUENCY = 1,
  REMOTE_TRANSACTION = 2,
  LARGE_AMOUNT = 3,
  NIGHT_ABNORMAL = 4
}

export const AlertTypeText: Record<number, string> = {
  1: '高频交易',
  2: '异地交易',
  3: '大额异动',
  4: '夜间异常'
};

export enum AlertRiskLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH_MEDIUM = 3,
  HIGH = 4
}

export const AlertRiskLevelText: Record<number, string> = {
  1: '低风险',
  2: '中风险',
  3: '较高风险',
  4: '高风险'
};

export const AlertRiskLevelColor: Record<number, string> = {
  1: 'success',
  2: 'warning',
  3: 'danger',
  4: 'danger'
};

export enum AlertStatus {
  PENDING = 0,
  AUTO_ARCHIVED = 1,
  MANUAL_REVIEWING = 2,
  INTERCEPTED = 3,
  RELEASED = 4,
  CONFIRMED = 5
}

export const AlertStatusText: Record<number, string> = {
  0: '待处理',
  1: '自动归档',
  2: '人工复核中',
  3: '已拦截',
  4: '已解除',
  5: '已确认异常'
};

export enum InterceptStatus {
  NONE = 0,
  INTERCEPTED = 1,
  RELEASED = 2
}

export const InterceptStatusText: Record<number, string> = {
  0: '未拦截',
  1: '已拦截',
  2: '已解除拦截'
};

export enum RuleType {
  HIGH_FREQUENCY = 1,
  REMOTE_TRANSACTION = 2,
  LARGE_AMOUNT = 3,
  NIGHT_ABNORMAL = 4
}

export const RuleTypeText: Record<number, string> = {
  1: '高频交易监控',
  2: '异地交易监控',
  3: '大额异动监控',
  4: '夜间异常监控'
};

export enum MonitorDimension {
  FREQUENCY = 1,
  AMOUNT = 2,
  LOCATION = 3,
  TIME = 4,
  DEVICE = 5,
  SCENE = 6
}

export const MonitorDimensionText: Record<number, string> = {
  1: '频次维度',
  2: '金额维度',
  3: '地域维度',
  4: '时间维度',
  5: '设备维度',
  6: '场景维度'
};

export enum AlertAction {
  ALERT_ONLY = 1,
  ALERT_INTERCEPT = 2,
  ALERT_INTERCEPT_REVIEW = 3
}

export const AlertActionText: Record<number, string> = {
  1: '仅预警',
  2: '预警+拦截',
  3: '预警+拦截+强制复核'
};

export enum AlertBatchType {
  LOW_RISK_CONFIRM = 1,
  HIGH_RISK_LOCK = 2,
  CUSTOM = 3
}

export const AlertBatchTypeText: Record<number, string> = {
  1: '低风险批量确认',
  2: '高风险批量锁定',
  3: '自定义'
};

export enum AlertBatchStatus {
  PENDING = 0,
  EXECUTING = 1,
  COMPLETED = 2,
  PARTIAL_FAILED = 3,
  FAILED = 4
}

export const AlertBatchStatusText: Record<number, string> = {
  0: '待执行',
  1: '执行中',
  2: '已完成',
  3: '部分失败',
  4: '执行失败'
};

export enum TraceType {
  RULE_TRIGGER = 1,
  MANUAL_HANDLE = 2,
  BATCH_HANDLE = 3,
  INTERCEPT = 4,
  RELEASE = 5,
  FALSE_POSITIVE = 6,
  ILLEGAL_RELEASE = 7
}

export const TraceTypeText: Record<number, string> = {
  1: '规则触发',
  2: '人工处理',
  3: '批量处理',
  4: '拦截操作',
  5: '解除操作',
  6: '误判标记',
  7: '违规解除'
};

export interface TriggerRuleDetail {
  rule_id: string;
  rule_code: string;
  rule_name: string;
  rule_type: number;
  dimension: number;
  threshold_value: number;
  actual_value: number;
  trigger_time: string;
}

export interface DeviceInfo {
  device_id?: string;
  device_type?: string;
  ip_address?: string;
  mac_address?: string;
  browser?: string;
  os?: string;
  app_version?: string;
}

export interface LocationInfo {
  ip_location?: string;
  gps_location?: string;
  city?: string;
  province?: string;
  country?: string;
  distance_from_usual?: number;
}

export interface FrequencyInfo {
  count_1h?: number;
  count_24h?: number;
  count_7d?: number;
  count_30d?: number;
  amount_24h?: number;
  amount_7d?: number;
}

export interface ThresholdConfig {
  count_threshold_1h?: number;
  count_threshold_24h?: number;
  amount_threshold_single?: number;
  amount_threshold_daily?: number;
  night_start_hour?: number;
  night_end_hour?: number;
  distance_threshold_km?: number;
  amount_change_ratio?: number;
  frequency_change_ratio?: number;
}

export interface RiskLevelMapping {
  low_conditions: string[];
  medium_conditions: string[];
  high_medium_conditions: string[];
  high_conditions: string[];
}

export interface AbnormalTransactionQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  alert_no?: string;
  customer_no?: string;
  customer_name?: string;
  alert_type?: number;
  risk_level?: number;
  status?: number;
  intercept_status?: number;
  org_id?: string;
  start_time?: string;
  end_time?: string;
  batch_id?: string;
  is_false_positive?: number;
  min_amount?: number;
  max_amount?: number;
}

export interface MonitorRuleQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  rule_type?: number;
  dimension?: number;
  status?: number;
  is_enabled?: number;
}

export interface AlertBatchQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  batch_type?: number;
  status?: number;
  org_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface MonitorTraceQueryParams {
  page: number;
  pageSize: number;
  alert_id?: string;
  trace_type?: number;
  operator_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface CreateAbnormalTransactionRequest {
  transaction_id: string;
  transaction_no: string;
  customer_id: string;
  customer_no: string;
  customer_name?: string;
  account_id?: string;
  account_no?: string;
  alert_type: number;
  transaction_amount: number;
  transaction_time: string;
  transaction_scene?: string;
  device_info?: DeviceInfo;
  location_info?: LocationInfo;
  frequency_info?: FrequencyInfo;
  org_id?: string;
}

export interface HandleAlertRequest {
  status: number;
  handle_result?: string;
  handle_remark?: string;
  risk_level?: number;
  risk_tags?: string[];
  intercept_status?: number;
  is_false_positive?: number;
  false_positive_reason?: string;
}

export interface BatchHandleAlertRequest {
  batch_name: string;
  batch_type: number;
  alert_ids?: string[];
  filter_condition?: any;
  handle_action: number;
  handle_remark?: string;
}

export interface CreateMonitorRuleRequest {
  rule_code: string;
  rule_name: string;
  rule_type: number;
  dimension: number;
  threshold_config: ThresholdConfig;
  risk_level_mapping?: RiskLevelMapping;
  alert_action?: number;
  priority?: number;
  is_required?: number;
  description?: string;
  sort_order?: number;
}

export interface UpdateMonitorRuleRequest {
  rule_name?: string;
  threshold_config?: ThresholdConfig;
  risk_level_mapping?: RiskLevelMapping;
  alert_action?: number;
  priority?: number;
  is_enabled?: number;
  description?: string;
  sort_order?: number;
}

export interface AbnormalTransactionVO {
  id: string;
  alert_no: string;
  transaction_id: string;
  transaction_no: string;
  customer_id: string;
  customer_no: string;
  customer_name?: string;
  account_id?: string;
  account_no?: string;
  trigger_rules?: TriggerRuleDetail[];
  alert_type: number;
  alert_type_text?: string;
  risk_level: number;
  risk_level_text?: string;
  risk_level_color?: string;
  risk_tags?: string;
  status: number;
  status_text?: string;
  transaction_amount: number;
  transaction_time: Date;
  transaction_scene?: string;
  device_info?: DeviceInfo;
  location_info?: LocationInfo;
  frequency_info?: FrequencyInfo;
  intercept_status: number;
  intercept_status_text?: string;
  alert_notify_status: number;
  alert_notify_time?: Date;
  handler_id?: string;
  handler_name?: string;
  handle_time?: Date;
  handle_result?: string;
  handle_remark?: string;
  batch_id?: string;
  batch_no?: string;
  org_id?: string;
  org_name?: string;
  previous_alerts_count: number;
  is_false_positive: number;
  false_positive_reason?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface MonitorRuleVO {
  id: string;
  rule_code: string;
  rule_name: string;
  rule_type: number;
  rule_type_text?: string;
  dimension: number;
  dimension_text?: string;
  is_enabled: number;
  priority: number;
  threshold_config: ThresholdConfig;
  risk_level_mapping?: RiskLevelMapping;
  alert_action: number;
  alert_action_text?: string;
  is_required: number;
  description?: string;
  sort_order: number;
  status: number;
  trigger_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface AlertBatchVO {
  id: string;
  batch_no: string;
  batch_name: string;
  batch_type: number;
  batch_type_text?: string;
  status: number;
  status_text?: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  progress?: number;
  filter_condition?: any;
  risk_level_filter?: number;
  alert_type_filter?: number;
  handle_action: number;
  handle_action_text?: string;
  creator_id?: string;
  creator_name?: string;
  org_id?: string;
  org_name?: string;
  execute_start_time?: Date;
  execute_end_time?: Date;
  execute_log?: string;
  remark?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface MonitorTraceVO {
  id: string;
  alert_id: string;
  alert_no?: string;
  trace_type: number;
  trace_type_text?: string;
  operator_id?: string;
  operator_name?: string;
  operation_detail?: any;
  rule_id?: string;
  rule_name?: string;
  before_status?: number;
  before_status_text?: string;
  after_status?: number;
  after_status_text?: string;
  is_compliant: number;
  violation_type?: string;
  remark?: string;
  created_at?: Date;
}

export interface RealTimeMonitorResult {
  is_abnormal: boolean;
  alert_id?: string;
  alert_no?: string;
  triggered_rules: TriggerRuleDetail[];
  risk_level: number;
  risk_level_text: string;
  intercept_required: boolean;
  review_required: boolean;
  alert_action: number;
}

export interface RuleValidationResult {
  is_valid: boolean;
  enabled_rules_count: number;
  required_rules_count: number;
  missing_required_rules: string[];
  duplicate_rules: string[];
  error_message?: string;
}

export interface ComplianceCheckResult {
  is_compliant: boolean;
  violations: string[];
  can_release: boolean;
  release_block_reason?: string;
  is_false_positive: boolean;
  false_positive_evidence?: string[];
}

export interface AlertStatistics {
  total_count: number;
  pending_count: number;
  auto_archived_count: number;
  reviewing_count: number;
  intercepted_count: number;
  released_count: number;
  confirmed_count: number;
  by_type: { type: number; type_text: string; count: number }[];
  by_risk_level: { level: number; level_text: string; count: number }[];
  false_positive_rate: number;
  today_count: number;
  today_intercepted_count: number;
}
