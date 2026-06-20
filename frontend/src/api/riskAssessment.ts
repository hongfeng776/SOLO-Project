import { get, post, put, del } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export enum RiskLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH_MEDIUM = 3,
  HIGH = 4
}

export const RiskLevelOptions = [
  { label: '低风险', value: 1, color: 'success' },
  { label: '中风险', value: 2, color: 'warning' },
  { label: '较高风险', value: 3, color: 'danger' },
  { label: '高风险', value: 4, color: 'danger' }
]

export enum AssessmentType {
  INITIAL = 1,
  REVIEW = 2,
  MANUAL_ADJUST = 3
}

export const AssessmentTypeOptions = [
  { label: '初评', value: 1 },
  { label: '复评', value: 2 },
  { label: '人工调整', value: 3 }
]

export enum AssessmentStatus {
  PENDING = 0,
  ASSESSING = 1,
  COMPLETED = 2,
  REJECTED = 3,
  CANCELLED = 4
}

export const AssessmentStatusOptions = [
  { label: '待评定', value: 0, color: 'info' },
  { label: '评定中', value: 1, color: 'warning' },
  { label: '已完成', value: 2, color: 'success' },
  { label: '已驳回', value: 3, color: 'danger' },
  { label: '已取消', value: 4, color: 'info' }
]

export enum DataSyncStatus {
  NOT_SYNCED = 0,
  SYNCING = 1,
  SYNCED = 2,
  FAILED = 3
}

export const DataSyncStatusOptions = [
  { label: '未同步', value: 0, color: 'info' },
  { label: '同步中', value: 1, color: 'warning' },
  { label: '同步完成', value: 2, color: 'success' },
  { label: '同步失败', value: 3, color: 'danger' }
]

export enum IndicatorCategory {
  CREDIT = 1,
  TRANSACTION = 2,
  DEBT = 3,
  LAWSUIT = 4,
  ACCOUNT_BEHAVIOR = 5
}

export const IndicatorCategoryOptions = [
  { label: '征信类', value: 1 },
  { label: '交易类', value: 2 },
  { label: '负债类', value: 3 },
  { label: '涉诉类', value: 4 },
  { label: '开户行为类', value: 5 }
]

export enum BatchType {
  NEW_CUSTOMER = 1,
  EXISTING_CUSTOMER = 2,
  HIGH_RISK_CUSTOMER = 3,
  CUSTOM = 4
}

export const BatchTypeOptions = [
  { label: '新增客户初评', value: 1 },
  { label: '存量客户复评', value: 2 },
  { label: '高风险客户复评', value: 3 },
  { label: '自定义', value: 4 }
]

export enum BatchStatus {
  PENDING = 0,
  EXECUTING = 1,
  COMPLETED = 2,
  PARTIAL_FAILED = 3,
  FAILED = 4
}

export const BatchStatusOptions = [
  { label: '待执行', value: 0, color: 'info' },
  { label: '执行中', value: 1, color: 'warning' },
  { label: '已完成', value: 2, color: 'success' },
  { label: '部分失败', value: 3, color: 'warning' },
  { label: '执行失败', value: 4, color: 'danger' }
]

export enum ReviewFrequencyStrategy {
  NONE = 0,
  MONTHLY = 1,
  QUARTERLY = 2,
  SEMIANNUAL = 3,
  ANNUAL = 4,
  BY_ACTIVITY = 5,
  BY_RISK_CHANGE = 6
}

export const ReviewFrequencyStrategyOptions = [
  { label: '无', value: 0 },
  { label: '按月', value: 1 },
  { label: '按季', value: 2 },
  { label: '按半年', value: 3 },
  { label: '按年', value: 4 },
  { label: '按活跃度', value: 5 },
  { label: '按风险异动', value: 6 }
]

export interface IndicatorScore {
  indicator_code: string
  indicator_name: string
  category: number
  weight: number
  score: number
  max_score: number
  weighted_score: number
  raw_value: any
  scoring_details: string
}

export interface MultiDimensionalData {
  credit_data: {
    credit_score?: number
    credit_level?: string
    overdue_count?: number
    overdue_amount?: number
    query_count_30d?: number
    data_source?: string
    sync_time?: string
  }
  transaction_data: {
    transaction_count_30d?: number
    transaction_amount_30d?: number
    avg_transaction_amount?: number
    abnormal_transaction_count?: number
    high_frequency_count?: number
    night_transaction_count?: number
    cross_border_count?: number
    sync_time?: string
  }
  debt_data: {
    total_loan_balance?: number
    debt_ratio?: number
    overdue_loan_count?: number
    credit_card_balance?: number
    credit_limit_utilization?: number
    sync_time?: string
  }
  lawsuit_data: {
    lawsuit_count?: number
    pending_lawsuit_count?: number
    executed_count?: number
    dishonest_count?: number
    lawsuit_amount?: number
    sync_time?: string
  }
  account_behavior_data: {
    account_open_days?: number
    login_count_30d?: number
    channel_diversity?: number
    address_change_count?: number
    phone_change_count?: number
    sync_time?: string
  }
}

export interface RiskAssessment {
  id: string
  assessment_no: string
  customer_id: string
  customer_no: string
  customer_name?: string
  assessment_type: number
  assessment_type_text?: string
  risk_level: number
  risk_level_text?: string
  risk_level_color?: string
  risk_tags?: string
  risk_tag_list?: string[]
  total_score: number
  credit_score?: number
  debt_ratio?: number
  lawsuit_count?: number
  transaction_count_30d?: number
  transaction_amount_30d?: number
  account_open_days?: number
  data_sync_status: number
  data_sync_status_text?: string
  data_sync_error?: string
  status: number
  status_text?: string
  batch_id?: string
  batch_no?: string
  operator_id?: string
  operator_name?: string
  org_id?: string
  org_name?: string
  remark?: string
  previous_risk_level?: number
  previous_risk_level_text?: string
  is_illegal_downgrade: number
  block_reason?: string
  assessment_time?: string
  next_review_time?: string
  indicator_scores?: IndicatorScore[]
  multi_dimensional_data?: MultiDimensionalData
  created_at?: string
  updated_at?: string
}

export interface RiskAssessmentQueryParams extends PageParams {
  keyword?: string
  customer_no?: string
  customer_name?: string
  risk_level?: number
  assessment_type?: number
  status?: number
  org_id?: string
  start_time?: string
  end_time?: string
  batch_id?: string
  data_sync_status?: number
  is_illegal_downgrade?: number
}

export interface RiskAssessmentBatch {
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
  review_frequency_strategy: number
  review_frequency_strategy_text?: string
  creator_id?: string
  creator_name?: string
  org_id?: string
  org_name?: string
  execute_start_time?: string
  execute_end_time?: string
  execute_log?: string
  remark?: string
  created_at?: string
  updated_at?: string
}

export interface RiskAssessmentBatchQueryParams extends PageParams {
  keyword?: string
  batch_type?: number
  status?: number
  org_id?: string
  start_time?: string
  end_time?: string
}

export interface RiskIndicator {
  id: string
  indicator_code: string
  indicator_name: string
  category: number
  category_text?: string
  weight: number
  max_score: number
  scoring_rule?: any
  is_required: number
  status: number
  sort_order: number
  description?: string
  created_at?: string
  updated_at?: string
}

export interface RiskIndicatorQueryParams extends PageParams {
  keyword?: string
  category?: number
  status?: number
  indicator_code?: string
}

export interface CreateRiskAssessmentRequest {
  customer_id: string
  assessment_type: number
  remark?: string
  manual_risk_level?: number
  manual_risk_tags?: string[]
}

export interface ReviewRiskAssessmentRequest {
  risk_level: number
  risk_tags?: string[]
  remark?: string
}

export interface BatchRiskAssessmentRequest {
  batch_name: string
  batch_type: number
  customer_ids?: string[]
  filter_condition?: any
  review_frequency_strategy?: number
  remark?: string
}

export interface CreateRiskIndicatorRequest {
  indicator_code: string
  indicator_name: string
  category: number
  weight: number
  max_score?: number
  scoring_rule?: any
  is_required?: number
  status?: number
  sort_order?: number
  description?: string
}

export interface UpdateRiskIndicatorRequest {
  indicator_name?: string
  category?: number
  weight?: number
  max_score?: number
  scoring_rule?: any
  is_required?: number
  status?: number
  sort_order?: number
  description?: string
}

export interface DataSyncCheckResult {
  can_assess: boolean
  missing_data_types: string[]
  syncing_data_types: string[]
  error_message?: string
}

export interface WeightValidationResult {
  is_valid: boolean
  total_weight: number
  invalid_indicators: string[]
  error_message?: string
}

export interface IllegalDowngradeCheckResult {
  is_illegal: boolean
  block_reason?: string
  current_risk_level?: number
  requested_risk_level?: number
  high_risk_reasons?: string[]
}

export interface TraceRecord {
  id: string
  assessment_no: string
  assessment_type: number
  assessment_type_text: string
  risk_level: number
  risk_level_text: string
  risk_tags: string[]
  total_score: number
  indicator_scores: IndicatorScore[]
  operator_id?: string
  operator_name?: string
  assessment_time?: string
  remark?: string
  is_illegal_downgrade: number
  block_reason?: string
}

export function getRiskConfigApi() {
  return get('/business/risk/config')
}

export function checkDataSyncApi(customerId: string) {
  return get<DataSyncCheckResult>(`/business/risk/assessment/data-sync/${customerId}`)
}

export function getMultiDimensionalDataApi(customerId: string) {
  return get<MultiDimensionalData>(`/business/risk/assessment/multi-data/${customerId}`)
}

export function validateWeightsApi() {
  return get<WeightValidationResult>('/business/risk/assessment/validate-weights')
}

export function checkIllegalDowngradeApi(customerId: string, data: {
  requested_risk_level: number
  current_risk_level?: number
}) {
  return post<IllegalDowngradeCheckResult>(`/business/risk/assessment/check-illegal-downgrade/${customerId}`, data)
}

export function getRiskAssessmentListApi(params: RiskAssessmentQueryParams) {
  return get<PageResult<RiskAssessment>>('/business/risk/assessment/list', params)
}

export function getRiskAssessmentDetailApi(id: string) {
  return get<RiskAssessment>(`/business/risk/assessment/${id}`)
}

export function createRiskAssessmentApi(data: CreateRiskAssessmentRequest) {
  return post<RiskAssessment>('/business/risk/assessment', data)
}

export function reviewRiskAssessmentApi(id: string, data: ReviewRiskAssessmentRequest) {
  return post<RiskAssessment>(`/business/risk/assessment/${id}/review`, data)
}

export function getCustomerRiskTraceApi(customerId: string) {
  return get<TraceRecord[]>(`/business/risk/assessment/trace/${customerId}`)
}

export function getBatchAssessmentListApi(params: RiskAssessmentBatchQueryParams) {
  return get<PageResult<RiskAssessmentBatch>>('/business/risk/batch/list', params)
}

export function getBatchAssessmentDetailApi(id: string) {
  return get<RiskAssessmentBatch>(`/business/risk/batch/${id}`)
}

export function createBatchAssessmentApi(data: BatchRiskAssessmentRequest) {
  return post<RiskAssessmentBatch>('/business/risk/batch', data)
}

export function getRiskIndicatorListApi(params: RiskIndicatorQueryParams) {
  return get<PageResult<RiskIndicator>>('/business/risk/indicator/list', params)
}

export function getRiskIndicatorDetailApi(id: string) {
  return get<RiskIndicator>(`/business/risk/indicator/${id}`)
}

export function createRiskIndicatorApi(data: CreateRiskIndicatorRequest) {
  return post<RiskIndicator>('/business/risk/indicator', data)
}

export function updateRiskIndicatorApi(id: string, data: UpdateRiskIndicatorRequest) {
  return put<RiskIndicator>(`/business/risk/indicator/${id}`, data)
}

export function deleteRiskIndicatorApi(id: string) {
  return del<void>(`/business/risk/indicator/${id}`)
}
