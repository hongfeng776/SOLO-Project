import { BaseEntity, PaginationParams } from './common';

export type TransferType = 1 | 2 | 3 | 4;
export type TransferMode = 1 | 2 | 3;
export type SettlementStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type AuditStatus = 0 | 1 | 2 | 3 | 10 | 11;
export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type BatchType = 1 | 2 | 3 | 4;

export const TransferTypeText: Record<number, string> = {
  1: '同行转账',
  2: '跨行转账',
  3: '对公转账',
  4: '对私转账'
};

export const TransferModeText: Record<number, string> = {
  1: '普通转账',
  2: '加急转账',
  3: '实时转账'
};

export const SettlementStatusText: Record<number, string> = {
  0: '待提交',
  1: '待复核',
  2: '处理中',
  3: '已结算',
  4: '已撤销',
  5: '已失败',
  6: '已退回'
};

export const BatchTypeText: Record<number, string> = {
  1: '网点对公批量转账',
  2: '代发工资',
  3: '代发报销',
  4: '其他批量'
};

export const BatchStatusText: Record<number, string> = {
  0: '待提交',
  1: '待复核',
  2: '处理中',
  3: '部分完成',
  4: '全部完成',
  5: '已撤销',
  6: '已失败'
};

export const SettlementStatusColor: Record<number, string> = {
  0: 'info',
  1: 'warning',
  2: 'primary',
  3: 'success',
  4: 'info',
  5: 'danger',
  6: 'warning'
};

export interface FeeConfig {
  min_fee: number;
  max_fee: number;
  rate: number;
  fixed_amount?: number;
}

export interface SettlementConfig {
  transfer_types: Array<{ value: TransferType; label: string }>;
  transfer_modes: Array<{ value: TransferMode; label: string }>;
  settlement_statuses: Array<{ value: SettlementStatus; label: string; type?: string }>;
  batch_types: Array<{ value: BatchType; label: string }>;
  fee_config: Record<TransferType, Record<TransferMode, FeeConfig>>;
  arrival_time_config: Record<TransferType, Record<TransferMode, string>>;
  review_rules: {
    single_auto_review_threshold: number;
    batch_small_amount_threshold: number;
    batch_large_amount_threshold: number;
    single_level_review_threshold: number;
    multi_level_review_threshold: number;
  };
  transfer_limits: Record<number, { single_limit: number; daily_limit: number; monthly_limit: number }>;
  public_private_rules: {
    allow_public_to_private: boolean;
    allow_private_to_public: boolean;
    public_to_private_daily_limit: number;
    private_to_public_daily_limit: number;
    required_purpose_public_to_private: string[];
    required_purpose_private_to_public: string[];
  };
  risk_detection_rules: {
    same_name_transfer_count_threshold: number;
    same_name_transfer_time_window_hours: number;
    large_amount_no_purpose_threshold: number;
    abnormal_location_check: boolean;
    night_transaction_start_hour: number;
    night_transaction_end_hour: number;
    night_transaction_amount_threshold: number;
  };
}

export interface TransferAccountInfo {
  account_no: string;
  account_name: string;
  account_type?: string;
  bank_code?: string;
  bank_name?: string;
  location?: string;
}

export interface SettlementPreCheckRequest {
  payer_account_no: string;
  transfer_type: TransferType;
  transfer_mode: TransferMode;
  payee_account: TransferAccountInfo;
  amount: number;
  purpose?: string;
}

export interface LimitCheckResult {
  single_limit: number;
  daily_limit: number;
  monthly_limit: number;
  daily_used_amount: number;
  monthly_used_amount: number;
  daily_remaining: number;
  monthly_remaining: number;
  within_single_limit: boolean;
  within_daily_limit: boolean;
  within_monthly_limit: boolean;
  limit_error?: string;
}

export interface PublicPrivateCheckResult {
  payer_type?: string;
  payee_type?: string;
  is_public_to_private: boolean;
  is_private_to_public: boolean;
  is_same_type: boolean;
  allowed: boolean;
  rule_error?: string;
  purpose_required: boolean;
  purpose_valid: boolean;
  daily_limit?: number;
  daily_used?: number;
  daily_remaining?: number;
}

export interface FeeCalcResult {
  fee: number;
  fee_calc_desc: string;
  min_fee: number;
  max_fee: number;
  rate: number;
}

export interface SettlementPreCheckResult {
  passed: boolean;
  blocked: boolean;
  block_reason?: string;
  block_field?: string;
  warnings: string[];
  payer_account_valid: boolean;
  payer_account_status: number;
  payer_account_status_text: string;
  payer_not_frozen: boolean;
  payer_available_balance: number;
  balance_sufficient: boolean;
  payee_info_valid: boolean;
  payee_name_matched: boolean;
  amount_valid: boolean;
  limit_check: LimitCheckResult;
  public_private_check: PublicPrivateCheckResult;
  fee_calc: FeeCalcResult;
  arrival_time: string;
  need_review: boolean;
  review_reason?: string;
  suggested_audit_level: number;
}

export interface Settlement extends BaseEntity {
  settlement_no: string;
  batch_id?: string;
  transfer_type: TransferType;
  transfer_mode: TransferMode;
  channel_code?: string;
  payer_account_id: string;
  payer_account_no: string;
  payer_account_name?: string;
  payer_customer_id?: string;
  payer_account_type?: string;
  payee_account_no: string;
  payee_account_name: string;
  payee_bank_code?: string;
  payee_bank_name?: string;
  payee_account_type?: string;
  payee_location?: string;
  amount: number;
  currency: string;
  fee: number;
  fee_calc_desc?: string;
  arrival_time?: string;
  purpose?: string;
  remark?: string;
  org_id?: string;
  operator_id?: string;
  reviewer_id?: string;
  status: SettlementStatus;
  audit_status: AuditStatus;
  risk_level?: RiskLevel;
  risk_tags?: string;
  need_review: boolean;
  review_reason?: string;
  cancel_reason?: string;
  original_settlement_no?: string;
  request_id?: string;
  submit_time?: Date;
  review_time?: Date;
  settle_time?: Date;
  original_balance?: number;
  new_balance?: number;
}

export interface SettlementVO extends Settlement {
  transfer_type_text?: string;
  transfer_mode_text?: string;
  status_text?: string;
  audit_status_text?: string;
  risk_level_text?: string;
  org_name?: string;
  operator_name?: string;
  reviewer_name?: string;
  amount_formatted?: string;
  fee_formatted?: string;
  payer_customer_name?: string;
  is_risk_warning?: boolean;
  progress_percent?: number;
}

export interface SettlementQueryParams extends PaginationParams {
  keyword?: string;
  settlement_no?: string;
  payer_account_no?: string;
  payee_account_no?: string;
  payee_account_name?: string;
  transfer_type?: TransferType;
  transfer_mode?: TransferMode;
  status?: SettlementStatus;
  audit_status?: AuditStatus;
  risk_level?: RiskLevel;
  need_review?: boolean;
  org_id?: string;
  operator_id?: string;
  reviewer_id?: string;
  start_time?: string;
  end_time?: string;
  min_amount?: number;
  max_amount?: number;
  batch_id?: string;
}

export interface CreateSettlementRequest {
  transfer_type: TransferType;
  transfer_mode: TransferMode;
  channel_code?: string;
  payer_account_no: string;
  payee_account_no: string;
  payee_account_name: string;
  payee_bank_code?: string;
  payee_bank_name?: string;
  payee_account_type?: string;
  payee_location?: string;
  amount: number;
  currency?: string;
  purpose?: string;
  remark?: string;
  request_id?: string;
}

export interface CancelSettlementRequest {
  settlement_no: string;
  cancel_reason: string;
}

export interface ReviewSettlementRequest {
  settlement_no: string;
  approved: boolean;
  audit_level: number;
  review_reason?: string;
}

export interface SettlementTraceRequest {
  settlement_no?: string;
  payer_account_no?: string;
  payee_account_no?: string;
  payer_customer_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface SameNameTransferCheck {
  has_risk: boolean;
  same_name_count: number;
  time_window_hours: number;
  transfers: Array<{
    settlement_no: string;
    amount: number;
    create_time: string;
    payee_account_name: string;
  }>;
}

export interface LargeAmountNoPurposeCheck {
  has_risk: boolean;
  threshold: number;
  transfers: Array<{
    settlement_no: string;
    amount: number;
    create_time: string;
    payee_account_no: string;
  }>;
}

export interface AbnormalLocationCheck {
  has_risk: boolean;
  transfers: Array<{
    settlement_no: string;
    amount: number;
    create_time: string;
    payee_location: string;
    is_abnormal: boolean;
  }>;
}

export interface AccountComplianceCheck {
  payer_compliant: boolean;
  payee_compliant: boolean;
  payer_issues: string[];
  payee_issues: string[];
}

export interface TransactionAuthenticityCheck {
  is_authentic: boolean;
  authenticity_score: number;
  issues: string[];
}

export interface SettlementTraceResult {
  query_params: SettlementTraceRequest;
  total_count: number;
  total_amount: number;
  total_fee: number;
  records: SettlementVO[];
  same_name_check: SameNameTransferCheck;
  large_amount_check: LargeAmountNoPurposeCheck;
  abnormal_location_check: AbnormalLocationCheck;
  account_compliance_check: AccountComplianceCheck;
  transaction_authenticity_check: TransactionAuthenticityCheck;
  risk_warnings: Array<{
    risk_type: string;
    risk_level: number;
    description: string;
    related_settlement_nos: string[];
  }>;
  validation_passed: boolean;
}

export interface BatchSettlementItem {
  index?: number;
  payee_account_no: string;
  payee_account_name: string;
  payee_bank_code?: string;
  payee_bank_name?: string;
  payee_account_type?: string;
  payee_location?: string;
  amount: number;
  purpose?: string;
  remark?: string;
}

export interface CreateBatchSettlementRequest {
  batch_name: string;
  batch_type: BatchType;
  payer_account_no: string;
  channel_code?: string;
  items: BatchSettlementItem[];
  remark?: string;
}

export interface BatchSettlementResultItem {
  index: number;
  success: boolean;
  settlement_id?: string;
  settlement_no?: string;
  error?: string;
  warning?: string;
  need_review?: boolean;
  pre_check_result?: SettlementPreCheckResult;
  fee?: number;
}

export interface BatchSettlementResult {
  batch_id: string;
  batch_no: string;
  total_count: number;
  total_amount: number;
  total_fee: number;
  success_count: number;
  fail_count: number;
  pending_count: number;
  details: BatchSettlementResultItem[];
}

export interface BatchQueryParams extends PaginationParams {
  keyword?: string;
  batch_no?: string;
  batch_name?: string;
  batch_type?: BatchType;
  payer_account_no?: string;
  status?: number;
  audit_status?: number;
  need_review?: boolean;
  org_id?: string;
  operator_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface BatchSettlementVO extends BaseEntity {
  batch_no: string;
  batch_name: string;
  batch_type: number;
  batch_type_text?: string;
  payer_account_id: string;
  payer_account_no: string;
  payer_account_name?: string;
  total_count: number;
  total_amount: number;
  total_amount_formatted?: string;
  total_fee: number;
  total_fee_formatted?: string;
  success_count: number;
  fail_count: number;
  pending_count: number;
  processing_count: number;
  status: number;
  status_text?: string;
  audit_status: number;
  audit_status_text?: string;
  need_review: boolean;
  org_id?: string;
  org_name?: string;
  operator_id?: string;
  operator_name?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  review_reason?: string;
  remark?: string;
  submit_time?: Date;
  complete_time?: Date;
  progress_percent?: number;
}

export interface SettlementBatchReviewRequest {
  batch_id: string;
  approved: boolean;
  review_reason?: string;
}

export interface BatchProgressVO {
  batch_id: string;
  batch_no: string;
  status: number;
  total_count: number;
  success_count: number;
  fail_count: number;
  pending_count: number;
  processing_count: number;
  progress_percent: number;
  latest_settlements: SettlementVO[];
}
