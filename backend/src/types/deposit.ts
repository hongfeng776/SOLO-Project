import { BaseEntity, PaginationParams } from './common';

export type DepositType = 1 | 2 | 3;
export type DepositStatus = 0 | 1 | 2 | 3 | 4 | 5;
export type DepositTerm = 0 | 30 | 90 | 180 | 365 | 730 | 1095 | 1825;
export type InterestCalculationMethod = 1 | 2 | 3 | 4;

export const DepositTypeText: Record<number, string> = {
  1: '普通存款',
  2: '大额存单',
  3: '智能存款'
};

export const DepositStatusText: Record<number, string> = {
  0: '待确认',
  1: '处理中',
  2: '已入账',
  3: '已撤销',
  4: '已到期',
  5: '已支取'
};

export const DepositTermText: Record<number, string> = {
  0: '活期',
  30: '1个月',
  90: '3个月',
  180: '6个月',
  365: '1年',
  730: '2年',
  1095: '3年',
  1825: '5年'
};

export const InterestMethodText: Record<number, string> = {
  1: '按季结息',
  2: '按年结息',
  3: '到期一次性还本付息',
  4: '按月结息'
};

export interface DepositProductConfig {
  min_amount: number;
  max_amount: number;
  single_limit: number;
  daily_limit: number;
  interest_rate: number;
  available_terms: DepositTerm[];
  interest_method: InterestCalculationMethod;
  allow_early_withdraw: boolean;
  early_withdraw_penalty_rate: number;
}

export interface DepositPreCheckRequest {
  account_no: string;
  customer_no?: string;
  deposit_type: DepositType;
  product_id?: string;
  amount: number;
  term?: DepositTerm;
}

export interface DepositPreCheckResult {
  passed: boolean;
  blocked: boolean;
  block_reason?: string;
  warnings: string[];
  account_status: number;
  account_status_text: string;
  customer_risk_level: number;
  customer_risk_level_text: string;
  is_frozen: boolean;
  is_lost: boolean;
  single_limit: number;
  daily_limit: number;
  daily_used_amount: number;
  daily_remaining_amount: number;
  amount_valid: boolean;
  amount_validation_message?: string;
  product_config?: DepositProductConfig;
  calculated_interest?: number;
  maturity_date?: string;
}

export interface CreateDepositRequest {
  account_no: string;
  customer_no?: string;
  deposit_type: DepositType;
  product_id?: string;
  amount: number;
  currency?: string;
  term?: DepositTerm;
  interest_method?: InterestCalculationMethod;
  channel_code?: string;
  channel_terminal?: string;
  remark?: string;
  request_id?: string;
}

export interface DepositUpdateRequest {
  remark?: string;
}

export interface DepositQueryParams extends PaginationParams {
  keyword?: string;
  deposit_no?: string;
  account_no?: string;
  customer_no?: string;
  deposit_type?: DepositType;
  product_id?: string;
  status?: DepositStatus;
  org_id?: string;
  operator_id?: string;
  start_time?: string;
  end_time?: string;
  min_amount?: number;
  max_amount?: number;
  term?: DepositTerm;
}

export interface Deposit extends BaseEntity {
  deposit_no: string;
  account_no: string;
  account_id: string;
  customer_id?: string;
  customer_no?: string;
  deposit_type: DepositType;
  product_id?: string;
  amount: number;
  currency: string;
  term?: DepositTerm;
  interest_rate: number;
  interest_method?: InterestCalculationMethod;
  calculated_interest?: number;
  actual_interest?: number;
  maturity_date?: Date;
  value_date: Date;
  channel_code?: string;
  channel_terminal?: string;
  org_id?: string;
  operator_id?: string;
  status: DepositStatus;
  remark?: string;
  original_balance?: number;
  new_balance?: number;
  request_id?: string;
  related_transaction_no?: string;
}

export interface DepositVO extends Deposit {
  deposit_type_text?: string;
  status_text?: string;
  term_text?: string;
  interest_method_text?: string;
  product_name?: string;
  customer_name?: string;
  org_name?: string;
  operator_name?: string;
  amount_formatted?: string;
  interest_formatted?: string;
  customer_risk_level?: number;
  account_status?: number;
  account_status_text?: string;
  amount_valid?: boolean;
  amount_validation_message?: string;
}

export interface BatchDepositItem {
  index?: number;
  account_no: string;
  customer_no?: string;
  deposit_type: DepositType;
  product_id?: string;
  amount: number;
  term?: DepositTerm;
  remark?: string;
}

export interface BatchDepositRequest {
  items: BatchDepositItem[];
  channel_code?: string;
  channel_terminal?: string;
}

export interface BatchDepositResultItem {
  index: number;
  success: boolean;
  deposit_id?: string;
  deposit_no?: string;
  error?: string;
  warning?: string;
  need_review?: boolean;
  pre_check_result?: DepositPreCheckResult;
}

export interface BatchDepositReviewRequest {
  ids: string[];
  operation: 'approve' | 'reject';
  remark?: string;
}

export interface DepositTraceRequest {
  account_no?: string;
  deposit_no?: string;
  customer_no?: string;
  start_time?: string;
  end_time?: string;
}

export interface DepositTraceDuplicateItem {
  deposit_no: string;
  amount: number;
  create_time: string;
  time_diff_minutes: number;
}

export interface DepositTraceAnomalyItem {
  deposit_no: string;
  amount: number;
  average_amount: number;
  deviation_percent: number;
}

export interface DepositTraceMismatchItem {
  deposit_no: string;
  deposit_type: number;
  term: number;
  applied_rate: number;
  expected_rate: number;
  diff: number;
}

export interface DepositTraceResult {
  query_params: DepositTraceRequest;
  total_count: number;
  total_amount: number;
  records: DepositVO[];
  duplicate_check: {
    has_duplicate: boolean;
    duplicates: DepositTraceDuplicateItem[];
  };
  amount_anomaly_check: {
    has_anomaly: boolean;
    anomalies: DepositTraceAnomalyItem[];
  };
  rate_match_check: {
    has_mismatch: boolean;
    mismatches: DepositTraceMismatchItem[];
  };
  validation_passed: boolean;
  risk_prompts: string[];
}

export interface DepositLimitConfig {
  account_type: number;
  single_limit: number;
  daily_limit: number;
}

export const DEPOSIT_LIMIT_CONFIG: Record<number, DepositLimitConfig> = {
  1: { account_type: 1, single_limit: 500000, daily_limit: 5000000 },
  2: { account_type: 2, single_limit: 50000, daily_limit: 100000 },
  3: { account_type: 3, single_limit: 10000, daily_limit: 20000 }
};

export const LARGE_DEPOSIT_THRESHOLD = 200000;
export const BATCH_SMALL_AMOUNT_THRESHOLD = 50000;
