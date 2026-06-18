import { get, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export type LoanType = 1 | 2 | 3 | 4
export type LoanStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type LoanTerm = 12 | 24 | 36 | 60 | 120 | 240 | 360
export type RepaymentMethod = 1 | 2 | 3 | 4

export const LOAN_TYPE_OPTIONS = [
  { label: '个人消费贷', value: 1 },
  { label: '经营贷', value: 2 },
  { label: '房贷', value: 3 },
  { label: '车贷', value: 4 }
]

export const LOAN_STATUS_OPTIONS = [
  { label: '待提交', value: 0, type: 'info' },
  { label: '待预审', value: 1, type: 'warning' },
  { label: '预审通过', value: 2, type: 'success' },
  { label: '预审拒绝', value: 3, type: 'danger' },
  { label: '待终审', value: 4, type: 'warning' },
  { label: '终审通过', value: 5, type: 'success' },
  { label: '终审拒绝', value: 6, type: 'danger' },
  { label: '已放款', value: 7, type: 'success' },
  { label: '已撤销', value: 8, type: 'info' }
]

export const LOAN_TERM_OPTIONS = [
  { label: '12个月', value: 12 },
  { label: '24个月', value: 24 },
  { label: '36个月', value: 36 },
  { label: '5年', value: 60 },
  { label: '10年', value: 120 },
  { label: '20年', value: 240 },
  { label: '30年', value: 360 }
]

export const REPAYMENT_METHOD_OPTIONS = [
  { label: '等额本息', value: 1 },
  { label: '等额本金', value: 2 },
  { label: '先息后本', value: 3 },
  { label: '到期一次还本付息', value: 4 }
]

export const LOAN_PURPOSE_OPTIONS = [
  { label: '日常消费', value: 'consumption' },
  { label: '经营周转', value: 'business' },
  { label: '购房', value: 'house' },
  { label: '购车', value: 'car' },
  { label: '教育', value: 'education' },
  { label: '旅游', value: 'travel' },
  { label: '医疗', value: 'medical' },
  { label: '其他', value: 'other' }
]

export const LARGE_LOAN_THRESHOLD = 1000000
export const LOW_QUALITY_CUSTOMER_LEVEL = 2

export interface LoanTypeConfig {
  loan_type: number
  name: string
  max_amount: number
  min_amount: number
  interest_rate_base: number
  interest_rate_min: number
  interest_rate_max: number
  available_terms: number[]
  repayment_methods: number[]
  require_collateral: boolean
  pre_approval_process: string[]
  final_approval_process: string[]
}

export interface LoanProduct {
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
  loan_type?: number
}

export interface LoanConfig {
  loan_types: typeof LOAN_TYPE_OPTIONS
  loan_statuses: typeof LOAN_STATUS_OPTIONS
  loan_terms: typeof LOAN_TERM_OPTIONS
  repayment_methods: typeof REPAYMENT_METHOD_OPTIONS
  loan_purposes: typeof LOAN_PURPOSE_OPTIONS
  type_configs: Record<number, LoanTypeConfig>
  large_loan_threshold: number
  low_quality_customer_level: number
  products: LoanProduct[]
}

export interface LoanPreCheckRequest {
  customer_id?: string
  customer_no?: string
  id_card_no?: string
  loan_type: LoanType
  amount: number
  term?: number
  purpose?: string
}

export interface LoanPreCheckResult {
  passed: boolean
  credit_status_valid: boolean
  debt_ratio_valid: boolean
  account_activity_valid: boolean
  repayment_history_valid: boolean
  purpose_compliant: boolean
  amount_matched: boolean
  credit_score?: number
  debt_ratio?: number
  account_activity_score?: number
  overdue_count?: number
  max_loan_amount?: number
  suggested_amount?: number
  block_reason?: string
  warnings: string[]
  applicable_rate?: number
  required_materials?: string[]
}

export interface Loan {
  id: string
  loan_no: string
  customer_id?: string
  customer_no?: string
  customer_name?: string
  id_card_no?: string
  loan_type: LoanType
  loan_type_text: string
  product_id?: string
  product_name?: string
  amount: number
  term: number
  term_text: string
  purpose: string
  purpose_text: string
  purpose_detail?: string
  repayment_method: RepaymentMethod
  repayment_method_text: string
  interest_rate: number
  total_interest?: number
  monthly_payment?: number
  status: LoanStatus
  status_text: string
  apply_time?: string
  pre_approve_time?: string
  final_approve_time?: string
  disburse_time?: string
  cancel_time?: string
  cancel_reason?: string
  cancel_operator_id?: string
  cancel_operator_name?: string
  org_id?: string
  org_name?: string
  operator_id?: string
  operator_name?: string
  pre_reviewer_id?: string
  pre_reviewer_name?: string
  final_reviewer_id?: string
  final_reviewer_name?: string
  pre_approve_result?: string
  final_approve_result?: string
  pre_approve_opinion?: string
  final_approve_opinion?: string
  is_low_quality?: boolean
  risk_level?: number
  risk_tags?: string
  credit_score?: number
  debt_ratio?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface LoanQueryParams extends PageParams {
  keyword?: string
  loan_no?: string
  customer_no?: string
  customer_name?: string
  id_card_no?: string
  loan_type?: LoanType
  product_id?: string
  status?: LoanStatus
  org_id?: string
  operator_id?: string
  reviewer_id?: string
  start_time?: string
  end_time?: string
  min_amount?: number
  max_amount?: number
  is_pre_approved?: boolean
  is_final_approved?: boolean
}

export interface CreateLoanRequest {
  customer_id?: string
  customer_no?: string
  loan_type: LoanType
  product_id?: string
  amount: number
  term: number
  purpose: string
  purpose_detail?: string
  repayment_method: RepaymentMethod
  interest_rate?: number
  collateral_info?: any
  contact_info?: any
  income_info?: any
  remark?: string
  apply_channel?: string
}

export interface BatchLoanItem {
  index?: number
  customer_no?: string
  id_card_no?: string
  loan_type: LoanType
  amount: number
  term: number
  purpose: string
  repayment_method: RepaymentMethod
  remark?: string
}

export interface BatchLoanRequest {
  items: BatchLoanItem[]
  remark?: string
}

export interface BatchLoanResultItem {
  index: number
  success: boolean
  loan_id?: string
  loan_no?: string
  is_low_quality?: boolean
  need_review?: boolean
  errors?: string[]
  warnings?: string[]
  pre_check?: LoanPreCheckResult
}

export interface BatchLoanResult {
  success_count: number
  fail_count: number
  low_quality_count: number
  review_count: number
  details: BatchLoanResultItem[]
}

export interface BatchLoanReviewItem {
  id: string
  operation: 'approve' | 'reject'
  reason?: string
}

export interface BatchLoanReviewRequest {
  items: BatchLoanReviewItem[]
  review_type: 'pre' | 'final'
}

export interface BatchLoanReviewResult {
  success_count: number
  fail_count: number
  details: Array<{
    id: string
    success: boolean
    message?: string
  }>
}

export interface LoanTraceRequest {
  customer_id?: string
  customer_no?: string
  id_card_no?: string
  loan_no?: string
  start_time?: string
  end_time?: string
}

export interface LoanTraceOverdueItem {
  loan_no: string
  amount: number
  overdue_days: number
  overdue_amount: number
  status: string
}

export interface LoanTraceMultiLendItem {
  loan_no: string
  loan_type: number
  amount: number
  create_time: string
  lender: string
}

export interface LoanTraceResult {
  query_params: LoanTraceRequest
  total_count: number
  total_amount: number
  records: Loan[]
  overdue_check: {
    has_overdue: boolean
    unsettled_overdue: boolean
    overdue_records: LoanTraceOverdueItem[]
  }
  multi_lending_check: {
    has_multi_lending: boolean
    active_loan_count: number
    active_loan_amount: number
    lendings: LoanTraceMultiLendItem[]
  }
  fraud_check: {
    has_fraud_risk: boolean
    info_inconsistency: boolean
    risk_items: string[]
  }
  info_consistency_check: {
    passed: boolean
    inconsistent_fields: string[]
  }
  validation_passed: boolean
  risk_prompts: string[]
  abnormal_archives: Loan[]
}

export function getLoanConfigApi() {
  return get<LoanConfig>('/business/loan/config')
}

export function preCheckLoanApi(data: LoanPreCheckRequest) {
  return post<LoanPreCheckResult>('/business/loan/precheck', data)
}

export function getLoanListApi(params: LoanQueryParams) {
  return get<PageResult<Loan>>('/business/loan/list', params)
}

export function getLoanDetailApi(id: string) {
  return get<Loan>(`/business/loan/${id}`)
}

export function createLoanApi(data: CreateLoanRequest) {
  return post<Loan>('/business/loan', data)
}

export function cancelLoanApi(id: string, reason?: string) {
  return post<Loan>(`/business/loan/${id}/cancel`, { reason })
}

export function preApproveLoanApi(id: string, approved: boolean, opinion?: string) {
  return post<Loan>(`/business/loan/${id}/preapprove`, { approved, opinion })
}

export function finalApproveLoanApi(id: string, approved: boolean, opinion?: string) {
  return post<Loan>(`/business/loan/${id}/finalapprove`, { approved, opinion })
}

export function batchPreCheckLoanApi(data: BatchLoanRequest) {
  return post<{ details: Array<{ index: number; passed: boolean; pre_check: LoanPreCheckResult; errors?: string[] }> }>('/business/loan/batch/precheck', data)
}

export function batchLoanApi(data: BatchLoanRequest) {
  return post<BatchLoanResult>('/business/loan/batch', data)
}

export function batchReviewLoanApi(data: BatchLoanReviewRequest) {
  return post<BatchLoanReviewResult>('/business/loan/batch/review', data)
}

export function traceLoanApi(data: LoanTraceRequest) {
  return post<LoanTraceResult>('/business/loan/trace', data)
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
