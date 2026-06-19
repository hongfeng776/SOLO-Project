import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'

export enum BusinessStatPeriod {
  DAY = 1,
  WEEK = 2,
  MONTH = 3,
  QUARTER = 4,
  YEAR = 5,
}

export enum BusinessDataStatus {
  NORMAL = 1,
  CORRECTED = 2,
  ABNORMAL = 3,
  CALIBRATED = 4,
}

export enum RiskLevel {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

export enum BusinessQualityLevel {
  UNRATED = 0,
  EXCELLENT = 1,
  NORMAL = 2,
  POOR = 3,
}

export enum AbnormalType {
  SURGE = 1,
  PLUNGE = 2,
  DUPLICATE = 3,
  LOGIC_CONFLICT = 4,
}

export enum AbnormalCheckStatus {
  PENDING = 1,
  CALIBRATED = 2,
  IGNORED = 3,
  MARKED_RISK = 4,
}

export const STAT_PERIOD_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '日', value: 1 },
  { label: '周', value: 2 },
  { label: '月', value: 3 },
  { label: '季', value: 4 },
  { label: '年', value: 5 },
]

export const DATA_STATUS_OPTIONS: Array<{ label: string; value: number; color: string; type: 'success' | 'warning' | 'danger' | 'info' | 'primary' }> = [
  { label: '正常', value: 1, color: '#67C23A', type: 'success' },
  { label: '已修正', value: 2, color: '#409EFF', type: 'primary' },
  { label: '异常', value: 3, color: '#F56C6C', type: 'danger' },
  { label: '已校准', value: 4, color: '#909399', type: 'info' },
]

export const RISK_LEVEL_OPTIONS: Array<{ label: string; value: number; color: string; type: 'success' | 'warning' | 'danger' | 'info' }> = [
  { label: '无风险', value: 0, color: '#67C23A', type: 'success' },
  { label: '低风险', value: 1, color: '#909399', type: 'info' },
  { label: '中风险', value: 2, color: '#E6A23C', type: 'warning' },
  { label: '高风险', value: 3, color: '#F56C6C', type: 'danger' },
]

export const QUALITY_LEVEL_OPTIONS: Array<{ label: string; value: number; color: string; type: 'success' | 'warning' | 'danger' | 'info' }> = [
  { label: '未评定', value: 0, color: '#909399', type: 'info' },
  { label: '优质', value: 1, color: '#67C23A', type: 'success' },
  { label: '普通', value: 2, color: '#E6A23C', type: 'warning' },
  { label: '劣质', value: 3, color: '#F56C6C', type: 'danger' },
]

export const ABNORMAL_TYPE_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '突增', value: 1 },
  { label: '突降', value: 2 },
  { label: '重复统计', value: 3 },
  { label: '逻辑矛盾', value: 4 },
]

export const ABNORMAL_CHECK_STATUS_OPTIONS: Array<{ label: string; value: number; type: 'warning' | 'success' | 'info' | 'danger' }> = [
  { label: '待处理', value: 1, type: 'warning' },
  { label: '已校准', value: 2, type: 'success' },
  { label: '已忽略', value: 3, type: 'info' },
  { label: '标记风险', value: 4, type: 'danger' },
]

export const BUSINESS_FIELD_OPTIONS: Array<{ label: string; value: string; unit?: string }> = [
  { label: '订单数', value: 'order_count', unit: '单' },
  { label: '有效订单数', value: 'valid_order_count', unit: '单' },
  { label: '销售额', value: 'sales_amount', unit: '元' },
  { label: '有效销售额', value: 'valid_sales_amount', unit: '元' },
  { label: '已结算金额', value: 'settled_amount', unit: '元' },
  { label: '待结算金额', value: 'pending_settlement_amount', unit: '元' },
  { label: '退款金额', value: 'refund_amount', unit: '元' },
  { label: '客单价', value: 'avg_order_amount', unit: '元' },
  { label: '新客订单数', value: 'new_customer_order_count', unit: '单' },
  { label: '复购订单数', value: 'repeat_order_count', unit: '单' },
  { label: '好评数', value: 'positive_review_count', unit: '条' },
  { label: '差评数', value: 'negative_review_count', unit: '条' },
  { label: '总评价数', value: 'total_review_count', unit: '条' },
  { label: '好评率', value: 'positive_review_rate', unit: '%' },
]

export interface BusinessDataItem {
  id: number
  merchant_id: number
  merchant_name: string
  shop_name: string
  shop_logo?: string
  shop_category?: string
  shop_level?: number
  stat_period_type: number
  stat_period_text: string
  stat_start_date: string
  stat_end_date: string
  order_count: number
  valid_order_count: number
  sales_amount: number
  valid_sales_amount: number
  settled_amount: number
  pending_settlement_amount: number
  refund_amount: number
  avg_order_amount: number
  new_customer_order_count: number
  repeat_order_count: number
  positive_review_count: number
  negative_review_count: number
  total_review_count: number
  positive_review_rate: number
  data_status: number
  risk_level: number
  quality_level: number
  abnormal_flag: boolean
  abnormal_count: number
  created_at: string
  updated_at: string
}

export interface BusinessCorrectItem {
  id: number
  business_data_id: number
  field_name: string
  field_label: string
  value_before: number | string
  value_after: number | string
  diff_value: number | string
  diff_percent: number
  consistency_check: boolean
  consistency_warning?: string
  operator_id?: number
  operator_name?: string
  operated_at: string
  remark?: string
}

export interface BusinessAbnormalItem {
  id: number
  business_data_id: number
  field_name: string
  field_label: string
  current_value: number
  historical_avg: number
  deviation_percent: number
  abnormal_type: number
  check_status: number
  detected_at: string
  handled_at?: string
  handler_name?: string
  handle_remark?: string
}

export interface BusinessQueryParams extends PageParams {
  stat_period_type?: number
  start_date?: string
  end_date?: string
  data_status_list?: number[]
  risk_level_list?: number[]
  shop_category?: string
  shop_level?: number
  sales_amount_min?: number
  sales_amount_max?: number
  sort_field?: string
  sort_order?: 'asc' | 'desc'
  keyword?: string
}

export interface BusinessCorrectPayload {
  business_data_id: number
  corrections: Array<{
    field_name: string
    value_after: number | string
    remark?: string
  }>
  operator_id?: number
}

export interface BusinessBatchPayload {
  business_data_ids: number[]
  target_quality_level?: number
  export_fields?: string[]
  sort_field?: string
  sort_order?: 'asc' | 'desc'
  remark?: string
}

export const validateBusinessOrder = (params: { merchant_id: number; stat_start_date: string; stat_end_date: string; order_count: number }) =>
  request.post<ApiResponse<{ valid: boolean; message?: string; suggestions?: string[] }>>('/merchantBusiness/validate/order', params)

export const validateBusinessSettlement = (params: { merchant_id: number; stat_start_date: string; stat_end_date: string; sales_amount: number; settled_amount: number }) =>
  request.post<ApiResponse<{ valid: boolean; message?: string; suggestions?: string[] }>>('/merchantBusiness/validate/settlement', params)

export const validateBusinessReview = (params: { merchant_id: number; stat_start_date: string; stat_end_date: string; positive_review_count: number; total_review_count: number }) =>
  request.post<ApiResponse<{ valid: boolean; message?: string; suggestions?: string[] }>>('/merchantBusiness/validate/review', params)

export const validateBusinessPeriod = (params: { merchant_id: number; stat_period_type: number; stat_start_date: string; stat_end_date: string }) =>
  request.post<ApiResponse<{ valid: boolean; message?: string; period_conflict?: boolean }>>('/merchantBusiness/validate/period', params)

export const validateBusinessAll = (payload: Record<string, unknown>) =>
  request.post<ApiResponse<{ valid: boolean; errors: Array<{ field: string; message: string; code?: string }>; warnings: Array<{ field: string; message: string; level?: string }> }>>('/merchantBusiness/validate/all', payload)

export const getBusinessList = (params: BusinessQueryParams) =>
  request.get<ApiResponse<PageResult<BusinessDataItem>>>('/merchantBusiness/list', { params })

export const getBusinessDetail = (id: number) =>
  request.get<ApiResponse<BusinessDataItem>>(`/merchantBusiness/detail/${id}`)

export const getCorrectLogs = (business_data_id: number) =>
  request.get<ApiResponse<BusinessCorrectItem[]>>(`/merchantBusiness/correctLogs/${business_data_id}`)

export const getAbnormalLogs = (business_data_id: number) =>
  request.get<ApiResponse<BusinessAbnormalItem[]>>(`/merchantBusiness/abnormalLogs/${business_data_id}`)

export const autoCalculateBusiness = (params: { merchant_id: number; stat_period_type: number; stat_start_date: string; stat_end_date: string }) =>
  request.post<ApiResponse<{ calculated: boolean; data?: Partial<BusinessDataItem>; warnings?: string[] }>>('/merchantBusiness/autoCalculate', params)

export const manualCreateBusiness = (payload: Record<string, unknown>) =>
  request.post<ApiResponse<{ id: number; created: boolean; message?: string }>>('/merchantBusiness/manualCreate', payload)

export const correctBusiness = (payload: BusinessCorrectPayload) =>
  request.post<ApiResponse<{ corrected: boolean; message?: string; consistency_warnings?: string[] }>>('/merchantBusiness/correct', payload)

export const recalcLevel = (business_data_id: number) =>
  request.post<ApiResponse<{ recalculated: boolean; new_quality_level?: number; new_risk_level?: number }>>('/merchantBusiness/recalcLevel', business_data_id)

export const batchExportBusiness = (payload: BusinessBatchPayload) =>
  request.post<ApiResponse<{ download_url: string; filename: string; total_count: number }>>('/merchantBusiness/batch/export', payload, { responseType: 'blob' } as any)

export const batchCalibrateBusiness = (payload: BusinessBatchPayload) =>
  request.post<ApiResponse<{ success_count: number; fail_count: number; fail_details: Array<{ id: number; message: string }> }>>('/merchantBusiness/batch/calibrate', payload)

export const batchMarkQuality = (payload: BusinessBatchPayload) =>
  request.post<ApiResponse<{ success_count: number; fail_count: number; fail_details: Array<{ id: number; message: string }> }>>('/merchantBusiness/batch/markQuality', payload)

export const getBusinessBatchScope = (permission_level = 1) =>
  request.get<ApiResponse<{ max_count: number; allowed_statuses: number[]; allowed_operations: string[] }>>('/merchantBusiness/batch/scope', { params: { permission_level } })

export const getBusinessFullTrace = (id: number) =>
  request.get<ApiResponse<{
    basic: BusinessDataItem
    correct_logs: BusinessCorrectItem[]
    level_records: Array<{
      id: number
      old_level: number
      new_level: number
      rank_change: number
      estimated_settlement_change: number
      reason: string
      operator_name?: string
      operated_at: string
    }>
    abnormal_records: BusinessAbnormalItem[]
    order_details: Array<{
      id: number
      order_no: string
      amount: number
      status: number
      completed_at: string
    }>
    settlement_records: Array<{
      id: number
      settlement_no: string
      amount: number
      status: number
      settled_at: string
    }>
    timeline: Array<{
      id: number
      timestamp: string
      title: string
      type: 'create' | 'correct' | 'level' | 'abnormal' | 'order_complete'
      content?: string
      operator?: string
      type_color?: string
    }>
    accuracy_check: {
      score: number
      passed: boolean
      issues: Array<{ field: string; message: string; level: string }>
    }
  }>>(`/merchantBusiness/trace/full/${id}`)

export const checkBusinessAccuracy = (id: number) =>
  request.post<ApiResponse<{ score: number; passed: boolean; issues: Array<{ field: string; message: string; level: string }> }>>('/merchantBusiness/check/accuracy', { id })

export const getBusinessOrderDetails = (id: number) =>
  request.get<ApiResponse<Array<{
    id: number
    order_no: string
    amount: number
    status: number
    completed_at: string
  }>>>(`/merchantBusiness/orderDetails/${id}`)

export const getBusinessSettlementRecords = (id: number) =>
  request.get<ApiResponse<Array<{
    id: number
    settlement_no: string
    amount: number
    status: number
    settled_at: string
  }>>>(`/merchantBusiness/settlementRecords/${id}`)
