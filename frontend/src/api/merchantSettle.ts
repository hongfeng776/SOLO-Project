import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export enum SettlePeriod {
  DAY = 1,
  WEEK = 2,
  MONTH = 3,
  QUARTER = 4,
}

export enum ApplyStatus {
  PENDING = 1,
  APPROVED = 2,
  REJECTED = 3,
  PAYING = 4,
  PAID = 5,
  PAY_FAILED = 6,
}

export enum DeductType {
  PLATFORM_FEE = 1,
  AFTERSALE_REFUND = 2,
  VIOLATION_FINE = 3,
  DEPOSIT = 4,
  OTHER = 5,
}

export enum AuditAction {
  SUBMIT_APPLY = 1,
  AUDIT_PASS = 2,
  AUDIT_REJECT = 3,
  START_PAY = 4,
  PAY_SUCCESS = 5,
  PAY_FAIL = 6,
  RETRY_PAY = 7,
}

export enum ApplySource {
  MERCHANT_INITIATIVE = 1,
  SYSTEM_AUTO = 2,
  PLATFORM_BATCH = 3,
}

export enum BankVerifyStatus {
  UNVERIFIED = 0,
  VERIFYING = 1,
  VERIFIED = 2,
  VERIFY_FAILED = 3,
}

export const SETTLE_PERIOD_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '日结', value: 1 },
  { label: '周结', value: 2 },
  { label: '月结', value: 3 },
  { label: '季结', value: 4 },
]

export const APPLY_STATUS_OPTIONS: Array<{ label: string; value: number; color: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = [
  { label: '待审核', value: 1, color: '#E6A23C', type: 'warning' },
  { label: '审核通过', value: 2, color: '#409EFF', type: 'primary' },
  { label: '审核驳回', value: 3, color: '#F56C6C', type: 'danger' },
  { label: '打款中', value: 4, color: '#909399', type: 'info' },
  { label: '已到账', value: 5, color: '#67C23A', type: 'success' },
  { label: '打款失败', value: 6, color: '#F56C6C', type: 'danger' },
]

export const DEDUCT_TYPE_OPTIONS: Array<{ label: string; value: number; color: string }> = [
  { label: '平台手续费', value: 1, color: '#409EFF' },
  { label: '售后退款', value: 2, color: '#E6A23C' },
  { label: '违规罚款', value: 3, color: '#F56C6C' },
  { label: '保证金', value: 4, color: '#909399' },
  { label: '其他', value: 5, color: '#67C23A' },
]

export const AUDIT_ACTION_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '提交申请', value: 1 },
  { label: '审核通过', value: 2 },
  { label: '审核驳回', value: 3 },
  { label: '开始打款', value: 4 },
  { label: '打款成功', value: 5 },
  { label: '打款失败', value: 6 },
  { label: '重试打款', value: 7 },
]

export const APPLY_SOURCE_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '商家主动', value: 1 },
  { label: '系统自动', value: 2 },
  { label: '平台批量', value: 3 },
]

export const BANK_VERIFY_OPTIONS: Array<{ label: string; value: number; color: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = [
  { label: '未认证', value: 0, color: '#909399', type: 'info' },
  { label: '认证中', value: 1, color: '#E6A23C', type: 'warning' },
  { label: '认证通过', value: 2, color: '#67C23A', type: 'success' },
  { label: '认证失败', value: 3, color: '#F56C6C', type: 'danger' },
]

export const DEDUCT_BRANCH_LABEL: Record<number, string> = {
  1: '正常结算',
  2: '售后扣减',
  3: '违规罚款',
}

export interface SettleApplyItem {
  id: number
  apply_no: string
  merchant_id: number
  merchant_name: string
  shop_name: string
  shop_status: number
  certification_status: number
  period_type: number
  period_start: string
  period_end: string
  base_amount: number
  platform_fee: number
  aftersale_deduct: number
  violation_fine: number
  deposit_deduct: number
  other_deduct: number
  total_deduct: number
  actual_amount: number
  status: number
  apply_source: number
  bank_account_name: string
  bank_account_no: string
  bank_name: string
  bank_branch: string
  bank_verify_status: number
  apply_time: string
  audit_time?: string
  pay_time?: string
  arrive_time?: string
  reject_reason?: string
  pay_fail_reason?: string
  remark?: string
  created_at: string
  updated_at: string
}

export interface SettleDeductItem {
  id: number
  settle_apply_id: number
  deduct_type: number
  deduct_amount: number
  deduct_branch: number
  related_no?: string
  description?: string
  operator_name?: string
  created_at: string
}

export interface SettleAuditItem {
  id: number
  settle_apply_id: number
  action: number
  status_before: number
  status_after: number
  operator_id?: number
  operator_name: string
  remark?: string
  created_at: string
}

export interface SettleQueryParams extends PageParams {
  period_type?: number
  status_list?: number[]
  merchant_type?: number
  date_range?: string[]
  sort_field?: string
  sort_order?: 'asc' | 'desc'
  keyword?: string
  start_date?: string
  end_date?: string
}

export interface SettleApplyPayload {
  merchant_id: number
  period_type: number
  period_start: string
  period_end: string
  bank_account_name: string
  bank_account_no: string
  bank_name: string
  bank_branch: string
  remark?: string
}

export interface SettleAuditPayload {
  settle_apply_ids: number[]
  action: number
  reject_reason?: string
  remark?: string
}

export const validateShopStatus = (params: { merchant_id: number }) =>
  request.post<ApiResponse<{ valid: boolean; message?: string; shop_status?: number }>>('/merchantSettle/validate/shopStatus', params)

export const validateBankCard = (params: { merchant_id: number; bank_account_no: string; bank_name: string }) =>
  request.post<ApiResponse<{ valid: boolean; message?: string; verify_status?: number; suggestions?: string[] }>>('/merchantSettle/validate/bankCard', params)

export const validateAftersale = (params: { merchant_id: number; period_start: string; period_end: string }) =>
  request.post<ApiResponse<{ valid: boolean; message?: string; unfinished_count?: number; unfinished_list?: Array<{ id: number; aftersale_no: string; amount: number; status: number }> }>>('/merchantSettle/validate/aftersale', params)

export const validateOrderAge = (params: { merchant_id: number; period_start: string; period_end: string }) =>
  request.post<ApiResponse<{ valid: boolean; message?: string; immature_count?: number; immature_days?: number }>>('/merchantSettle/validate/orderAge', params)

export const validatePeriod = (params: { merchant_id: number; period_type: number; period_start: string; period_end: string }) =>
  request.post<ApiResponse<{ valid: boolean; message?: string; duplicate_apply?: boolean; overlap_period?: boolean }>>('/merchantSettle/validate/period', params)

export const validateSettleAll = (payload: Record<string, unknown>) =>
  request.post<ApiResponse<{ valid: boolean; errors: Array<{ field: string; message: string; code?: string }>; warnings: Array<{ field: string; message: string; level?: string }> }>>('/merchantSettle/validate/all', payload)

export const calcSettleAmount = (params: { merchant_id: number; period_type: number; period_start: string; period_end: string }) =>
  request.post<ApiResponse<{
    base_amount: number
    platform_fee: number
    platform_fee_rate: number
    aftersale_deduct: number
    violation_fine: number
    deposit_deduct: number
    other_deduct: number
    total_deduct: number
    actual_amount: number
    order_count: number
    details?: {
      fee_details: Array<{ order_no: string; amount: number; fee: number }>
      aftersale_details: Array<{ aftersale_no: string; amount: number }>
      violation_details: Array<{ violation_no: string; amount: number; reason: string }>
    }
  }>>('/merchantSettle/calc/amount', params)

export const changeSettleStatus = (params: { id: number; target_status: number; remark?: string }) =>
  request.post<ApiResponse<{ changed: boolean; message?: string; current_status?: number }>>('/merchantSettle/change/status', params)

export const getSettleList = (params: SettleQueryParams) =>
  request.get<ApiResponse<PageResult<SettleApplyItem>>>('/merchantSettle/list', { params })

export const getSettleDetail = (id: number) =>
  request.get<ApiResponse<SettleApplyItem>>(`/merchantSettle/detail/${id}`)

export const batchApplySettle = (payload: { merchant_ids: number[]; period_type: number; period_start: string; period_end: string }) =>
  request.post<ApiResponse<{ success_count: number; fail_count: number; fail_details: Array<{ merchant_id: number; merchant_name: string; message: string }>; apply_ids: number[] }>>('/merchantSettle/batch/apply', payload)

export const batchAuditSettle = (payload: SettleAuditPayload) =>
  request.post<ApiResponse<{ success_count: number; fail_count: number; fail_details: Array<{ id: number; message: string }> }>>('/merchantSettle/batch/audit', payload)

export const batchExportSettleLedger = (payload: { settle_apply_ids: number[]; export_fields: string[]; sort_field?: string; sort_order?: 'asc' | 'desc' }) =>
  request.post<ApiResponse<{ download_url: string; filename: string; total_count: number }>>('/merchantSettle/batch/exportLedger', payload, { responseType: 'blob' } as any)

export const checkFinancePermission = () =>
  request.get<ApiResponse<{ allowed: boolean; permission_level: number; max_batch_count: number; allowed_operations: string[] }>>('/merchantSettle/check/financePermission')

export const getSettleFullTrace = (id: number) =>
  request.get<ApiResponse<{
    basic: SettleApplyItem
    deduct_details: SettleDeductItem[]
    audit_logs: SettleAuditItem[]
    pay_voucher?: {
      id: number
      bank_serial_no: string
      pay_amount: number
      pay_bank_name: string
      receive_bank_name: string
      voucher_image?: string
      pay_time: string
    }
    related_orders: Array<{
      id: number
      order_no: string
      order_amount: number
      settle_amount: number
      completed_at: string
    }>
    consistency_check: {
      total_items: number
      passed_items: number
      failed_items: number
      pass_rate: number
      results: Array<{
        name: string
        passed: boolean
        message?: string
        expected?: string
        actual?: string
      }>
    }
    timeline: Array<{
      id: number
      timestamp: string
      title: string
      type: 'apply' | 'audit' | 'pay' | 'arrive' | 'deduct' | 'voucher' | 'retry'
      content?: string
      operator?: string
      type_color?: string
    }>
  }>>(`/merchantSettle/trace/full/${id}`)

export const checkSettleConsistency = (id: number) =>
  request.post<ApiResponse<{
    total_items: number
    passed_items: number
    failed_items: number
    pass_rate: number
    results: Array<{ name: string; passed: boolean; message?: string; expected?: string; actual?: string }>
  }>>('/merchantSettle/check/consistency', { id })

export const interceptSettleDuplicate = (params: { merchant_id: number; period_start: string; period_end: string }) =>
  request.post<ApiResponse<{ duplicated: boolean; message?: string; existing_apply?: { id: number; apply_no: string; status: number } }>>('/merchantSettle/intercept/duplicate', params)

export const interceptSettleOver = (params: { merchant_id: number; actual_amount: number }) =>
  request.post<ApiResponse<{ allowed: boolean; message?: string; max_allowed?: number; current_settleable?: number; exceeded_amount?: number }>>('/merchantSettle/intercept/over', params)
