import { get, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export enum BlacklistGrade {
  TEMPORARY = 1,
  SHORT_TERM = 2,
  LONG_TERM = 3,
  PERMANENT = 4
}

export const BlacklistGradeOptions = [
  { label: '临时黑名单', value: 1, color: 'warning' },
  { label: '短期黑名单', value: 2, color: 'warning' },
  { label: '长期黑名单', value: 3, color: 'danger' },
  { label: '永久黑名单', value: 4, color: 'danger' }
]

export enum BlacklistStatus {
  PENDING_REVIEW = 0,
  ACTIVE = 1,
  REVIEWING = 2,
  EXPIRED = 3,
  REMOVED = 4,
  REJECTED = 5
}

export const BlacklistStatusOptions = [
  { label: '待审核', value: 0, color: 'info' },
  { label: '生效中', value: 1, color: 'success' },
  { label: '复核中', value: 2, color: 'warning' },
  { label: '已到期', value: 3, color: 'warning' },
  { label: '已移除', value: 4, color: 'info' },
  { label: '已驳回', value: 5, color: 'danger' }
]

export enum BusinessRestrictionType {
  TRANSACTION_BLOCK = 1,
  ACCOUNT_FREEZE = 2,
  LOAN_REJECT = 3,
  CARD_REJECT = 4,
  WITHDRAWAL_LIMIT = 5,
  ALL_CHANNEL_BLOCK = 6
}

export const BusinessRestrictionOptions = [
  { label: '禁止交易', value: 1 },
  { label: '账户冻结', value: 2 },
  { label: '贷款拒绝', value: 3 },
  { label: '开卡拒绝', value: 4 },
  { label: '取现限额', value: 5 },
  { label: '全渠道限制', value: 6 }
]

export enum EvidenceType {
  VIOLATION_RECORD = 1,
  TRANSACTION_EVIDENCE = 2,
  SUPERVISION_DOCUMENT = 3,
  COURT_DOCUMENT = 4,
  MANUAL_EVIDENCE = 5
}

export const EvidenceTypeOptions = [
  { label: '违规记录', value: 1 },
  { label: '交易凭证', value: 2 },
  { label: '监管文书', value: 3 },
  { label: '司法文书', value: 4 },
  { label: '手工录入', value: 5 }
]

export enum BlacklistTraceType {
  ADD_BLACKLIST = 1,
  REVIEW_PASS = 2,
  REVIEW_REJECT = 3,
  REMOVE_BLACKLIST = 4,
  EXTEND_PERIOD = 5,
  GRADE_CHANGE = 6,
  COMPLIANCE_CHECK = 7,
  BATCH_PROCESS = 8
}

export const BlacklistTraceTypeOptions = [
  { label: '加入黑名单', value: 1, color: 'primary' },
  { label: '审核通过', value: 2, color: 'success' },
  { label: '审核驳回', value: 3, color: 'danger' },
  { label: '移除黑名单', value: 4, color: 'warning' },
  { label: '延期', value: 5, color: 'info' },
  { label: '等级变更', value: 6, color: 'warning' },
  { label: '合规校验', value: 7, color: 'primary' },
  { label: '批量处理', value: 8, color: 'primary' }
]

export enum BlacklistBatchType {
  SCREEN_ADD = 1,
  BATCH_ADD = 2,
  BATCH_REMOVE = 3,
  BATCH_EXTEND = 4,
  BATCH_GRADE_CHANGE = 5
}

export const BlacklistBatchTypeOptions = [
  { label: '筛查录入', value: 1 },
  { label: '批量录入', value: 2 },
  { label: '批量移除', value: 3 },
  { label: '批量延期', value: 4 },
  { label: '批量等级变更', value: 5 }
]

export enum BlacklistBatchStatus {
  PENDING = 0,
  PROCESSING = 1,
  COMPLETED = 2,
  FAILED = 3
}

export const BlacklistBatchStatusOptions = [
  { label: '待执行', value: 0, color: 'info' },
  { label: '执行中', value: 1, color: 'warning' },
  { label: '已完成', value: 2, color: 'success' },
  { label: '执行失败', value: 3, color: 'danger' }
]

export enum ViolationType {
  FUND_ABNORMAL = 1,
  SUSPICIOUS_ACCOUNT = 2,
  OPERATION_VIOLATION = 3,
  INCOMPLETE_DATA = 4,
  AML = 5,
  SUPERVISION_VIOLATION = 6,
  CREDIT_DEFAULT = 7,
  FRAUD = 8,
  OTHER = 9
}

export const ViolationTypeOptions = [
  { label: '资金异常', value: 1 },
  { label: '可疑账户', value: 2 },
  { label: '操作违规', value: 3 },
  { label: '资料不全', value: 4 },
  { label: '反洗钱', value: 5 },
  { label: '监管违规', value: 6 },
  { label: '信用违约', value: 7 },
  { label: '欺诈行为', value: 8 },
  { label: '其他', value: 9 }
]

export interface EvidenceItem {
  evidence_type: number
  evidence_id?: string
  evidence_no?: string
  evidence_name?: string
  evidence_url?: string
  upload_time?: string
}

export interface BusinessRestrictionConfig {
  restriction_type: number
  is_enabled: boolean
  description?: string
}

export interface BusinessStatusInfo {
  account_id: string
  account_no: string
  account_type: number
  account_status: number
  is_locked: boolean
  lock_reason?: string
}

export interface PreCheckResult {
  passed: boolean
  failed_reasons: string[]
  violation_records: any[]
  evidence_items: EvidenceItem[]
  missing_evidence: string[]
  incomplete_processes: string[]
  business_statuses: BusinessStatusInfo[]
  pending_businesses: any[]
}

export interface BlacklistRecord {
  id: string
  blacklist_no: string
  customer_id: string
  customer_no: string
  customer_name: string
  id_card_no?: string
  customer_type?: number
  violation_type: number
  violation_type_text?: string
  violation_level: number
  grade: number
  grade_text?: string
  grade_color?: string
  status: number
  status_text?: string
  status_color?: string
  description: string
  evidence_count: number
  evidence_items?: EvidenceItem[]
  business_restrictions?: BusinessRestrictionConfig[]
  effective_date: string
  expire_date?: string
  remaining_days?: number
  auto_remind: number
  review_count: number
  last_review_date?: string
  next_review_date?: string
  locked_accounts?: BusinessStatusInfo[]
  creator_id?: string
  creator_name?: string
  reviewer_id?: string
  reviewer_name?: string
  review_time?: string
  review_opinion?: string
  remove_reason?: string
  remove_time?: string
  remover_id?: string
  remover_name?: string
  org_id?: string
  org_name?: string
  batch_id?: string
  batch_no?: string
  is_compliant?: number
  violation_details?: string
  created_at?: string
  updated_at?: string
}

export interface BlacklistBatch {
  id: string
  batch_no: string
  batch_name: string
  batch_type: number
  batch_type_text?: string
  status: number
  status_text?: string
  status_color?: string
  total_count: number
  success_count: number
  fail_count: number
  filter_condition?: any
  grade_filter?: number
  violation_type_filter?: number
  target_grade?: number
  extend_days?: number
  handle_reason: string
  execute_start_time?: string
  execute_end_time?: string
  execute_log?: string
  creator_id?: string
  creator_name?: string
  remark?: string
  created_at?: string
  updated_at?: string
  items?: BlacklistRecord[]
}

export interface BlacklistTrace {
  id: string
  blacklist_id: string
  blacklist_no: string
  trace_type: number
  trace_type_text?: string
  operator_id?: string
  operator_name?: string
  operation_detail?: any
  before_grade?: number
  after_grade?: number
  before_status?: number
  after_status?: number
  is_compliant: number
  violation_type?: number
  violation_details?: string
  remark?: string
  created_at?: string
}

export interface BlacklistStatistics {
  total_count: number
  active_count: number
  pending_review_count: number
  expired_count: number
  removed_count: number
  temporary_count: number
  short_term_count: number
  long_term_count: number
  permanent_count: number
  today_add_count: number
  today_remove_count: number
  expire_soon_count: number
  review_due_count: number
  grade_distribution: { grade: number; count: number }[]
  violation_type_distribution: { type: number; count: number }[]
}

export interface BlacklistGradeConfig {
  grade: number
  grade_text: string
  default_duration_days?: number
  review_cycle_days: number
  restrictions: BusinessRestrictionConfig[]
  release_condition: {
    min_duration_days: number
    rectification_required: boolean
    review_required: boolean
    approval_required: boolean
    additional_conditions?: string[]
  }
  allow_manual_remove: boolean
  allow_extend: boolean
  max_extend_days?: number
}

export interface BlacklistQueryParams extends PageParams {
  keyword?: string
  blacklist_no?: string
  customer_no?: string
  customer_name?: string
  id_card_no?: string
  grade?: number
  status?: number
  violation_type?: number
  is_auto_remind?: number
  start_date?: string
  end_date?: string
  expire_start_date?: string
  expire_end_date?: string
}

export interface BlacklistCreateRequest {
  customer_id: string
  violation_type: number
  violation_level: number
  grade: number
  description: string
  evidence_ids?: string[]
  evidence_items?: EvidenceItem[]
  effective_date?: string
  expire_date?: string
  auto_remind: number
  remark?: string
  force?: boolean
}

export interface BlacklistReviewRequest {
  review_result: number
  review_opinion: string
}

export interface BlacklistRemoveRequest {
  remove_reason: string
  rectification_evidence?: EvidenceItem[]
  release_conditions_met: boolean
  force?: boolean
}

export interface BlacklistExtendRequest {
  extend_days: number
  extend_reason: string
}

export interface BlacklistGradeChangeRequest {
  target_grade: number
  change_reason: string
  force?: boolean
}

export interface BlacklistBatchCreateRequest {
  batch_type: number
  batch_name: string
  customer_ids?: string[]
  filter_condition?: any
  grade_filter?: number
  violation_type_filter?: number
  target_grade?: number
  extend_days?: number
  handle_reason: string
}

export function preCheckBlacklist(customer_id: string) {
  return get<PreCheckResult>('/business/blacklist/precheck', { customer_id })
}

export function getBlacklistList(params: BlacklistQueryParams) {
  return get<PageResult<BlacklistRecord>>('/business/blacklist/list', params)
}

export function getBlacklistDetail(id: string) {
  return get<BlacklistRecord>(`/business/blacklist/${id}`)
}

export function createBlacklist(data: BlacklistCreateRequest) {
  return post<BlacklistRecord>('/business/blacklist', data)
}

export function reviewBlacklist(id: string, data: BlacklistReviewRequest) {
  return post<BlacklistRecord>(`/business/blacklist/${id}/review`, data)
}

export function removeBlacklist(id: string, data: BlacklistRemoveRequest) {
  return post<BlacklistRecord>(`/business/blacklist/${id}/remove`, data)
}

export function extendBlacklist(id: string, data: BlacklistExtendRequest) {
  return post<BlacklistRecord>(`/business/blacklist/${id}/extend`, data)
}

export function changeBlacklistGrade(id: string, data: BlacklistGradeChangeRequest) {
  return post<BlacklistRecord>(`/business/blacklist/${id}/grade`, data)
}

export function checkBlacklistCompliance(id: string, check_type: number) {
  return post<any>(`/business/blacklist/${id}/compliance`, { check_type })
}

export function createBlacklistBatch(data: BlacklistBatchCreateRequest) {
  return post<BlacklistBatch>('/business/blacklist/batch', data)
}

export function getBlacklistBatchList(params: any) {
  return get<PageResult<BlacklistBatch>>('/business/blacklist/batch/list', params)
}

export function getBlacklistBatchDetail(id: string) {
  return get<BlacklistBatch>(`/business/blacklist/batch/${id}`)
}

export function getBlacklistTraceList(params: any) {
  return get<PageResult<BlacklistTrace>>('/business/blacklist/trace/list', params)
}

export function getBlacklistTraces(id: string) {
  return get<BlacklistTrace[]>(`/business/blacklist/trace/${id}`)
}

export function getBlacklistStatistics() {
  return get<BlacklistStatistics>('/business/blacklist/statistics')
}

export function getBlacklistGradeConfigs() {
  return get<BlacklistGradeConfig[]>('/business/blacklist/grade-configs')
}

export function getBlacklistConfig() {
  return get<any>('/business/blacklist/config')
}
