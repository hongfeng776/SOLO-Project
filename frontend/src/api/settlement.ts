import { get, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export type TransferType = 1 | 2 | 3 | 4
export type TransferMode = 1 | 2 | 3
export type SettlementStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type AuditStatus = 0 | 1 | 2 | 3 | 10 | 11
export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5
export type BatchType = 1 | 2 | 3 | 4

export const TRANSFER_TYPE_OPTIONS = [
  { label: '同行转账', value: 1 },
  { label: '跨行转账', value: 2 },
  { label: '对公转账', value: 3 },
  { label: '对私转账', value: 4 }
]

export const TRANSFER_MODE_OPTIONS = [
  { label: '普通转账', value: 1 },
  { label: '加急转账', value: 2 },
  { label: '实时转账', value: 3 }
]

export const SETTLEMENT_STATUS_OPTIONS = [
  { label: '待提交', value: 0, type: 'info' },
  { label: '待复核', value: 1, type: 'warning' },
  { label: '处理中', value: 2, type: 'primary' },
  { label: '已结算', value: 3, type: 'success' },
  { label: '已撤销', value: 4, type: 'info' },
  { label: '已失败', value: 5, type: 'danger' },
  { label: '已退回', value: 6, type: 'warning' }
]

export const AUDIT_STATUS_OPTIONS = [
  { label: '待审核', value: 0, type: 'info' },
  { label: '一级通过', value: 1, type: 'success' },
  { label: '二级通过', value: 2, type: 'success' },
  { label: '三级通过', value: 3, type: 'success' },
  { label: '审核拒绝', value: 10, type: 'danger' },
  { label: '审核撤回', value: 11, type: 'warning' }
]

export const RISK_LEVEL_OPTIONS = [
  { label: '无风险', value: 0, type: 'success' },
  { label: '低风险', value: 1, type: 'success' },
  { label: '中低风险', value: 2, type: 'info' },
  { label: '中风险', value: 3, type: 'warning' },
  { label: '中高风险', value: 4, type: 'warning' },
  { label: '高风险', value: 5, type: 'danger' }
]

export const BATCH_TYPE_OPTIONS = [
  { label: '网点对公批量转账', value: 1 },
  { label: '代发工资', value: 2 },
  { label: '代发报销', value: 3 },
  { label: '其他批量', value: 4 }
]

export const BATCH_STATUS_OPTIONS = [
  { label: '待提交', value: 0, type: 'info' },
  { label: '待复核', value: 1, type: 'warning' },
  { label: '处理中', value: 2, type: 'primary' },
  { label: '部分完成', value: 3, type: 'warning' },
  { label: '全部完成', value: 4, type: 'success' },
  { label: '已撤销', value: 5, type: 'info' },
  { label: '已失败', value: 6, type: 'danger' }
]

export const PURPOSE_OPTIONS = [
  { label: '货款', value: '货款' },
  { label: '工资', value: '工资' },
  { label: '报销', value: '报销' },
  { label: '还款', value: '还款' },
  { label: '借款', value: '借款' },
  { label: '投资', value: '投资' },
  { label: '捐赠', value: '捐赠' },
  { label: '租金', value: '租金' },
  { label: '服务费', value: '服务费' },
  { label: '佣金', value: '佣金' },
  { label: '其他', value: '其他' }
]

export const SINGLE_AUTO_REVIEW_THRESHOLD = 500000
export const BATCH_SMALL_AMOUNT_THRESHOLD = 50000
export const BATCH_LARGE_AMOUNT_THRESHOLD = 500000
export const SINGLE_LEVEL_REVIEW_THRESHOLD = 1000000
export const MULTI_LEVEL_REVIEW_THRESHOLD = 5000000

export const TRANSFER_LIMITS: Record<number, { single_limit: number; daily_limit: number; monthly_limit: number }> = {
  1: { single_limit: 1000000, daily_limit: 5000000, monthly_limit: 50000000 },
  2: { single_limit: 500000, daily_limit: 2000000, monthly_limit: 20000000 },
  3: { single_limit: 5000000, daily_limit: 20000000, monthly_limit: 200000000 },
  4: { single_limit: 200000, daily_limit: 1000000, monthly_limit: 10000000 }
}

export const RISK_DETECTION_RULES = {
  same_name_transfer_count_threshold: 5,
  same_name_transfer_time_window_hours: 24,
  large_amount_no_purpose_threshold: 500000,
  abnormal_location_check: true,
  night_transaction_start_hour: 22,
  night_transaction_end_hour: 6,
  night_transaction_amount_threshold: 100000
}

export const PUBLIC_PRIVATE_RULES = {
  allow_public_to_private: true,
  allow_private_to_public: true,
  public_to_private_daily_limit: 500000,
  private_to_public_daily_limit: 2000000,
  required_purpose_public_to_private: ['工资', '报销', '还款', '佣金'],
  required_purpose_private_to_public: ['货款', '投资', '还款', '服务费']
}

export interface FeeConfig {
  min_fee: number
  max_fee: number
  rate: number
  fixed_amount?: number
}

export interface ReviewRules {
  single_auto_review_threshold: number
  batch_small_amount_threshold: number
  batch_large_amount_threshold: number
  single_level_review_threshold: number
  multi_level_review_threshold: number
}

export interface TransferLimitConfig {
  single_limit: number
  daily_limit: number
  monthly_limit: number
}

export interface PublicPrivateRules {
  allow_public_to_private: boolean
  allow_private_to_public: boolean
  public_to_private_daily_limit: number
  private_to_public_daily_limit: number
  required_purpose_public_to_private: string[]
  required_purpose_private_to_public: string[]
}

export interface RiskDetectionRules {
  same_name_transfer_count_threshold: number
  same_name_transfer_time_window_hours: number
  large_amount_no_purpose_threshold: number
  abnormal_location_check: boolean
  night_transaction_start_hour: number
  night_transaction_end_hour: number
  night_transaction_amount_threshold: number
}

export interface SettlementConfig {
  transfer_types: typeof TRANSFER_TYPE_OPTIONS
  transfer_modes: typeof TRANSFER_MODE_OPTIONS
  settlement_statuses: typeof SETTLEMENT_STATUS_OPTIONS
  batch_types: typeof BATCH_TYPE_OPTIONS
  fee_config: Record<TransferType, Record<TransferMode, FeeConfig>>
  arrival_time_config: Record<TransferType, Record<TransferMode, string>>
  review_rules: ReviewRules
  transfer_limits: Record<number, TransferLimitConfig>
  public_private_rules: PublicPrivateRules
  risk_detection_rules: RiskDetectionRules
}

export interface TransferAccountInfo {
  account_no: string
  account_name: string
  account_type?: string
  bank_code?: string
  bank_name?: string
  location?: string
}

export interface SettlementPreCheckRequest {
  payer_account_no: string
  transfer_type: TransferType
  transfer_mode: TransferMode
  payee_account: TransferAccountInfo
  amount: number
  purpose?: string
}

export interface LimitCheckResult {
  single_limit: number
  daily_limit: number
  monthly_limit: number
  daily_used_amount: number
  monthly_used_amount: number
  daily_remaining: number
  monthly_remaining: number
  within_single_limit: boolean
  within_daily_limit: boolean
  within_monthly_limit: boolean
  limit_error?: string
}

export interface PublicPrivateCheckResult {
  payer_type?: string
  payee_type?: string
  is_public_to_private: boolean
  is_private_to_public: boolean
  is_same_type: boolean
  allowed: boolean
  rule_error?: string
  purpose_required: boolean
  purpose_valid: boolean
  daily_limit?: number
  daily_used?: number
  daily_remaining?: number
}

export interface FeeCalcResult {
  fee: number
  fee_calc_desc: string
  min_fee: number
  max_fee: number
  rate: number
}

export interface SettlementPreCheckResult {
  passed: boolean
  blocked: boolean
  block_reason?: string
  block_field?: string
  warnings: string[]
  payer_account_valid: boolean
  payer_account_status: number
  payer_account_status_text: string
  payer_not_frozen: boolean
  payer_available_balance: number
  balance_sufficient: boolean
  payee_info_valid: boolean
  payee_name_matched: boolean
  amount_valid: boolean
  limit_check: LimitCheckResult
  public_private_check: PublicPrivateCheckResult
  fee_calc: FeeCalcResult
  arrival_time: string
  need_review: boolean
  review_reason?: string
  suggested_audit_level: number
}

export interface Settlement {
  id: string
  settlement_no: string
  batch_id?: string
  transfer_type: TransferType
  transfer_mode: TransferMode
  channel_code?: string
  payer_account_id: string
  payer_account_no: string
  payer_account_name?: string
  payer_customer_id?: string
  payer_account_type?: string
  payee_account_no: string
  payee_account_name: string
  payee_bank_code?: string
  payee_bank_name?: string
  payee_account_type?: string
  payee_location?: string
  amount: number
  currency: string
  fee: number
  fee_calc_desc?: string
  arrival_time?: string
  purpose?: string
  remark?: string
  org_id?: string
  operator_id?: string
  reviewer_id?: string
  status: SettlementStatus
  audit_status: AuditStatus
  risk_level?: RiskLevel
  risk_tags?: string
  need_review: boolean
  review_reason?: string
  cancel_reason?: string
  original_settlement_no?: string
  request_id?: string
  submit_time?: string
  review_time?: string
  settle_time?: string
  original_balance?: number
  new_balance?: number
  createdAt?: string
  updatedAt?: string
}

export interface SettlementVO extends Settlement {
  transfer_type_text?: string
  transfer_mode_text?: string
  status_text?: string
  audit_status_text?: string
  risk_level_text?: string
  org_name?: string
  operator_name?: string
  reviewer_name?: string
  amount_formatted?: string
  fee_formatted?: string
  payer_customer_name?: string
  is_risk_warning?: boolean
  progress_percent?: number
}

export interface SettlementQueryParams extends PageParams {
  keyword?: string
  settlement_no?: string
  payer_account_no?: string
  payee_account_no?: string
  payee_account_name?: string
  transfer_type?: TransferType
  transfer_mode?: TransferMode
  status?: SettlementStatus
  audit_status?: AuditStatus
  risk_level?: RiskLevel
  need_review?: boolean
  org_id?: string
  operator_id?: string
  reviewer_id?: string
  start_time?: string
  end_time?: string
  min_amount?: number
  max_amount?: number
  batch_id?: string
}

export interface CreateSettlementRequest {
  transfer_type: TransferType
  transfer_mode: TransferMode
  channel_code?: string
  payer_account_no: string
  payee_account_no: string
  payee_account_name: string
  payee_bank_code?: string
  payee_bank_name?: string
  payee_account_type?: string
  payee_location?: string
  amount: number
  currency?: string
  purpose?: string
  remark?: string
  request_id?: string
}

export interface CancelSettlementRequest {
  settlement_no: string
  cancel_reason: string
}

export interface ReviewSettlementRequest {
  settlement_no: string
  approved: boolean
  audit_level: number
  review_reason?: string
}

export interface SettlementTraceRequest {
  settlement_no?: string
  payer_account_no?: string
  payee_account_no?: string
  payer_customer_id?: string
  start_time?: string
  end_time?: string
}

export interface SameNameTransferCheck {
  has_risk: boolean
  same_name_count: number
  time_window_hours: number
  transfers: Array<{
    settlement_no: string
    amount: number
    create_time: string
    payee_account_name: string
  }>
}

export interface LargeAmountNoPurposeCheck {
  has_risk: boolean
  threshold: number
  transfers: Array<{
    settlement_no: string
    amount: number
    create_time: string
    payee_account_no: string
  }>
}

export interface AbnormalLocationCheck {
  has_risk: boolean
  transfers: Array<{
    settlement_no: string
    amount: number
    create_time: string
    payee_location: string
    is_abnormal: boolean
  }>
}

export interface AccountComplianceCheck {
  payer_compliant: boolean
  payee_compliant: boolean
  payer_issues: string[]
  payee_issues: string[]
}

export interface TransactionAuthenticityCheck {
  is_authentic: boolean
  authenticity_score: number
  issues: string[]
}

export interface SettlementTraceResult {
  query_params: SettlementTraceRequest
  total_count: number
  total_amount: number
  total_fee: number
  records: SettlementVO[]
  same_name_check: SameNameTransferCheck
  large_amount_check: LargeAmountNoPurposeCheck
  abnormal_location_check: AbnormalLocationCheck
  account_compliance_check: AccountComplianceCheck
  transaction_authenticity_check: TransactionAuthenticityCheck
  risk_warnings: Array<{
    risk_type: string
    risk_level: number
    description: string
    related_settlement_nos: string[]
  }>
  validation_passed: boolean
}

export interface BatchSettlementItem {
  index?: number
  payee_account_no: string
  payee_account_name: string
  payee_bank_code?: string
  payee_bank_name?: string
  payee_account_type?: string
  payee_location?: string
  amount: number
  purpose?: string
  remark?: string
}

export interface CreateBatchSettlementRequest {
  batch_name: string
  batch_type: BatchType
  payer_account_no: string
  channel_code?: string
  items: BatchSettlementItem[]
  remark?: string
}

export interface BatchSettlementResultItem {
  index: number
  success: boolean
  settlement_id?: string
  settlement_no?: string
  error?: string
  warning?: string
  need_review?: boolean
  pre_check_result?: SettlementPreCheckResult
  fee?: number
}

export interface BatchSettlementResult {
  batch_id: string
  batch_no: string
  total_count: number
  total_amount: number
  total_fee: number
  success_count: number
  fail_count: number
  pending_count: number
  details: BatchSettlementResultItem[]
}

export interface BatchQueryParams extends PageParams {
  keyword?: string
  batch_no?: string
  batch_name?: string
  batch_type?: BatchType
  payer_account_no?: string
  status?: number
  audit_status?: number
  need_review?: boolean
  org_id?: string
  operator_id?: string
  start_time?: string
  end_time?: string
}

export interface BatchSettlementVO {
  id: string
  batch_no: string
  batch_name: string
  batch_type: number
  batch_type_text?: string
  payer_account_id: string
  payer_account_no: string
  payer_account_name?: string
  total_count: number
  total_amount: number
  total_amount_formatted?: string
  total_fee: number
  total_fee_formatted?: string
  success_count: number
  fail_count: number
  pending_count: number
  processing_count: number
  status: number
  status_text?: string
  audit_status: number
  audit_status_text?: string
  need_review: boolean
  org_id?: string
  org_name?: string
  operator_id?: string
  operator_name?: string
  reviewer_id?: string
  reviewer_name?: string
  review_reason?: string
  remark?: string
  submit_time?: string
  complete_time?: string
  progress_percent?: number
  createdAt?: string
  updatedAt?: string
}

export interface BatchReviewRequest {
  batch_id: string
  approved: boolean
  review_reason?: string
}

export interface BatchProgressVO {
  batch_id: string
  batch_no: string
  status: number
  total_count: number
  success_count: number
  fail_count: number
  pending_count: number
  processing_count: number
  progress_percent: number
  latest_settlements: SettlementVO[]
}

export function getSettlementConfigApi() {
  return get<SettlementConfig>('/business/settlement/config')
}

export function preCheckSettlementApi(data: SettlementPreCheckRequest) {
  return post<SettlementPreCheckResult>('/business/settlement/precheck', data)
}

export function getSettlementListApi(params: SettlementQueryParams) {
  return get<PageResult<SettlementVO>>('/business/settlement/list', params)
}

export function getSettlementDetailApi(id: string) {
  return get<SettlementVO>(`/business/settlement/${id}`)
}

export function createSettlementApi(data: CreateSettlementRequest) {
  return post<SettlementVO>('/business/settlement', data)
}

export function cancelSettlementApi(data: CancelSettlementRequest) {
  return post<SettlementVO>(`/business/settlement/${data.settlement_no}/cancel`, data)
}

export function reviewSettlementApi(data: ReviewSettlementRequest) {
  return post<SettlementVO>(`/business/settlement/${data.settlement_no}/review`, data)
}

export function createBatchSettlementApi(data: CreateBatchSettlementRequest) {
  return post<BatchSettlementResult>('/business/settlement/batch', data)
}

export function getBatchListApi(params: BatchQueryParams) {
  return get<PageResult<BatchSettlementVO>>('/business/settlement/batch/list', params)
}

export function getBatchDetailApi(id: string) {
  return get<BatchSettlementVO>(`/business/settlement/batch/${id}`)
}

export function reviewBatchApi(data: BatchReviewRequest) {
  return post<BatchSettlementVO>(`/business/settlement/batch/${data.batch_id}/review`, data)
}

export function getBatchProgressApi(id: string) {
  return get<BatchProgressVO>(`/business/settlement/batch/${id}/progress`)
}

export function traceSettlementApi(data: SettlementTraceRequest) {
  return post<SettlementTraceResult>('/business/settlement/trace', data)
}

export function formatCurrency(value: number, digits = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
}

export function formatThousands(value: number): string {
  return formatCurrency(value, 2)
}
