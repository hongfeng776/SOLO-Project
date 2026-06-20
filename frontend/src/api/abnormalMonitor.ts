import { get, post, put, del } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export enum AlertType {
  HIGH_FREQUENCY = 1,
  REMOTE_TRANSACTION = 2,
  LARGE_AMOUNT = 3,
  NIGHT_ANOMALY = 4
}

export const AlertTypeOptions = [
  { label: '高频交易', value: 1, color: 'warning' },
  { label: '异地交易', value: 2, color: 'danger' },
  { label: '大额异动', value: 3, color: 'danger' },
  { label: '夜间异常', value: 4, color: 'warning' }
]

export enum AlertRiskLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export const AlertRiskLevelOptions = [
  { label: '低风险', value: 1, color: 'success' },
  { label: '中风险', value: 2, color: 'warning' },
  { label: '高风险', value: 3, color: 'danger' },
  { label: '极高风险', value: 4, color: 'danger' }
]

export enum AlertStatus {
  PENDING = 0,
  PROCESSING = 1,
  CONFIRMED = 2,
  FALSE_POSITIVE = 3,
  HANDLED = 4,
  CLOSED = 5
}

export const AlertStatusOptions = [
  { label: '待处理', value: 0, color: 'info' },
  { label: '处理中', value: 1, color: 'warning' },
  { label: '已确认', value: 2, color: 'danger' },
  { label: '误报', value: 3, color: 'info' },
  { label: '已处理', value: 4, color: 'success' },
  { label: '已关闭', value: 5, color: 'info' }
]

export enum InterceptStatus {
  NOT_INTERCEPTED = 0,
  INTERCEPTED = 1,
  RELEASED = 2
}

export const InterceptStatusOptions = [
  { label: '未拦截', value: 0, color: 'info' },
  { label: '已拦截', value: 1, color: 'danger' },
  { label: '已放行', value: 2, color: 'success' }
]

export enum RuleType {
  FREQUENCY = 1,
  AMOUNT = 2,
  BEHAVIOR = 3,
  COMPOSITE = 4
}

export const RuleTypeOptions = [
  { label: '频率规则', value: 1 },
  { label: '金额规则', value: 2 },
  { label: '行为规则', value: 3 },
  { label: '组合规则', value: 4 }
]

export enum MonitorDimension {
  TRANSACTION_FREQUENCY = 1,
  TRANSACTION_AMOUNT = 2,
  GEO_LOCATION = 3,
  TIME_PATTERN = 4,
  ACCOUNT_BEHAVIOR = 5,
  CROSS_ACCOUNT = 6
}

export const MonitorDimensionOptions = [
  { label: '交易频率', value: 1 },
  { label: '交易金额', value: 2 },
  { label: '地理位置', value: 3 },
  { label: '时间模式', value: 4 },
  { label: '账户行为', value: 5 },
  { label: '跨账户关联', value: 6 }
]

export enum AlertAction {
  IGNORE = 1,
  CONFIRM = 2,
  ESCALATE = 3
}

export const AlertActionOptions = [
  { label: '忽略', value: 1 },
  { label: '确认告警', value: 2 },
  { label: '上报处理', value: 3 }
]

export enum AlertBatchType {
  AUTO_HANDLE = 1,
  BATCH_IGNORE = 2,
  BATCH_ESCALATE = 3
}

export const AlertBatchTypeOptions = [
  { label: '自动处理', value: 1 },
  { label: '批量忽略', value: 2 },
  { label: '批量上报', value: 3 }
]

export enum AlertBatchStatus {
  PENDING = 0,
  EXECUTING = 1,
  COMPLETED = 2,
  PARTIAL_FAILED = 3,
  FAILED = 4
}

export const AlertBatchStatusOptions = [
  { label: '待执行', value: 0, color: 'info' },
  { label: '执行中', value: 1, color: 'warning' },
  { label: '已完成', value: 2, color: 'success' },
  { label: '部分失败', value: 3, color: 'warning' },
  { label: '执行失败', value: 4, color: 'danger' }
]

export enum TraceType {
  ALERT_TRIGGER = 1,
  RULE_MATCH = 2,
  MANUAL_HANDLE = 3,
  AUTO_HANDLE = 4,
  ESCALATE = 5,
  INTERCEPT = 6,
  RELEASE = 7
}

export const TraceTypeOptions = [
  { label: '告警触发', value: 1 },
  { label: '规则匹配', value: 2 },
  { label: '人工处理', value: 3 },
  { label: '自动处理', value: 4 },
  { label: '上报', value: 5 },
  { label: '拦截', value: 6 },
  { label: '放行', value: 7 }
]

export interface AbnormalTransaction {
  id: string
  alert_no: string
  customer_id: string
  customer_no: string
  customer_name?: string
  alert_type: number
  alert_type_text?: string
  risk_level: number
  risk_level_text?: string
  risk_level_color?: string
  transaction_amount: number
  transaction_count?: number
  status: number
  status_text?: string
  intercept_status: number
  intercept_status_text?: string
  transaction_time?: string
  trigger_rule?: string
  trigger_rule_name?: string
  description?: string
  operator_id?: string
  operator_name?: string
  handle_time?: string
  handle_remark?: string
  source?: string
  created_at?: string
  updated_at?: string
}

export interface AbnormalTransactionQueryParams extends PageParams {
  keyword?: string
  alert_type?: number
  risk_level?: number
  status?: number
  intercept_status?: number
  start_time?: string
  end_time?: string
}

export interface MonitorRule {
  id: string
  rule_code: string
  rule_name: string
  rule_type: number
  rule_type_text?: string
  monitor_dimension: number
  monitor_dimension_text?: string
  threshold_value: number
  time_window?: number
  description?: string
  is_enabled: number
  priority: number
  match_count?: number
  alert_count?: number
  created_at?: string
  updated_at?: string
}

export interface MonitorRuleQueryParams extends PageParams {
  keyword?: string
  rule_type?: number
  monitor_dimension?: number
  is_enabled?: number
}

export interface CreateMonitorRuleRequest {
  rule_code: string
  rule_name: string
  rule_type: number
  monitor_dimension: number
  threshold_value: number
  time_window?: number
  description?: string
  is_enabled?: number
  priority?: number
}

export interface UpdateMonitorRuleRequest {
  rule_name?: string
  rule_type?: number
  monitor_dimension?: number
  threshold_value?: number
  time_window?: number
  description?: string
  is_enabled?: number
  priority?: number
}

export interface AlertBatch {
  id: string
  batch_no: string
  batch_name: string
  batch_type: number
  batch_type_text?: string
  status: number
  status_text?: string
  total_count: number
  success_count: number
  fail_count: number
  progress?: number
  filter_condition?: any
  creator_id?: string
  creator_name?: string
  org_id?: string
  org_name?: string
  execute_start_time?: string
  execute_end_time?: string
  remark?: string
  created_at?: string
  updated_at?: string
}

export interface AlertBatchQueryParams extends PageParams {
  keyword?: string
  batch_type?: number
  status?: number
  start_time?: string
  end_time?: string
}

export interface CreateAlertBatchRequest {
  batch_name: string
  batch_type: number
  filter_condition?: any
  remark?: string
}

export interface MonitorTraceVO {
  id: string
  alert_id: string
  alert_no: string
  trace_type: number
  trace_type_text?: string
  customer_no?: string
  customer_name?: string
  operator_id?: string
  operator_name?: string
  content?: string
  trace_time?: string
  created_at?: string
}

export interface MonitorTraceQueryParams extends PageParams {
  alert_no?: string
  trace_type?: number
  start_time?: string
  end_time?: string
}

export interface HandleAlertRequest {
  action: number
  remark?: string
}

export interface AlertStatistics {
  total_count: number
  pending_count: number
  processing_count: number
  handled_count: number
  false_positive_count: number
  today_count: number
  high_risk_count: number
}

export interface MonitorConfig {
  is_realtime_enabled: boolean
  is_intercept_enabled: boolean
  max_alert_count_per_day: number
  auto_handle_threshold: number
}

export interface RealtimeMonitorResult {
  active_alert_count: number
  monitoring_rule_count: number
  intercept_count_today: number
  alert_trend: { date: string; count: number }[]
}

export interface RuleValidationResult {
  is_valid: boolean
  error_message?: string
  conflict_rules?: string[]
}

export interface ComplianceCheckResult {
  is_compliant: boolean
  violations: string[]
  suggestion?: string
}

export function getMonitorConfigApi() {
  return get<MonitorConfig>('/business/monitor/config')
}

export function realtimeMonitorApi() {
  return get<RealtimeMonitorResult>('/business/monitor/realtime')
}

export function validateRulesApi(ruleId: string) {
  return get<RuleValidationResult>(`/business/monitor/rules/validate/${ruleId}`)
}

export function checkComplianceApi(data: { rule_id: string; action: string }) {
  return post<ComplianceCheckResult>('/business/monitor/compliance/check', data)
}

export function getAlertListApi(params: AbnormalTransactionQueryParams) {
  return get<PageResult<AbnormalTransaction>>('/business/monitor/alert/list', params)
}

export function getAlertDetailApi(id: string) {
  return get<AbnormalTransaction>(`/business/monitor/alert/${id}`)
}

export function handleAlertApi(id: string, data: HandleAlertRequest) {
  return post<AbnormalTransaction>(`/business/monitor/alert/${id}/handle`, data)
}

export function getAlertStatisticsApi() {
  return get<AlertStatistics>('/business/monitor/alert/statistics')
}

export function createBatchHandleApi(data: CreateAlertBatchRequest) {
  return post<AlertBatch>('/business/monitor/batch', data)
}

export function getBatchListApi(params: AlertBatchQueryParams) {
  return get<PageResult<AlertBatch>>('/business/monitor/batch/list', params)
}

export function getBatchDetailApi(id: string) {
  return get<AlertBatch>(`/business/monitor/batch/${id}`)
}

export function getTraceListApi(params: MonitorTraceQueryParams) {
  return get<PageResult<MonitorTraceVO>>('/business/monitor/trace/list', params)
}

export function getAlertTraceApi(alertId: string) {
  return get<MonitorTraceVO[]>(`/business/monitor/trace/alert/${alertId}`)
}

export function getRuleListApi(params: MonitorRuleQueryParams) {
  return get<PageResult<MonitorRule>>('/business/monitor/rules/list', params)
}

export function getRuleDetailApi(id: string) {
  return get<MonitorRule>(`/business/monitor/rules/${id}`)
}

export function createRuleApi(data: CreateMonitorRuleRequest) {
  return post<MonitorRule>('/business/monitor/rules', data)
}

export function updateRuleApi(id: string, data: UpdateMonitorRuleRequest) {
  return put<MonitorRule>(`/business/monitor/rules/${id}`, data)
}

export function deleteRuleApi(id: string) {
  return del<void>(`/business/monitor/rules/${id}`)
}
