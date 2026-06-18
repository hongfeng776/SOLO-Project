export type ApprovalLevel = 1 | 2 | 3 | 4 | 5;
export type ApprovalResult = 1 | 2 | 3;
export type ApprovalStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const ApprovalLevelText: Record<number, string> = {
  1: '一级审批',
  2: '二级审批',
  3: '三级审批',
  4: '四级审批',
  5: '五级审批'
};

export const ApprovalResultText: Record<number, string> = {
  1: '通过',
  2: '驳回',
  3: '取消'
};

export const ApprovalStatusText: Record<number, string> = {
  0: '待进入审批',
  1: '审批中',
  2: '一级审批通过',
  3: '二级审批通过',
  4: '三级审批通过',
  5: '四级审批通过',
  6: '五级审批通过',
  7: '审批完成'
};

export const RejectReasonOptions = [
  { code: 'credit_bad', label: '征信不良' },
  { code: 'debt_high', label: '负债过高' },
  { code: 'income_insufficient', label: '收入证明不足' },
  { code: 'material_missing', label: '资料缺失' },
  { code: 'material_fake', label: '资料造假' },
  { code: 'purpose_illegal', label: '贷款用途不合规' },
  { code: 'risk_high', label: '风险等级过高' },
  { code: 'policy_violation', label: '违反政策规定' },
  { code: 'other', label: '其他原因' }
];

export const SINGLE_LEVEL_APPROVAL_THRESHOLD = 500000;
export const MULTI_LEVEL_APPROVAL_REQUIRED = 1000000;
export const HIGH_RISK_LEVEL_THRESHOLD = 3;

export interface ApprovalLevelConfig {
  level: number;
  name: string;
  min_amount: number;
  max_amount: number;
  required_role: string;
  required_permission: string;
  auto_pass_if_low_risk: boolean;
}

export const APPROVAL_LEVEL_CONFIG: Record<number, ApprovalLevelConfig> = {
  1: {
    level: 1,
    name: '一级审批',
    min_amount: 0,
    max_amount: 500000,
    required_role: 'operator',
    required_permission: 'loan:approval:level1',
    auto_pass_if_low_risk: false
  },
  2: {
    level: 2,
    name: '二级审批',
    min_amount: 500000,
    max_amount: 1000000,
    required_role: 'manager',
    required_permission: 'loan:approval:level2',
    auto_pass_if_low_risk: false
  },
  3: {
    level: 3,
    name: '三级审批',
    min_amount: 1000000,
    max_amount: 3000000,
    required_role: 'manager',
    required_permission: 'loan:approval:level3',
    auto_pass_if_low_risk: false
  },
  4: {
    level: 4,
    name: '四级审批',
    min_amount: 3000000,
    max_amount: 5000000,
    required_role: 'auditor',
    required_permission: 'loan:approval:level4',
    auto_pass_if_low_risk: false
  },
  5: {
    level: 5,
    name: '五级审批',
    min_amount: 5000000,
    max_amount: 999999999,
    required_role: 'admin',
    required_permission: 'loan:approval:level5',
    auto_pass_if_low_risk: false
  }
};

export interface MaterialCheckItem {
  field: string;
  name: string;
  required: boolean;
  has_value: boolean;
  is_abnormal: boolean;
  value?: any;
  expected_value?: any;
  remark?: string;
}

export interface CreditReport {
  credit_score: number;
  credit_level: string;
  overdue_count: number;
  overdue_amount: number;
  current_loan_count: number;
  current_loan_amount: number;
  query_count_30days: number;
  public_records: string[];
  report_date: string;
}

export interface DebtData {
  total_debt_amount: number;
  monthly_debt_payment: number;
  monthly_income: number;
  debt_to_income_ratio: number;
  credit_card_balance: number;
  other_loan_balance: number;
  mortgage_balance: number;
}

export interface PreApprovalConclusion {
  pre_check_passed: boolean;
  pre_reviewer: string;
  pre_review_time: string;
  pre_review_opinion: string;
  risk_level: number;
  risk_tags: string[];
  suggested_amount: number;
  suggested_term: number;
  special_notes: string;
}

export interface ApprovalPreCheckRequest {
  loan_id: string;
}

export interface ApprovalPreCheckResult {
  can_enter: boolean;
  has_application_submitted: boolean;
  has_pre_approval_passed: boolean;
  has_materials_complete: boolean;
  block_reason?: string;
  material_checks: MaterialCheckItem[];
  abnormal_fields: string[];
  missing_materials: string[];
}

export interface GetApprovalDetailRequest {
  loan_id: string;
}

export interface ApprovalDetailVO {
  loan_id: string;
  loan_no: string;
  customer_name: string;
  id_card_no: string;
  loan_type: number;
  loan_type_text: string;
  amount: number;
  term: number;
  term_text: string;
  purpose: string;
  purpose_text: string;
  interest_rate: number;
  repayment_method: number;
  repayment_method_text: string;
  status: number;
  status_text: string;
  apply_time: string;
  pre_approval_passed: boolean;
  pre_reviewer_name?: string;
  pre_approve_time?: string;
  pre_approve_opinion?: string;
  current_level: number;
  current_level_text: string;
  total_levels: number;
  approval_progress: number;
  is_high_risk: boolean;
  risk_level: number;
  risk_tags: string;
  credit_report?: CreditReport;
  debt_data?: DebtData;
  pre_approval_conclusion?: PreApprovalConclusion;
  material_checks: MaterialCheckItem[];
  abnormal_fields: string[];
  approval_locked: boolean;
  lock_reason?: string;
  approval_flow?: ApprovalFlowVO[];
  approval_logs?: ApprovalLogVO[];
  contract_generated?: boolean;
  contract_no?: string;
}

export interface ApprovalFlowVO {
  id: string;
  loan_id: string;
  loan_no: string;
  current_level: number;
  current_level_text: string;
  total_levels: number;
  status: number;
  status_text: string;
  approver_id?: string;
  approver_name?: string;
  approve_time?: string;
  approval_result?: number;
  approval_result_text?: string;
  approval_opinion?: string;
  reject_reason?: string;
  reject_details?: string;
  next_level?: number;
  next_level_text?: string;
  is_current_level: boolean;
  can_approve: boolean;
}

export interface ApprovalLogVO {
  id: string;
  loan_id: string;
  loan_no: string;
  approval_level: number;
  approval_level_text: string;
  operator_id: string;
  operator_name: string;
  operation_type: string;
  operation_time: string;
  from_status: number;
  from_status_text: string;
  to_status: number;
  to_status_text: string;
  approval_result?: number;
  approval_result_text?: string;
  approval_opinion?: string;
  reject_reason?: string;
  ip_address?: string;
  user_agent?: string;
  risk_level_before?: number;
  risk_level_after?: number;
  consistency_check?: number;
  conflict_flag?: number;
  conflict_reason?: string;
}

export interface DoApprovalRequest {
  loan_id: string;
  approval_level: number;
  approval_result: number;
  approval_opinion?: string;
  reject_reason?: string;
  reject_details?: string;
  supporting_files?: string[];
  approved_amount?: number;
  approved_term?: number;
  approved_rate?: number;
}

export interface DoApprovalResult {
  success: boolean;
  loan_id: string;
  loan_no: string;
  current_level: number;
  current_level_text: string;
  status: number;
  status_text: string;
  approval_progress: number;
  next_level?: number;
  next_level_text?: string;
  is_approval_complete: boolean;
  contract_generated?: boolean;
  contract_no?: string;
  message?: string;
}

export interface BatchApprovalQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  loan_no?: string;
  customer_name?: string;
  id_card_no?: string;
  loan_type?: number;
  approval_status?: number;
  min_amount?: number;
  max_amount?: number;
  risk_level?: number;
  current_level?: number;
  is_high_risk?: boolean;
  start_time?: string;
  end_time?: string;
}

export interface BatchApprovalItem {
  loan_id: string;
  loan_no: string;
  customer_name: string;
  id_card_no: string;
  loan_type: number;
  loan_type_text: string;
  amount: number;
  term: number;
  term_text: string;
  purpose_text: string;
  interest_rate: number;
  status: number;
  status_text: string;
  apply_time: string;
  current_level: number;
  current_level_text: string;
  total_levels: number;
  approval_progress: number;
  risk_level: number;
  is_high_risk: boolean;
  risk_tags: string;
  pre_approve_opinion?: string;
  can_batch_approve: boolean;
  cannot_approve_reason?: string;
}

export interface BatchApprovalRequest {
  items: Array<{
    loan_id: string;
    approval_result: number;
    approval_opinion?: string;
    reject_reason?: string;
  }>;
  approval_level: number;
}

export interface BatchApprovalResult {
  success_count: number;
  fail_count: number;
  details: Array<{
    loan_id: string;
    loan_no: string;
    success: boolean;
    message?: string;
  }>;
}

export interface ApprovalTraceRequest {
  loan_id?: string;
  loan_no?: string;
  start_time?: string;
  end_time?: string;
}

export interface ApprovalTraceResult {
  loan_id: string;
  loan_no: string;
  total_approval_count: number;
  approval_flow_records: ApprovalFlowVO[];
  approval_log_records: ApprovalLogVO[];
  consistency_check: {
    passed: boolean;
    inconsistent_items: string[];
  };
  violation_check: {
    has_violation: boolean;
    unauthorized_approvals: string[];
    illegal_approvals: string[];
    conflict_approvals: string[];
  };
  operation_log_complete: boolean;
  missing_logs: string[];
}

export interface GenerateContractRequest {
  loan_id: string;
}

export interface GenerateContractResult {
  success: boolean;
  contract_no: string;
  contract_url: string;
  generated_at: string;
}
