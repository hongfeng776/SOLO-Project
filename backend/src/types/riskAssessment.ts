export enum RiskLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH_MEDIUM = 3,
  HIGH = 4
}

export const RiskLevelText: Record<number, string> = {
  1: '低风险',
  2: '中风险',
  3: '较高风险',
  4: '高风险'
};

export const RiskLevelColor: Record<number, string> = {
  1: 'success',
  2: 'warning',
  3: 'danger',
  4: 'danger'
};

export enum AssessmentType {
  INITIAL = 1,
  REVIEW = 2,
  MANUAL_ADJUST = 3
}

export const AssessmentTypeText: Record<number, string> = {
  1: '初评',
  2: '复评',
  3: '人工调整'
};

export enum AssessmentStatus {
  PENDING = 0,
  ASSESSING = 1,
  COMPLETED = 2,
  REJECTED = 3,
  CANCELLED = 4
}

export const AssessmentStatusText: Record<number, string> = {
  0: '待评定',
  1: '评定中',
  2: '已完成',
  3: '已驳回',
  4: '已取消'
};

export enum DataSyncStatus {
  NOT_SYNCED = 0,
  SYNCING = 1,
  SYNCED = 2,
  FAILED = 3
}

export const DataSyncStatusText: Record<number, string> = {
  0: '未同步',
  1: '同步中',
  2: '同步完成',
  3: '同步失败'
};

export enum IndicatorCategory {
  CREDIT = 1,
  TRANSACTION = 2,
  DEBT = 3,
  LAWSUIT = 4,
  ACCOUNT_BEHAVIOR = 5
}

export const IndicatorCategoryText: Record<number, string> = {
  1: '征信类',
  2: '交易类',
  3: '负债类',
  4: '涉诉类',
  5: '开户行为类'
};

export enum BatchType {
  NEW_CUSTOMER = 1,
  EXISTING_CUSTOMER = 2,
  HIGH_RISK_CUSTOMER = 3,
  CUSTOM = 4
}

export const BatchTypeText: Record<number, string> = {
  1: '新增客户初评',
  2: '存量客户复评',
  3: '高风险客户复评',
  4: '自定义'
};

export enum BatchStatus {
  PENDING = 0,
  EXECUTING = 1,
  COMPLETED = 2,
  PARTIAL_FAILED = 3,
  FAILED = 4
}

export const BatchStatusText: Record<number, string> = {
  0: '待执行',
  1: '执行中',
  2: '已完成',
  3: '部分失败',
  4: '执行失败'
};

export enum ReviewFrequencyStrategy {
  NONE = 0,
  MONTHLY = 1,
  QUARTERLY = 2,
  SEMIANNUAL = 3,
  ANNUAL = 4,
  BY_ACTIVITY = 5,
  BY_RISK_CHANGE = 6
}

export const ReviewFrequencyStrategyText: Record<number, string> = {
  0: '无',
  1: '按月',
  2: '按季',
  3: '按半年',
  4: '按年',
  5: '按活跃度',
  6: '按风险异动'
};

export interface IndicatorScore {
  indicator_code: string;
  indicator_name: string;
  category: number;
  weight: number;
  score: number;
  max_score: number;
  weighted_score: number;
  raw_value: any;
  scoring_details: string;
}

export interface MultiDimensionalData {
  credit_data: {
    credit_score?: number;
    credit_level?: string;
    overdue_count?: number;
    overdue_amount?: number;
    query_count_30d?: number;
    data_source?: string;
    sync_time?: Date;
  };
  transaction_data: {
    transaction_count_30d?: number;
    transaction_amount_30d?: number;
    avg_transaction_amount?: number;
    abnormal_transaction_count?: number;
    high_frequency_count?: number;
    night_transaction_count?: number;
    cross_border_count?: number;
    sync_time?: Date;
  };
  debt_data: {
    total_loan_balance?: number;
    debt_ratio?: number;
    overdue_loan_count?: number;
    credit_card_balance?: number;
    credit_limit_utilization?: number;
    sync_time?: Date;
  };
  lawsuit_data: {
    lawsuit_count?: number;
    pending_lawsuit_count?: number;
    executed_count?: number;
    dishonest_count?: number;
    lawsuit_amount?: number;
    sync_time?: Date;
  };
  account_behavior_data: {
    account_open_days?: number;
    login_count_30d?: number;
    channel_diversity?: number;
    address_change_count?: number;
    phone_change_count?: number;
    sync_time?: Date;
  };
}

export interface RiskAssessmentQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  customer_no?: string;
  customer_name?: string;
  risk_level?: number;
  assessment_type?: number;
  status?: number;
  org_id?: string;
  start_time?: string;
  end_time?: string;
  batch_id?: string;
  data_sync_status?: number;
  is_illegal_downgrade?: number;
}

export interface RiskAssessmentBatchQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  batch_type?: number;
  status?: number;
  org_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface RiskIndicatorQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  category?: number;
  status?: number;
  indicator_code?: string;
}

export interface CreateRiskAssessmentRequest {
  customer_id: string;
  assessment_type: number;
  remark?: string;
  manual_risk_level?: number;
  manual_risk_tags?: string[];
}

export interface ReviewRiskAssessmentRequest {
  id: string;
  risk_level: number;
  risk_tags?: string[];
  remark?: string;
}

export interface BatchRiskAssessmentRequest {
  batch_name: string;
  batch_type: number;
  customer_ids?: string[];
  filter_condition?: any;
  review_frequency_strategy?: number;
  remark?: string;
}

export interface CreateRiskIndicatorRequest {
  indicator_code: string;
  indicator_name: string;
  category: number;
  weight: number;
  max_score?: number;
  scoring_rule?: any;
  is_required?: number;
  status?: number;
  sort_order?: number;
  description?: string;
}

export interface UpdateRiskIndicatorRequest {
  indicator_name?: string;
  category?: number;
  weight?: number;
  max_score?: number;
  scoring_rule?: any;
  is_required?: number;
  status?: number;
  sort_order?: number;
  description?: string;
}

export interface RiskAssessmentVO {
  id: string;
  assessment_no: string;
  customer_id: string;
  customer_no: string;
  customer_name?: string;
  assessment_type: number;
  assessment_type_text?: string;
  risk_level: number;
  risk_level_text?: string;
  risk_level_color?: string;
  risk_tags?: string;
  risk_tag_list?: string[];
  total_score: number;
  credit_score?: number;
  debt_ratio?: number;
  lawsuit_count?: number;
  transaction_count_30d?: number;
  transaction_amount_30d?: number;
  account_open_days?: number;
  data_sync_status: number;
  data_sync_status_text?: string;
  data_sync_error?: string;
  status: number;
  status_text?: string;
  batch_id?: string;
  batch_no?: string;
  operator_id?: string;
  operator_name?: string;
  org_id?: string;
  org_name?: string;
  remark?: string;
  previous_risk_level?: number;
  previous_risk_level_text?: string;
  is_illegal_downgrade: number;
  block_reason?: string;
  assessment_time?: Date;
  next_review_time?: Date;
  indicator_scores?: IndicatorScore[];
  multi_dimensional_data?: MultiDimensionalData;
  created_at?: Date;
  updated_at?: Date;
}

export interface RiskAssessmentBatchVO {
  id: string;
  batch_no: string;
  batch_name: string;
  batch_type: number;
  batch_type_text?: string;
  status: number;
  status_text?: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  progress?: number;
  filter_condition?: any;
  review_frequency_strategy: number;
  review_frequency_strategy_text?: string;
  creator_id?: string;
  creator_name?: string;
  org_id?: string;
  org_name?: string;
  execute_start_time?: Date;
  execute_end_time?: Date;
  execute_log?: string;
  remark?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface RiskIndicatorVO {
  id: string;
  indicator_code: string;
  indicator_name: string;
  category: number;
  category_text?: string;
  weight: number;
  max_score: number;
  scoring_rule?: any;
  is_required: number;
  status: number;
  sort_order: number;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface DataSyncCheckResult {
  can_assess: boolean;
  missing_data_types: string[];
  syncing_data_types: string[];
  error_message?: string;
}

export interface WeightValidationResult {
  is_valid: boolean;
  total_weight: number;
  invalid_indicators: string[];
  error_message?: string;
}

export interface IndicatorMissingCheckResult {
  is_complete: boolean;
  missing_indicators: string[];
  error_message?: string;
}

export interface RiskScoreResult {
  total_score: number;
  risk_level: number;
  risk_level_text: string;
  risk_tags: string[];
  indicator_scores: IndicatorScore[];
}

export interface IllegalDowngradeCheckResult {
  is_illegal: boolean;
  block_reason?: string;
  current_risk_level?: number;
  requested_risk_level?: number;
  high_risk_reasons?: string[];
}

export interface BusinessPermissionUpdateResult {
  success: boolean;
  updated_modules: string[];
  previous_permissions: any;
  new_permissions: any;
}

export interface TraceRecord {
  id: string;
  assessment_no: string;
  assessment_type: number;
  assessment_type_text: string;
  risk_level: number;
  risk_level_text: string;
  risk_tags: string[];
  total_score: number;
  indicator_scores: IndicatorScore[];
  operator_id?: string;
  operator_name?: string;
  assessment_time?: Date;
  remark?: string;
  is_illegal_downgrade: number;
  block_reason?: string;
}
