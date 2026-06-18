export type RepaymentType = 1 | 2 | 3 | 4;
export type RepaymentStatus = 0 | 1 | 2 | 3 | 4;
export type WithholdStatus = 0 | 1 | 2 | 3 | 4;
export type RepaymentChannel = 'active' | 'auto_withhold' | 'offline' | 'transfer';

export const RepaymentTypeText: Record<number, string> = {
  1: '按期还款',
  2: '提前还款',
  3: '逾期还款',
  4: '分期还款'
};

export const RepaymentStatusText: Record<number, string> = {
  0: '待处理',
  1: '处理中',
  2: '还款成功',
  3: '还款失败',
  4: '已撤销'
};

export const WithholdStatusText: Record<number, string> = {
  0: '待代扣',
  1: '代扣中',
  2: '代扣成功',
  3: '代扣失败',
  4: '已取消'
};

export const RepaymentChannelText: Record<string, string> = {
  active: '主动还款',
  auto_withhold: '自动代扣',
  offline: '线下还款',
  transfer: '转账还款'
};

export const PREPAYMENT_PENALTY_RATE = 0.01;
export const OVERDUE_DAILY_RATE = 0.0005;
export const MIN_OVERDUE_FINE = 10;
export const MAX_OVERDUE_FINE_RATE = 0.3;
export const BATCH_WITHHOLD_PRIORITY_NORMAL = 1;
export const BATCH_WITHHOLD_PRIORITY_OVERDUE = 5;
export const REPAYMENT_AMOUNT_TOLERANCE = 0.01;

export interface RepaymentPreCheckResult {
  can_repay: boolean;
  loan_status_valid: boolean;
  account_status_valid: boolean;
  balance_sufficient: boolean;
  withhold_agreement_valid: boolean;
  due_date_valid: boolean;
  current_period: number;
  total_periods: number;
  due_amount: number;
  due_date: string;
  remaining_principal: number;
  overdue_days: number;
  overdue_amount: number;
  block_reason?: string;
  warnings: string[];
}

export interface RepaymentBillVO {
  id: string;
  loan_id: string;
  loan_no: string;
  period_no: number;
  total_periods: number;
  bill_date: string;
  due_date: string;
  principal: number;
  interest: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: number;
  status_text: string;
  is_overdue: boolean;
  overdue_days: number;
  overdue_fine: number;
  paid_date?: string;
}

export interface RepaymentDetailVO {
  loan_id: string;
  loan_no: string;
  customer_name: string;
  id_card_no: string;
  loan_type: number;
  loan_type_text: string;
  loan_amount: number;
  loan_term: number;
  loan_term_text: string;
  interest_rate: number;
  repayment_method: number;
  repayment_method_text: string;
  loan_status: number;
  loan_status_text: string;
  disburse_date: string;
  remaining_principal: number;
  total_repaid_principal: number;
  total_repaid_interest: number;
  total_repaid_amount: number;
  current_period: number;
  total_periods: number;
  current_bill?: RepaymentBillVO;
  overdue_days: number;
  overdue_amount: number;
  next_due_date: string;
  next_due_amount: number;
  can_prepay: boolean;
  prepayment_penalty: number;
  account_no?: string;
  account_balance: number;
  withhold_agreement_valid: boolean;
  settlement_progress: number;
  credit_report_status: number;
  credit_report_status_text: string;
  bills?: RepaymentBillVO[];
}

export interface DoRepaymentRequest {
  loan_id: string;
  repayment_type: number;
  repayment_channel: string;
  amount: number;
  period_no?: number;
  account_id?: string;
  password?: string;
  remark?: string;
}

export interface DoRepaymentResult {
  success: boolean;
  repayment_id: string;
  loan_id: string;
  loan_no: string;
  repayment_type: number;
  repayment_type_text: string;
  amount: number;
  principal: number;
  interest: number;
  penalty: number;
  fee: number;
  status: number;
  status_text: string;
  repayment_time: string;
  remaining_principal: number;
  remaining_periods: number;
  settlement_progress: number;
  is_settled: boolean;
  message?: string;
  transaction_no?: string;
}

export interface BatchWithholdQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  loan_no?: string;
  customer_name?: string;
  loan_type?: number;
  status?: number;
  min_amount?: number;
  max_amount?: number;
  is_overdue?: boolean;
  repayment_priority?: number;
  start_date?: string;
  end_date?: string;
}

export interface BatchWithholdItem {
  id: string;
  loan_id: string;
  loan_no: string;
  customer_id: string;
  customer_name: string;
  id_card_no: string;
  loan_type: number;
  loan_type_text: string;
  loan_amount: number;
  due_amount: number;
  due_date: string;
  period_no: number;
  total_periods: number;
  overdue_days: number;
  is_overdue: boolean;
  repayment_priority: number;
  account_id: string;
  account_no: string;
  account_balance: number;
  balance_sufficient: boolean;
  withhold_agreement_valid: boolean;
  status: number;
  status_text: string;
  can_withhold: boolean;
  cannot_reason?: string;
  selected?: boolean;
}

export interface BatchWithholdRequest {
  items: Array<{
    loan_id: string;
    due_amount: number;
  }>;
  withhold_type?: 'normal' | 'overdue' | 'all';
}

export interface BatchWithholdResult {
  total_count: number;
  success_count: number;
  fail_count: number;
  total_success_amount: number;
  total_fail_amount: number;
  details: Array<{
    loan_id: string;
    loan_no: string;
    customer_name: string;
    due_amount: number;
    success: boolean;
    status: number;
    message?: string;
    transaction_no?: string;
  }>;
  abnormal_list: Array<{
    loan_id: string;
    loan_no: string;
    customer_name: string;
    due_amount: number;
    abnormal_type: string;
    abnormal_reason: string;
  }>;
}

export interface RepaymentTraceRequest {
  loan_id?: string;
  loan_no?: string;
  repayment_id?: string;
  transaction_no?: string;
  start_time?: string;
  end_time?: string;
}

export interface RepaymentLogVO {
  id: string;
  loan_id: string;
  loan_no: string;
  repayment_id: string;
  period_no?: number;
  repayment_type: number;
  repayment_type_text: string;
  repayment_channel: string;
  repayment_channel_text: string;
  amount: number;
  principal: number;
  interest: number;
  penalty: number;
  fee: number;
  status: number;
  status_text: string;
  operator_id?: string;
  operator_name?: string;
  operation_time: string;
  account_id?: string;
  account_no?: string;
  transaction_no?: string;
  before_balance?: number;
  after_balance?: number;
  fund_flow: string;
  bill_matched: number;
  bill_match_result?: string;
  abnormal_flag: number;
  abnormal_type?: string;
  abnormal_reason?: string;
  need_review: number;
  review_status?: number;
  ip_address?: string;
  request_snapshot?: string;
}

export interface RepaymentTraceResult {
  loan_id: string;
  loan_no: string;
  total_repayment_count: number;
  total_repayment_amount: number;
  total_principal_paid: number;
  total_interest_paid: number;
  total_penalty_paid: number;
  repayment_records: RepaymentLogVO[];
  duplicate_check: {
    has_duplicate: boolean;
    duplicate_count: number;
    duplicate_records: string[];
  };
  amount_check: {
    passed: boolean;
    abnormal_amount_count: number;
    abnormal_items: string[];
  };
  bill_match_check: {
    passed: boolean;
    unmatched_count: number;
    unmatched_items: string[];
  };
  consistency_check: {
    passed: boolean;
    inconsistent_count: number;
    inconsistent_items: string[];
  };
  abnormal_review: {
    has_abnormal: boolean;
    abnormal_count: number;
    need_review_count: number;
    abnormal_items: string[];
  };
}
