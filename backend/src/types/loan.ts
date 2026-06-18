export type LoanType = 1 | 2 | 3 | 4; // 1个人消费贷 2经营贷 3房贷 4车贷
export type LoanStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
// 0待提交 1待预审 2预审通过 3预审拒绝 4待终审 5终审通过 6终审拒绝 7已放款 8已撤销
export type LoanTerm = 12 | 24 | 36 | 60 | 120 | 240 | 360; // 月
export type RepaymentMethod = 1 | 2 | 3 | 4; // 1等额本息 2等额本金 3先息后本 4到期一次还本付息
export type LoanPurpose = 'consumption' | 'business' | 'house' | 'car' | 'education' | 'travel' | 'medical' | 'other';

export const LoanTypeText: Record<number, string> = {
  1: '个人消费贷',
  2: '经营贷',
  3: '房贷',
  4: '车贷'
};

export const LoanStatusText: Record<number, string> = {
  0: '待提交',
  1: '待预审',
  2: '预审通过',
  3: '预审拒绝',
  4: '待终审',
  5: '终审通过',
  6: '终审拒绝',
  7: '已放款',
  8: '已撤销'
};

export const LoanTermText: Record<number, string> = {
  12: '12个月',
  24: '24个月',
  36: '36个月',
  60: '5年',
  120: '10年',
  240: '20年',
  360: '30年'
};

export const RepaymentMethodText: Record<number, string> = {
  1: '等额本息',
  2: '等额本金',
  3: '先息后本',
  4: '到期一次还本付息'
};

export const LoanPurposeText: Record<string, string> = {
  consumption: '日常消费',
  business: '经营周转',
  house: '购房',
  car: '购车',
  education: '教育',
  travel: '旅游',
  medical: '医疗',
  other: '其他'
};

export const LOAN_TYPE_CONFIG: Record<number, LoanTypeConfig> = {
  1: {
    loan_type: 1,
    name: '个人消费贷',
    max_amount: 500000,
    min_amount: 10000,
    interest_rate_base: 5.6,
    interest_rate_min: 4.2,
    interest_rate_max: 18.0,
    available_terms: [12, 24, 36, 60],
    repayment_methods: [1, 2, 3],
    require_collateral: false,
    pre_approval_process: ['basic_info', 'credit_check', 'income_verify'],
    final_approval_process: ['risk_review', 'amount_confirm', 'sign_contract']
  },
  2: {
    loan_type: 2,
    name: '经营贷',
    max_amount: 5000000,
    min_amount: 100000,
    interest_rate_base: 4.8,
    interest_rate_min: 3.85,
    interest_rate_max: 12.0,
    available_terms: [12, 24, 36, 60, 120],
    repayment_methods: [1, 2, 3, 4],
    require_collateral: true,
    pre_approval_process: ['basic_info', 'credit_check', 'business_verify', 'income_verify'],
    final_approval_process: ['risk_review', 'collateral_evaluate', 'amount_confirm', 'sign_contract']
  },
  3: {
    loan_type: 3,
    name: '房贷',
    max_amount: 10000000,
    min_amount: 100000,
    interest_rate_base: 3.45,
    interest_rate_min: 3.1,
    interest_rate_max: 5.88,
    available_terms: [120, 240, 360],
    repayment_methods: [1, 2],
    require_collateral: true,
    pre_approval_process: ['basic_info', 'credit_check', 'income_verify', 'house_verify'],
    final_approval_process: ['risk_review', 'house_evaluate', 'amount_confirm', 'sign_contract', 'mortgage_register']
  },
  4: {
    loan_type: 4,
    name: '车贷',
    max_amount: 2000000,
    min_amount: 50000,
    interest_rate_base: 4.5,
    interest_rate_min: 3.5,
    interest_rate_max: 10.0,
    available_terms: [12, 24, 36, 60],
    repayment_methods: [1, 2, 3],
    require_collateral: true,
    pre_approval_process: ['basic_info', 'credit_check', 'income_verify', 'car_verify'],
    final_approval_process: ['risk_review', 'car_evaluate', 'amount_confirm', 'sign_contract', 'mortgage_register']
  }
};

export const LARGE_LOAN_THRESHOLD = 1000000;
export const LOW_QUALITY_CUSTOMER_LEVEL = 2;

export interface LoanTypeConfig {
  loan_type: number;
  name: string;
  max_amount: number;
  min_amount: number;
  interest_rate_base: number;
  interest_rate_min: number;
  interest_rate_max: number;
  available_terms: number[];
  repayment_methods: number[];
  require_collateral: boolean;
  pre_approval_process: string[];
  final_approval_process: string[];
}

export interface LoanPreCheckRequest {
  customer_id?: string;
  customer_no?: string;
  id_card_no?: string;
  loan_type: LoanType;
  amount: number;
  term?: number;
  purpose?: string;
}

export interface LoanPreCheckResult {
  passed: boolean;
  credit_status_valid: boolean;
  debt_ratio_valid: boolean;
  account_activity_valid: boolean;
  repayment_history_valid: boolean;
  purpose_compliant: boolean;
  amount_matched: boolean;
  credit_score?: number;
  debt_ratio?: number;
  account_activity_score?: number;
  overdue_count?: number;
  max_loan_amount?: number;
  suggested_amount?: number;
  block_reason?: string;
  warnings: string[];
  applicable_rate?: number;
  required_materials?: string[];
}

export interface CreateLoanRequest {
  customer_id?: string;
  customer_no?: string;
  loan_type: LoanType;
  product_id?: string;
  amount: number;
  term: number;
  purpose: string;
  purpose_detail?: string;
  repayment_method: RepaymentMethod;
  interest_rate?: number;
  collateral_info?: any;
  contact_info?: any;
  income_info?: any;
  remark?: string;
  apply_channel?: string;
}

export interface LoanUpdateRequest {
  amount?: number;
  term?: number;
  purpose?: string;
  purpose_detail?: string;
  repayment_method?: number;
  remark?: string;
}

export interface LoanQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  loan_no?: string;
  customer_no?: string;
  customer_name?: string;
  id_card_no?: string;
  loan_type?: LoanType;
  product_id?: string;
  status?: LoanStatus;
  org_id?: string;
  operator_id?: string;
  reviewer_id?: string;
  start_time?: string;
  end_time?: string;
  min_amount?: number;
  max_amount?: number;
  is_pre_approved?: boolean;
  is_final_approved?: boolean;
}

export interface LoanVO {
  id: string;
  loan_no: string;
  customer_id?: string;
  customer_no?: string;
  customer_name?: string;
  id_card_no?: string;
  loan_type: LoanType;
  loan_type_text?: string;
  product_id?: string;
  product_name?: string;
  amount: number;
  term: number;
  term_text?: string;
  purpose: string;
  purpose_text?: string;
  purpose_detail?: string;
  repayment_method: RepaymentMethod;
  repayment_method_text?: string;
  interest_rate: number;
  total_interest?: number;
  monthly_payment?: number;
  status: LoanStatus;
  status_text?: string;
  apply_time?: Date;
  pre_approve_time?: Date;
  final_approve_time?: Date;
  disburse_time?: Date;
  cancel_time?: string;
  cancel_reason?: string;
  cancel_operator_id?: string;
  cancel_operator_name?: string;
  org_id?: string;
  org_name?: string;
  operator_id?: string;
  operator_name?: string;
  pre_reviewer_id?: string;
  pre_reviewer_name?: string;
  final_reviewer_id?: string;
  final_reviewer_name?: string;
  pre_approve_result?: string;
  final_approve_result?: string;
  pre_approve_opinion?: string;
  final_approve_opinion?: string;
  is_low_quality?: boolean;
  risk_level?: number;
  risk_tags?: string;
  credit_score?: number;
  debt_ratio?: number;
  collateral_info?: any;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchLoanItem {
  index?: number;
  customer_no?: string;
  id_card_no?: string;
  loan_type: LoanType;
  amount: number;
  term: number;
  purpose: string;
  repayment_method: RepaymentMethod;
  remark?: string;
}

export interface BatchLoanRequest {
  items: BatchLoanItem[];
  remark?: string;
}

export interface BatchLoanResultItem {
  index: number;
  success: boolean;
  loan_id?: string;
  loan_no?: string;
  is_low_quality?: boolean;
  need_review?: boolean;
  errors?: string[];
  warnings?: string[];
  pre_check?: LoanPreCheckResult;
}

export interface BatchLoanResult {
  success_count: number;
  fail_count: number;
  low_quality_count: number;
  review_count: number;
  details: BatchLoanResultItem[];
}

export interface BatchLoanReviewItem {
  id: string;
  operation: 'approve' | 'reject';
  reason?: string;
}

export interface BatchLoanReviewRequest {
  items: BatchLoanReviewItem[];
  review_type: 'pre' | 'final';
}

export interface BatchLoanReviewResult {
  success_count: number;
  fail_count: number;
  details: Array<{
    id: string;
    success: boolean;
    message?: string;
  }>;
}

export interface LoanTraceRequest {
  customer_id?: string;
  customer_no?: string;
  id_card_no?: string;
  loan_no?: string;
  start_time?: string;
  end_time?: string;
}

export interface LoanTraceOverdueItem {
  loan_no: string;
  amount: number;
  overdue_days: number;
  overdue_amount: number;
  status: string;
}

export interface LoanTraceMultiLendItem {
  loan_no: string;
  loan_type: number;
  amount: number;
  create_time: string;
  lender: string;
}

export interface LoanTraceResult {
  query_params: LoanTraceRequest;
  total_count: number;
  total_amount: number;
  records: LoanVO[];
  overdue_check: {
    has_overdue: boolean;
    unsettled_overdue: boolean;
    overdue_records: LoanTraceOverdueItem[];
  };
  multi_lending_check: {
    has_multi_lending: boolean;
    active_loan_count: number;
    active_loan_amount: number;
    lendings: LoanTraceMultiLendItem[];
  };
  fraud_check: {
    has_fraud_risk: boolean;
    info_inconsistency: boolean;
    risk_items: string[];
  };
  info_consistency_check: {
    passed: boolean;
    inconsistent_fields: string[];
  };
  validation_passed: boolean;
  risk_prompts: string[];
  abnormal_archives: LoanVO[];
}
