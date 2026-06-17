import { get, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export type DepositType = 1 | 2 | 3
export type DepositStatus = 0 | 1 | 2 | 3 | 4 | 5
export type DepositTerm = 0 | 30 | 90 | 180 | 365 | 730 | 1095 | 1825
export type InterestCalcMethod = 1 | 2 | 3 | 4

export const DEPOSIT_TYPE_OPTIONS = [
  { label: '普通存款', value: 1 },
  { label: '大额存单', value: 2 },
  { label: '智能存款', value: 3 }
]

export const DEPOSIT_STATUS_OPTIONS = [
  { label: '待确认', value: 0, type: 'info' },
  { label: '已入账', value: 1, type: 'success' },
  { label: '已撤销', value: 2, type: 'warning' },
  { label: '已到期', value: 3, type: '' },
  { label: '已提前支取', value: 4, type: 'warning' },
  { label: '待复核', value: 5, type: 'warning' }
]

export const DEPOSIT_TERM_OPTIONS = [
  { label: '活期', value: 0 },
  { label: '1个月', value: 30 },
  { label: '3个月', value: 90 },
  { label: '6个月', value: 180 },
  { label: '1年', value: 365 },
  { label: '2年', value: 730 },
  { label: '3年', value: 1095 },
  { label: '5年', value: 1825 }
]

export const INTEREST_CALC_METHOD_OPTIONS = [
  { label: '按季付息', value: 1 },
  { label: '按年付息', value: 2 },
  { label: '到期付息', value: 3 },
  { label: '按月付息', value: 4 }
]

export const LARGE_DEPOSIT_THRESHOLD = 200000
export const BATCH_SMALL_AMOUNT_THRESHOLD = 50000

export interface DepositProduct {
  id: string
  name: string
  code: string
  category: string
  type: string
  description: string
  risk_level: number
  min_amount: number
  max_amount: number
  interest_rate: number
  term_days: number
  sort: number
  status: number
  deposit_type?: number
}

export interface DepositLimitConfig {
  account_type: number
  single_limit: number
  daily_limit: number
}

export interface DepositConfig {
  deposit_types: typeof DEPOSIT_TYPE_OPTIONS
  deposit_statuses: typeof DEPOSIT_STATUS_OPTIONS
  deposit_terms: typeof DEPOSIT_TERM_OPTIONS
  interest_calc_methods: typeof INTEREST_CALC_METHOD_OPTIONS
  limit_configs: Record<number, DepositLimitConfig>
  large_deposit_threshold: number
  batch_small_amount_threshold: number
  products: DepositProduct[]
}

export interface DepositPreCheckRequest {
  account_no: string
  deposit_type: DepositType
  product_id?: string
  amount: number
  term?: DepositTerm
}

export interface DepositPreCheckResult {
  passed: boolean
  account_valid: boolean
  not_frozen: boolean
  not_lost: boolean
  risk_compliant: boolean
  within_single_limit: boolean
  within_daily_limit: boolean
  product_available: boolean
  single_limit: number
  daily_limit: number
  current_daily_amount: number
  remaining_daily_limit: number
  block_reason?: string
  warnings: string[]
  suggested_products?: DepositProduct[]
  applicable_rate?: number
}

export interface Deposit {
  id: string
  deposit_no: string
  account_no: string
  account_id?: string
  deposit_type: DepositType
  deposit_type_text: string
  product_id?: string
  product_name?: string
  amount: number
  currency?: string
  term: DepositTerm
  term_text: string
  interest_rate: number
  interest_amount?: number
  interest_calc_method: InterestCalcMethod
  value_date?: string
  maturity_date?: string
  status: DepositStatus
  status_text: string
  original_balance?: number
  new_balance?: number
  customer_id?: string
  customer_no?: string
  customer_name?: string
  org_id?: string
  org_name?: string
  operator_id?: string
  operator_name?: string
  reviewer_id?: string
  reviewer_name?: string
  remark?: string
  need_review?: number
  review_reason?: string
  review_time?: string
  cancel_reason?: string
  cancel_operator_id?: string
  cancel_operator_name?: string
  cancel_time?: string
  confirm_time?: string
  createdAt?: string
  updatedAt?: string
}

export interface DepositQueryParams extends PageParams {
  keyword?: string
  deposit_no?: string
  account_no?: string
  customer_no?: string
  deposit_type?: DepositType
  product_id?: string
  status?: DepositStatus
  org_id?: string
  operator_id?: string
  start_time?: string
  end_time?: string
  min_amount?: number
  max_amount?: number
  term?: DepositTerm
}

export interface CreateDepositRequest {
  account_no: string
  deposit_type: DepositType
  product_id?: string
  amount: number
  term: DepositTerm
  interest_calc_method?: InterestCalcMethod
  remark?: string
}

export interface BatchDepositItem {
  index?: number
  account_no: string
  deposit_type: DepositType
  product_id?: string
  amount: number
  term: DepositTerm
  interest_calc_method?: InterestCalcMethod
  remark?: string
}

export interface BatchDepositResultItem {
  index: number
  success: boolean
  deposit_id?: string
  deposit_no?: string
  need_review?: boolean
  errors?: string[]
  warnings?: string[]
  pre_check?: DepositPreCheckResult
}

export interface BatchDepositRequest {
  items: BatchDepositItem[]
  remark?: string
}

export interface BatchDepositResult {
  success_count: number
  fail_count: number
  review_count: number
  details: BatchDepositResultItem[]
}

export interface BatchDepositReviewItem {
  id: string
  operation: 'approve' | 'reject'
  reason?: string
}

export interface BatchDepositReviewRequest {
  items: BatchDepositReviewItem[]
}

export interface BatchDepositReviewResult {
  success_count: number
  fail_count: number
  details: Array<{
    id: string
    success: boolean
    message?: string
  }>
}

export interface DepositTraceRequest {
  account_no?: string
  deposit_no?: string
  customer_no?: string
}

export interface DepositTraceResult {
  query_params: DepositTraceRequest
  total_count: number
  total_amount: number
  records: Deposit[]
  duplicate_check: {
    has_duplicate: boolean
    duplicates: Array<{
      deposit_no: string
      amount: number
      create_time: string
      time_diff_minutes: number
    }>
  }
  amount_anomaly_check: {
    has_anomaly: boolean
    anomalies: Array<{
      deposit_no: string
      amount: number
      average_amount: number
      deviation_percent: number
    }>
  }
  rate_match_check: {
    has_mismatch: boolean
    mismatches: Array<{
      deposit_no: string
      deposit_type: DepositType
      term: DepositTerm
      applied_rate: number
      expected_rate: number
      diff: number
    }>
  }
  validation_passed: boolean
  risk_prompts: string[]
}

export function getDepositConfigApi() {
  return get<DepositConfig>('/business/deposit/config')
}

export function preCheckDepositApi(data: DepositPreCheckRequest) {
  return post<DepositPreCheckResult>('/business/deposit/precheck', data)
}

export function getDepositListApi(params: DepositQueryParams) {
  return get<PageResult<Deposit>>('/business/deposit/list', params)
}

export function getDepositDetailApi(id: string) {
  return get<Deposit>(`/business/deposit/${id}`)
}

export function createDepositApi(data: CreateDepositRequest) {
  return post<Deposit>('/business/deposit', data)
}

export function cancelDepositApi(id: string) {
  return post<Deposit>(`/business/deposit/${id}/cancel`)
}

export function confirmDepositApi(id: string) {
  return post<Deposit>(`/business/deposit/${id}/confirm`)
}

export function batchDepositApi(data: BatchDepositRequest) {
  return post<BatchDepositResult>('/business/deposit/batch', data)
}

export function batchReviewDepositApi(data: BatchDepositReviewRequest) {
  return post<BatchDepositReviewResult>('/business/deposit/batch/review', data)
}

export function traceDepositApi(data: DepositTraceRequest) {
  return post<DepositTraceResult>('/business/deposit/trace', data)
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
