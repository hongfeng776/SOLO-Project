export enum AccountType {
  TYPE_I = 1,
  TYPE_II = 2,
  TYPE_III = 3
}

export const AccountTypeText: Record<number, string> = {
  1: '一类账户（普通）',
  2: '二类账户',
  3: '三类账户'
};

export enum AccountStatus {
  CLOSED = 0,
  NORMAL = 1,
  FROZEN = 2,
  LOST = 3,
  DORMANT = 4
}

export const AccountStatusText: Record<number, string> = {
  0: '已注销',
  1: '正常',
  2: '冻结',
  3: '挂失',
  4: '休眠'
};

export enum AccountOpeningStatus {
  PENDING_PRECHECK = 0,
  PRECHECK_PASSED = 1,
  FILLING = 2,
  PENDING_REVIEW = 3,
  REVIEW_PASSED = 4,
  ACCOUNT_OPENED = 5,
  REJECTED = 6,
  CANCELLED = 7,
  REFUSED = 8
}

export const AccountOpeningStatusText: Record<number, string> = {
  0: '待预检',
  1: '预检通过待录入',
  2: '录入中',
  3: '待复核',
  4: '复核通过待开户',
  5: '已开户',
  6: '已驳回',
  7: '已取消',
  8: '已拒绝'
};

export const AccountTypeConfig: Record<number, {
  daily_limit: number;
  single_limit: number;
  annual_fee: number;
  permissions: string[];
  description: string;
}> = {
  1: {
    daily_limit: 200000,
    single_limit: 50000,
    annual_fee: 10,
    permissions: ['transfer', 'deposit', 'withdraw', 'payment', 'online_banking', 'mobile_banking', 'investment', 'loan'],
    description: '全功能账户，无交易场景限制，作为主账户使用'
  },
  2: {
    daily_limit: 10000,
    single_limit: 5000,
    annual_fee: 0,
    permissions: ['transfer', 'deposit', 'payment', 'online_banking', 'mobile_banking'],
    description: '限制功能账户，可办理存款、购买投资理财产品、限额消费和缴费、限额向非绑定账户转出资金'
  },
  3: {
    daily_limit: 2000,
    single_limit: 1000,
    annual_fee: 0,
    permissions: ['payment', 'mobile_banking'],
    description: '小额支付账户，仅支持小额消费和缴费支付，最高余额不超过2000元'
  }
};

export interface AccountVO {
  id: string;
  account_no: string;
  customer_id: string;
  customer_no?: string;
  customer_name?: string;
  account_type: number;
  account_type_text: string;
  alias?: string;
  currency: string;
  balance: number;
  available_balance: number;
  frozen_amount: number;
  daily_limit: number;
  single_limit: number;
  annual_fee: number;
  open_purpose?: string;
  function_permissions?: string;
  open_org_id?: string;
  open_org_name?: string;
  open_operator_id?: string;
  open_operator_name?: string;
  status: number;
  status_text: string;
  open_date?: string;
  close_date?: string;
  opening_id?: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccountOpeningVO {
  id: string;
  opening_no: string;
  customer_id?: string;
  customer_no?: string;
  account_type: number;
  account_type_text: string;
  customer_name: string;
  id_card_no: string;
  id_masked?: string;
  id_type?: number;
  id_valid_from?: string;
  id_valid_to?: string;
  id_permanent?: number;
  mobile: string;
  mobile_masked?: string;
  mobile_verified?: number;
  residential_address?: string;
  residential_province_code?: string;
  target_org_id?: string;
  target_org_name?: string;
  target_org_province_code?: string;
  region_matched?: number;
  region_matched_text?: string;
  open_purpose?: string;
  image_urls?: string;
  image_clarity_score?: string;
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
  is_isolated: number;
  isolate_reason?: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PrecheckRequest {
  customer_name: string;
  id_card_no: string;
  mobile: string;
  id_valid_from?: string;
  id_valid_to?: string;
  id_permanent?: number;
  account_type?: number;
  channel_code?: string;
}

export interface PrecheckItemResult {
  field: string;
  passed: boolean;
  message: string;
  level?: 'error' | 'warning' | 'info';
}

export interface PrecheckResponse {
  passed: boolean;
  overall_score: number;
  items: PrecheckItemResult[];
  risk_level: number;
  risk_tags: string[];
  customer_exists: boolean;
  customer_id?: string;
  customer_no?: string;
  require_manual_review: boolean;
  blocked_reason?: string;
}

export interface CreateAccountOpeningRequest {
  account_type: number;
  customer_name: string;
  id_card_no: string;
  id_type?: number;
  id_valid_from?: string;
  id_valid_to?: string;
  id_permanent?: number;
  mobile: string;
  mobile_verified?: number;
  residential_address?: string;
  residential_province_code?: string;
  target_org_id?: string;
  target_org_province_code?: string;
  region_matched?: number;
  open_purpose?: string;
  image_urls?: string;
  image_clarity_score?: string;
  channel_code?: string;
  remark?: string;
}

export interface UpdateAccountOpeningRequest {
  account_type?: number;
  mobile?: string;
  mobile_verified?: number;
  residential_address?: string;
  residential_province_code?: string;
  target_org_id?: string;
  target_org_province_code?: string;
  region_matched?: number;
  open_purpose?: string;
  image_urls?: string;
  image_clarity_score?: string;
  remark?: string;
}

export interface AccountOpeningQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  opening_no?: string;
  customer_name?: string;
  id_card_no?: string;
  account_type?: number;
  status?: number;
  risk_level?: number;
  channel_code?: string;
  is_isolated?: number;
  submit_org_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface BatchImportItem {
  customer_name: string;
  id_card_no: string;
  mobile: string;
  account_type: number;
  id_valid_from?: string;
  id_valid_to?: string;
  id_permanent?: number;
  residential_address?: string;
  open_purpose?: string;
  target_org_id?: string;
  image_urls?: string;
  channel_code?: string;
  remark?: string;
}

export interface BatchImportRequest {
  items: BatchImportItem[];
}

export interface BatchImportResultItem {
  index: number;
  success: boolean;
  opening_id?: string;
  opening_no?: string;
  errors?: string[];
  warnings?: string[];
  need_manual_review?: boolean;
  risk_level?: number;
  status?: number;
}

export interface BatchReviewRequest {
  ids: string[];
  operation: 'approve' | 'reject' | 'isolate' | 'deisolate';
  reason?: string;
}

export interface BatchReviewResult {
  success_count: number;
  fail_count: number;
  details: Array<{
    id: string;
    success: boolean;
    message?: string;
  }>;
}

export interface TraceCheckRequest {
  id_card_no: string;
  customer_name?: string;
}

export interface TraceCheckResponse {
  id_card_no: string;
  matched: boolean;
  total_openings: number;
  recent_openings: Array<{
    opening_no: string;
    account_type: number;
    status: number;
    created_at: string;
    target_org_name?: string;
  }>;
  duplicate_risk: boolean;
  duplicate_risk_reason?: string;
  image_checks: {
    clarity_ok: boolean;
    consistency_ok: boolean;
    validity_ok: boolean;
    details?: string[];
  };
  allowed: boolean;
  block_reason?: string;
}
