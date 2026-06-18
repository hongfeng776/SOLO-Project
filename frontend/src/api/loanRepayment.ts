import { get, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export type RepaymentType = 1 | 2 | 3 | 4
export type RepaymentStatus = 0 | 1 | 2 | 3 | 4
export type RepaymentChannel = 'active' | 'auto_withhold' | 'offline' | 'transfer'
export type WithholdStatus = 0 | 1 | 2 | 3 | 4

export const REPAYMENT_TYPE_OPTIONS = [
  { label: '按期还款', value: 1, type: 'primary' },
  { label: '提前还款', value: 2, type: 'success' },
  { label: '逾期还款', value: 3, type: 'warning' },
  { label: '分期还款', value: 4, type: 'info' }
]

export const REPAYMENT_STATUS_OPTIONS = [
  { label: '待还款', value: 0, type: 'info' },
  { label: '还款中', value: 1, type: 'warning' },
  { label: '还款成功', value: 2, type: 'success' },
  { label: '还款失败', value: 3, type: 'danger' },
  { label: '已撤销', value: 4, type: 'info' }
]

export const REPAYMENT_CHANNEL_OPTIONS = [
  { label: '主动还款', value: 'active', type: 'primary' },
  { label: '自动代扣', value: 'auto_withhold', type: 'success' },
  { label: '线下还款', value: 'offline', type: 'warning' },
  { label: '转账还款', value: 'transfer', type: 'info' }
]

export const WITHHOLD_STATUS_OPTIONS = [
  { label: '待代扣', value: 0, type: 'info' },
  { label: '代扣中', value: 1, type: 'warning' },
  { label: '代扣成功', value: 2, type: 'success' },
  { label: '代扣失败', value: 3, type: 'danger' },
  { label: '已取消', value: 4, type: 'info' }
]

export const PREPAYMENT_PENALTY_RATE = 0.01
export const OVERDUE_DAILY_RATE = 0.0005

export interface RepaymentBillVO {
  id: string
  loan_id: string
  loan_no: string
  period_no: number
  total_periods: number
  bill_date: string
  due_date: string
  principal: number
  interest: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  status: number
  status_text: string
  is_overdue: boolean
  overdue_days: number
  overdue_fine: number
}

export interface RepaymentPreCheckResult {
  can_repay: boolean
  loan_status_valid: boolean
  account_status_valid: boolean
  balance_sufficient: boolean
  withhold_agreement_valid: boolean
  due_date_valid: boolean
  current_period: number
  total_periods: number
  due_amount: number
  due_date: string
  remaining_principal: number
  overdue_days: number
  overdue_amount: number
  block_reason?: string
  warnings: string[]
}

export interface RepaymentDetailVO {
  loan_id: string
  loan_no: string
  customer_name: string
  id_card_no: string
  loan_type: number
  loan_type_text: string
  loan_amount: number
  loan_term: number
  loan_term_text: string
  interest_rate: number
  repayment_method: number
  repayment_method_text: string
  loan_status: number
  loan_status_text: string
  disburse_date: string
  remaining_principal: number
  total_repaid_principal: number
  total_repaid_interest: number
  total_repaid_amount: number
  current_period: number
  total_periods: number
  current_bill?: RepaymentBillVO
  overdue_days: number
  overdue_amount: number
  next_due_date: string
  next_due_amount: number
  can_prepay: boolean
  prepayment_penalty: number
  account_no: string
  account_balance: number
  withhold_agreement_valid: boolean
  settlement_progress: number
  credit_report_status: number
  credit_report_status_text: string
  bills: RepaymentBillVO[]
}

export interface DoRepaymentRequest {
  loan_id: string
  repayment_type: RepaymentType
  repayment_channel: string
  amount: number
  period_no?: number
  account_id?: string
  remark?: string
}

export interface DoRepaymentResult {
  success: boolean
  repayment_id: string
  loan_id: string
  loan_no: string
  repayment_type: number
  repayment_type_text: string
  amount: number
  principal: number
  interest: number
  penalty: number
  fee: number
  status: number
  status_text: string
  repayment_time: string
  remaining_principal: number
  remaining_periods: number
  settlement_progress: number
  is_settled: boolean
  message: string
  transaction_no: string
}

export interface BatchWithholdQueryParams extends PageParams {
  keyword?: string
  loan_no?: string
  customer_name?: string
  id_card_no?: string
  loan_type?: number
  status?: number
  is_overdue?: boolean
  min_due_amount?: number
  max_due_amount?: number
  repayment_priority?: number
  start_date?: string
  end_date?: string
}

export interface BatchWithholdItem {
  id: string
  loan_id: string
  loan_no: string
  customer_id: string
  customer_name: string
  id_card_no: string
  loan_type: number
  loan_type_text: string
  loan_amount: number
  due_amount: number
  due_date: string
  period_no: number
  total_periods: number
  overdue_days: number
  is_overdue: boolean
  repayment_priority: number
  account_id?: string
  account_no?: string
  account_balance: number
  balance_sufficient: boolean
  withhold_agreement_valid: boolean
  status: number
  status_text: string
  can_withhold: boolean
  cannot_reason?: string
  selected?: boolean
}

export interface BatchWithholdRequest {
  items: Array<{
    loan_id: string
    due_amount: number
  }>
}

export interface BatchWithholdResult {
  total_count: number
  success_count: number
  fail_count: number
  total_success_amount: number
  total_fail_amount: number
  details: Array<{
    loan_id: string
    loan_no: string
    customer_name: string
    due_amount: number
    success: boolean
    status: number
    message: string
    transaction_no?: string
  }>
  abnormal_list: Array<{
    loan_id: string
    loan_no: string
    customer_name: string
    due_amount: number
    abnormal_type: string
    abnormal_reason: string
  }>
}

export interface RepaymentLogVO {
  id: string
  loan_id: string
  loan_no: string
  repayment_id: string
  period_no: number
  repayment_type: number
  repayment_type_text: string
  repayment_channel: string
  repayment_channel_text: string
  amount: number
  principal: number
  interest: number
  penalty: number
  fee: number
  status: number
  status_text: string
  operator_id?: string
  operator_name?: string
  operation_time: string
  account_id?: string
  account_no?: string
  transaction_no?: string
  before_balance?: number
  after_balance?: number
  fund_flow?: string
  bill_matched?: number
  bill_match_result?: string
  abnormal_flag?: number
  abnormal_type?: string
  abnormal_reason?: string
  need_review?: number
  review_status?: number
  ip_address?: string
  request_snapshot?: string
}

export interface RepaymentTraceRequest {
  loan_id?: string
  loan_no?: string
  repayment_id?: string
  transaction_no?: string
  start_date?: string
  end_date?: string
}

export interface RepaymentTraceResult {
  loan_id: string
  loan_no: string
  total_repayment_count: number
  total_repayment_amount: number
  total_principal_paid: number
  total_interest_paid: number
  total_penalty_paid: number
  repayment_records: RepaymentLogVO[]
  duplicate_check: {
    has_duplicate: boolean
    duplicate_count: number
    duplicate_records: string[]
  }
  amount_check: {
    passed: boolean
    abnormal_amount_count: number
    abnormal_items: string[]
  }
  bill_match_check: {
    passed: boolean
    unmatched_count: number
    unmatched_items: string[]
  }
  consistency_check: {
    passed: boolean
    inconsistent_count: number
    inconsistent_items: string[]
  }
  abnormal_review: {
    has_abnormal: boolean
    abnormal_count: number
    need_review_count: number
    abnormal_items: string[]
  }
}

export function preCheckRepaymentApi(loan_id: string, account_id?: string, repayment_type?: number) {
  return post<RepaymentPreCheckResult>('/business/loan/repayment/precheck', { loan_id, account_id, repayment_type })
}

export function getRepaymentDetailApi(id: string, account_id?: string) {
  return get<RepaymentDetailVO>(`/business/loan/repayment/${id}`, { account_id })
}

export function doRepaymentApi(data: DoRepaymentRequest) {
  return post<DoRepaymentResult>('/business/loan/repayment', data)
}

export function getWithholdListApi(params: BatchWithholdQueryParams) {
  return get<PageResult<BatchWithholdItem>>('/business/loan/repayment/withhold/list', params)
}

export function batchWithholdApi(data: BatchWithholdRequest) {
  return post<BatchWithholdResult>('/business/loan/repayment/withhold/batch', data)
}

export function traceRepaymentApi(data: RepaymentTraceRequest) {
  return post<RepaymentTraceResult>('/business/loan/repayment/trace', data)
}

export function generateWithholdRecordsApi() {
  return post<{ count: number; message: string }>('/business/loan/repayment/generate-withhold')
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

export function getRepaymentTypeLabel(type: number): string {
  const item = REPAYMENT_TYPE_OPTIONS.find(opt => opt.value === type)
  return item?.label || '未知'
}

export function getRepaymentTypeType(type: number): string {
  const item = REPAYMENT_TYPE_OPTIONS.find(opt => opt.value === type)
  return item?.type || 'info'
}

export function getRepaymentStatusLabel(status: number): string {
  const item = REPAYMENT_STATUS_OPTIONS.find(opt => opt.value === status)
  return item?.label || '未知'
}

export function getRepaymentStatusType(status: number): string {
  const item = REPAYMENT_STATUS_OPTIONS.find(opt => opt.value === status)
  return item?.type || 'info'
}

export function getWithholdStatusLabel(status: number): string {
  const item = WITHHOLD_STATUS_OPTIONS.find(opt => opt.value === status)
  return item?.label || '未知'
}

export function getWithholdStatusType(status: number): string {
  const item = WITHHOLD_STATUS_OPTIONS.find(opt => opt.value === status)
  return item?.type || 'info'
}
