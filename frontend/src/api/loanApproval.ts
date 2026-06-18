import { get, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export type ApprovalLevel = 1 | 2 | 3 | 4 | 5
export type ApprovalResult = 1 | 2 | 3
export type ApprovalStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export const APPROVAL_LEVEL_OPTIONS = [
  { label: '一级审批', value: 1 },
  { label: '二级审批', value: 2 },
  { label: '三级审批', value: 3 },
  { label: '四级审批', value: 4 },
  { label: '五级审批', value: 5 }
]

export const APPROVAL_RESULT_OPTIONS = [
  { label: '通过', value: 1, type: 'success' },
  { label: '驳回', value: 2, type: 'danger' },
  { label: '取消', value: 3, type: 'info' }
]

export const APPROVAL_STATUS_OPTIONS = [
  { label: '待进入审批', value: 0, type: 'info' },
  { label: '审批中', value: 1, type: 'warning' },
  { label: '一级通过', value: 2, type: 'success' },
  { label: '二级通过', value: 3, type: 'success' },
  { label: '三级通过', value: 4, type: 'success' },
  { label: '四级通过', value: 5, type: 'success' },
  { label: '五级通过', value: 6, type: 'success' },
  { label: '审批完成', value: 7, type: 'success' }
]

export const REJECT_REASON_OPTIONS = [
  { code: 'credit_bad', label: '征信不良' },
  { code: 'debt_high', label: '负债过高' },
  { code: 'income_insufficient', label: '收入证明不足' },
  { code: 'material_missing', label: '资料缺失' },
  { code: 'material_fake', label: '资料造假' },
  { code: 'purpose_illegal', label: '贷款用途不合规' },
  { code: 'risk_high', label: '风险等级过高' },
  { code: 'policy_violation', label: '违反政策规定' },
  { code: 'other', label: '其他原因' }
]

export const SINGLE_LEVEL_APPROVAL_THRESHOLD = 500000
export const MULTI_LEVEL_APPROVAL_REQUIRED = 1000000
export const HIGH_RISK_LEVEL_THRESHOLD = 3

export const APPROVAL_LEVEL_CONFIG = {
  1: { level: 1, name: '一级审批', min_amount: 0, max_amount: 500000, required_role: 'operator' },
  2: { level: 2, name: '二级审批', min_amount: 500000, max_amount: 1000000, required_role: 'manager' },
  3: { level: 3, name: '三级审批', min_amount: 1000000, max_amount: 3000000, required_role: 'manager' },
  4: { level: 4, name: '四级审批', min_amount: 3000000, max_amount: 5000000, required_role: 'auditor' },
  5: { level: 5, name: '五级审批', min_amount: 5000000, max_amount: 999999999, required_role: 'admin' }
}

export interface MaterialCheckItem {
  field: string
  name: string
  required: boolean
  has_value: boolean
  is_abnormal: boolean
  value?: any
  expected_value?: any
  remark?: string
}

export interface CreditReport {
  credit_score: number
  credit_level: string
  overdue_count: number
  overdue_amount: number
  current_loan_count: number
  current_loan_amount: number
  query_count_30days: number
  public_records: string[]
  report_date: string
}

export interface DebtData {
  total_debt_amount: number
  monthly_debt_payment: number
  monthly_income: number
  debt_to_income_ratio: number
  credit_card_balance: number
  other_loan_balance: number
  mortgage_balance: number
}

export interface PreApprovalConclusion {
  pre_check_passed: boolean
  pre_reviewer: string
  pre_review_time: string
  pre_review_opinion: string
  risk_level: number
  risk_tags: string[]
  suggested_amount: number
  suggested_term: number
  special_notes: string
}

export interface ApprovalPreCheckResult {
  can_enter: boolean
  has_application_submitted: boolean
  has_pre_approval_passed: boolean
  has_materials_complete: boolean
  block_reason?: string
  material_checks: MaterialCheckItem[]
  abnormal_fields: string[]
  missing_materials: string[]
}

export interface ApprovalFlowVO {
  id: string
  loan_id: string
  loan_no: string
  current_level: number
  current_level_text: string
  total_levels: number
  status: number
  status_text: string
  approver_id?: string
  approver_name?: string
  approve_time?: string
  approval_result?: number
  approval_result_text?: string
  approval_opinion?: string
  reject_reason?: string
  next_level?: number
  next_level_text?: string
  is_current_level: boolean
  can_approve: boolean
}

export interface ApprovalLogVO {
  id: string
  loan_id: string
  loan_no: string
  approval_level: number
  approval_level_text: string
  operator_id: string
  operator_name: string
  operation_type: string
  operation_time: string
  from_status?: number
  from_status_text?: string
  to_status?: number
  to_status_text?: string
  approval_result?: number
  approval_result_text?: string
  approval_opinion?: string
  reject_reason?: string
  ip_address?: string
  user_agent?: string
  risk_level_before?: number
  risk_level_after?: number
  consistency_check?: number
  conflict_flag?: number
  conflict_reason?: string
}

export interface ApprovalDetailVO {
  loan_id: string
  loan_no: string
  customer_name: string
  id_card_no: string
  loan_type: number
  loan_type_text: string
  amount: number
  term: number
  term_text: string
  purpose: string
  purpose_text: string
  interest_rate: number
  repayment_method: number
  repayment_method_text: string
  status: number
  status_text: string
  apply_time: string
  pre_approval_passed: boolean
  pre_reviewer_name?: string
  pre_approve_time?: string
  pre_approve_opinion?: string
  current_level: number
  current_level_text: string
  total_levels: number
  approval_progress: number
  is_high_risk: boolean
  risk_level: number
  risk_tags: string
  credit_report?: CreditReport
  debt_data?: DebtData
  pre_approval_conclusion?: PreApprovalConclusion
  material_checks: MaterialCheckItem[]
  abnormal_fields: string[]
  approval_locked: boolean
  lock_reason?: string
  approval_flow?: ApprovalFlowVO[]
  approval_logs?: ApprovalLogVO[]
  contract_generated?: boolean
  contract_no?: string
}

export interface DoApprovalRequest {
  loan_id: string
  approval_level: number
  approval_result: number
  approval_opinion?: string
  reject_reason?: string
  reject_details?: string
  supporting_files?: string[]
  approved_amount?: number
  approved_term?: number
  approved_rate?: number
}

export interface DoApprovalResult {
  success: boolean
  loan_id: string
  loan_no: string
  current_level: number
  current_level_text: string
  status: number
  status_text: string
  approval_progress: number
  next_level?: number
  next_level_text?: string
  is_approval_complete: boolean
  contract_generated?: boolean
  contract_no?: string
  message?: string
}

export interface BatchApprovalQueryParams extends PageParams {
  keyword?: string
  loan_no?: string
  customer_name?: string
  id_card_no?: string
  loan_type?: number
  approval_status?: number
  min_amount?: number
  max_amount?: number
  risk_level?: number
  current_level?: number
  is_high_risk?: boolean
  start_time?: string
  end_time?: string
}

export interface BatchApprovalItem {
  loan_id: string
  loan_no: string
  customer_name: string
  id_card_no: string
  loan_type: number
  loan_type_text: string
  amount: number
  term: number
  term_text: string
  purpose_text: string
  interest_rate: number
  status: number
  status_text: string
  apply_time: string
  current_level: number
  current_level_text: string
  total_levels: number
  approval_progress: number
  risk_level: number
  is_high_risk: boolean
  risk_tags: string
  pre_approve_opinion?: string
  can_batch_approve: boolean
  cannot_approve_reason?: string
  selected?: boolean
}

export interface BatchApprovalRequest {
  items: Array<{
    loan_id: string
    approval_result: number
    approval_opinion?: string
    reject_reason?: string
  }>
  approval_level: number
}

export interface BatchApprovalResult {
  success_count: number
  fail_count: number
  details: Array<{
    loan_id: string
    loan_no: string
    success: boolean
    message?: string
  }>
}

export interface ApprovalTraceRequest {
  loan_id?: string
  loan_no?: string
  start_time?: string
  end_time?: string
}

export interface ApprovalTraceResult {
  loan_id: string
  loan_no: string
  total_approval_count: number
  approval_flow_records: ApprovalFlowVO[]
  approval_log_records: ApprovalLogVO[]
  consistency_check: {
    passed: boolean
    inconsistent_items: string[]
  }
  violation_check: {
    has_violation: boolean
    unauthorized_approvals: string[]
    illegal_approvals: string[]
    conflict_approvals: string[]
  }
  operation_log_complete: boolean
  missing_logs: string[]
}

export interface GenerateContractResult {
  success: boolean
  contract_no: string
  contract_url: string
  generated_at: string
}

export function preCheckApprovalApi(loan_id: string) {
  return post<ApprovalPreCheckResult>('/business/loan/approval/precheck', { loan_id })
}

export function getApprovalDetailApi(id: string) {
  return get<ApprovalDetailVO>(`/business/loan/approval/${id}`)
}

export function doApprovalApi(data: DoApprovalRequest) {
  return post<DoApprovalResult>('/business/loan/approval/approve', data)
}

export function getPendingApprovalListApi(params: BatchApprovalQueryParams) {
  return get<PageResult<BatchApprovalItem>>('/business/loan/approval/pending/list', params)
}

export function batchApprovalApi(data: BatchApprovalRequest) {
  return post<BatchApprovalResult>('/business/loan/approval/batch', data)
}

export function traceApprovalApi(data: ApprovalTraceRequest) {
  return post<ApprovalTraceResult>('/business/loan/approval/trace', data)
}

export function generateContractApi(loan_id: string) {
  return post<GenerateContractResult>('/business/loan/approval/contract', { loan_id })
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

export function getApprovalLevelLabel(level: number): string {
  const item = APPROVAL_LEVEL_OPTIONS.find(opt => opt.value === level)
  return item?.label || `第${level}级审批`
}

export function getApprovalResultLabel(result: number): string {
  const item = APPROVAL_RESULT_OPTIONS.find(opt => opt.value === result)
  return item?.label || '未知'
}

export function getApprovalResultType(result: number): string {
  const item = APPROVAL_RESULT_OPTIONS.find(opt => opt.value === result)
  return item?.type || 'info'
}
