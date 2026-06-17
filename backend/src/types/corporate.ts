export enum CorporateAccountType {
  BASIC = 1,
  GENERAL = 2,
  SPECIAL = 3,
  TEMPORARY = 4
}

export const CorporateAccountTypeText: Record<number, string> = {
  1: '基本存款账户',
  2: '一般存款账户',
  3: '专用存款账户',
  4: '临时存款账户'
};

export const CorporateAccountTypeConfig: Record<number, {
  daily_limit: number;
  single_limit: number;
  annual_fee: number;
  permissions: string[];
  description: string;
  approval_level: number;
}> = {
  1: {
    daily_limit: 50000000,
    single_limit: 10000000,
    annual_fee: 500,
    permissions: ['transfer', 'deposit', 'withdraw', 'payment', 'online_banking', 'mobile_banking', 'loan', 'payroll', 'tax', 'trade', 'investment'],
    description: '基本存款账户是存款人办理日常转账结算和现金收付的账户，是存款人的主办账户',
    approval_level: 3
  },
  2: {
    daily_limit: 20000000,
    single_limit: 5000000,
    annual_fee: 300,
    permissions: ['transfer', 'deposit', 'payment', 'online_banking', 'mobile_banking', 'loan', 'payroll', 'tax'],
    description: '一般存款账户用于办理存款人借款转存、借款归还和其他结算的资金收付，不得办理现金支取',
    approval_level: 2
  },
  3: {
    daily_limit: 10000000,
    single_limit: 2000000,
    annual_fee: 200,
    permissions: ['transfer', 'deposit', 'payment', 'online_banking', 'special_fund'],
    description: '专用存款账户用于办理各项专用资金的收付，如基本建设资金、更新改造资金、财政预算外资金等',
    approval_level: 2
  },
  4: {
    daily_limit: 5000000,
    single_limit: 1000000,
    annual_fee: 100,
    permissions: ['transfer', 'deposit', 'payment', 'online_banking'],
    description: '临时存款账户用于办理临时机构以及存款人临时经营活动发生的资金收付，有效期最长不得超过2年',
    approval_level: 1
  }
};

export enum BusinessStatus {
  NORMAL = 1,
  SUSPENDED = 2,
  CANCELLED = 3,
  REVOKED = 4,
  MOVED_IN = 5,
  MOVED_OUT = 6
}

export const BusinessStatusText: Record<number, string> = {
  1: '正常经营',
  2: '停业',
  3: '注销',
  4: '吊销',
  5: '迁入',
  6: '迁出'
};

export interface CorporateOpeningVO {
  id: string;
  opening_no: string;
  customer_id?: string;
  customer_no?: string;
  account_type: number;
  account_type_text: string;
  enterprise_name: string;
  credit_code: string;
  license_valid_from?: string;
  license_valid_to?: string;
  license_permanent?: number;
  legal_representative?: string;
  legal_id_card_no?: string;
  legal_verified?: number;
  agent_name?: string;
  agent_id_card_no?: string;
  agent_mobile?: string;
  agent_verified?: number;
  registered_address?: string;
  business_address?: string;
  business_status?: number;
  business_status_text?: string;
  tax_registration_no?: string;
  tax_info_consistent?: number;
  industry_type?: string;
  registered_capital?: number;
  business_years?: number;
  authorization_complete?: number;
  target_org_id?: string;
  target_org_name?: string;
  open_purpose?: string;
  supporting_materials?: string;
  approval_level?: string;
  risk_level: number;
  risk_level_text: string;
  risk_tags?: string;
  channel_code?: string;
  channel_text?: string;
  status: number;
  status_text: string;
  precheck_result?: number;
  precheck_reasons?: any;
  reject_reason?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  submit_org_id?: string;
  submit_org_name?: string;
  submitter_id?: string;
  submitter_name?: string;
  submit_time?: string;
  review_time?: string;
  account_id?: string;
  account_no?: string;
  is_dishonest: number;
  is_abnormal: number;
  is_paused: number;
  is_isolated: number;
  isolate_reason?: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CorporatePrecheckRequest {
  enterprise_name: string;
  credit_code: string;
  account_type?: number;
  license_valid_from?: string;
  license_valid_to?: string;
  license_permanent?: number;
  legal_representative?: string;
  legal_id_card_no?: string;
  legal_verified?: number;
  authorization_complete?: number;
  industry_type?: string;
  registered_capital?: number;
  business_years?: number;
  channel_code?: string;
}

export interface CorporatePrecheckItemResult {
  name: string;
  field: string;
  passed: boolean;
  score: number;
  message: string;
  level?: 'error' | 'warning' | 'info';
}

export interface CorporatePrecheckResponse {
  passed: boolean;
  overall_score: number;
  risk_level: number;
  items: CorporatePrecheckItemResult[];
  risk_tags: string[];
  customer_exists: boolean;
  customer_id?: string;
  customer_no?: string;
  require_manual_review: boolean;
  blocked_reason?: string;
}

export interface CreateCorporateOpeningRequest {
  account_type: number;
  enterprise_name: string;
  credit_code: string;
  license_valid_from?: string;
  license_valid_to?: string;
  license_permanent?: number;
  legal_representative?: string;
  legal_id_card_no?: string;
  legal_verified?: number;
  agent_name?: string;
  agent_id_card_no?: string;
  agent_mobile?: string;
  agent_verified?: number;
  registered_address?: string;
  business_address?: string;
  business_status?: number;
  tax_registration_no?: string;
  tax_info_consistent?: number;
  industry_type?: string;
  registered_capital?: number;
  business_years?: number;
  authorization_complete?: number;
  target_org_id?: string;
  open_purpose?: string;
  supporting_materials?: string;
  channel_code?: string;
  remark?: string;
}

export interface UpdateCorporateOpeningRequest {
  legal_representative?: string;
  legal_id_card_no?: string;
  legal_verified?: number;
  agent_name?: string;
  agent_id_card_no?: string;
  agent_mobile?: string;
  agent_verified?: number;
  registered_address?: string;
  business_address?: string;
  business_status?: number;
  tax_registration_no?: string;
  tax_info_consistent?: number;
  industry_type?: string;
  registered_capital?: number;
  business_years?: number;
  authorization_complete?: number;
  target_org_id?: string;
  open_purpose?: string;
  supporting_materials?: string;
  remark?: string;
}

export interface CorporateOpeningQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  opening_no?: string;
  enterprise_name?: string;
  credit_code?: string;
  account_type?: number;
  status?: number;
  risk_level?: number;
  channel_code?: string;
  is_isolated?: number;
  is_paused?: number;
  submit_org_id?: string;
  customer_id?: string;
  industry_type?: string;
  start_time?: string;
  end_time?: string;
}

export interface CorporateBatchImportItem {
  enterprise_name: string;
  credit_code: string;
  account_type: number;
  license_valid_from?: string;
  license_valid_to?: string;
  license_permanent?: number;
  legal_representative?: string;
  legal_id_card_no?: string;
  legal_verified?: number;
  agent_name?: string;
  agent_id_card_no?: string;
  agent_mobile?: string;
  registered_address?: string;
  business_address?: string;
  industry_type?: string;
  registered_capital?: number;
  business_years?: number;
  authorization_complete?: number;
  target_org_id?: string;
  open_purpose?: string;
  supporting_materials?: string;
  channel_code?: string;
  remark?: string;
}

export interface CorporateBatchImportRequest {
  items: CorporateBatchImportItem[];
}

export interface CorporateBatchImportResultItem {
  index: number;
  success: boolean;
  opening_id?: string;
  opening_no?: string;
  errors?: string[];
  warnings?: string[];
  need_manual_review?: boolean;
  risk_level?: number;
  status?: number;
  is_isolated?: number;
}

export interface CorporateBatchReviewItem {
  id: string;
  operation: 'approve' | 'reject' | 'pause' | 'resume' | 'isolate' | 'deisolate';
  reason?: string;
}

export interface CorporateBatchReviewRequest {
  items: CorporateBatchReviewItem[];
}

export interface CorporateBatchReviewResult {
  success_count: number;
  fail_count: number;
  details: Array<{
    id: string;
    success: boolean;
    message?: string;
  }>;
}

export interface CorporateTraceCheckRequest {
  credit_code: string;
  enterprise_name?: string;
  legal_id_card_no?: string;
  agent_id_card_no?: string;
}

export interface CorporateTraceCheckResponse {
  credit_code: string;
  matched: boolean;
  total_openings: number;
  total_closed: number;
  total_abnormal: number;
  history_records: Array<{
    opening_no: string;
    account_type: number;
    status: number;
    created_at: string;
    target_org_name?: string;
  }>;
  is_dishonest: boolean;
  is_abnormal: boolean;
  legal_verified: boolean;
  agent_verified: boolean;
  risk_prompts: string[];
  allowed: boolean;
  block_reason?: string;
}

export interface CorporateAccountConfigResponse {
  account_types: Array<{
    type: number;
    name: string;
    description: string;
    daily_limit: number;
    single_limit: number;
    annual_fee: number;
    permissions: string[];
    approval_level: number;
  }>;
  risk_levels: Record<number, string>;
  channels: Record<string, string>;
  business_status: Record<number, string>;
}
