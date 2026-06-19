import { BaseEntity, PaginationParams } from './common';

export type CorporateCustomerType = 1 | 2 | 3 | 4;
export type CorporateStatus = 0 | 1 | 2 | 3 | 4;
export type BusinessStatus = 1 | 2 | 3 | 4 | 5 | 6;
export type CorpVerifyStatus = 0 | 1 | 2;
export type CorpBatchStatus = 0 | 1 | 2 | 3 | 4;
export type CorpProcessResult = 0 | 1 | 2 | 3 | 4;
export type CorpServiceLevel = 1 | 2 | 3 | 4;
export type CorpRiskLevel = 1 | 2 | 3 | 4;
export type CorpBatchUpdateType = 1 | 2 | 3 | 4;

export interface CorpPreCheckFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface CorpPreCheckResult {
  passed: boolean;
  blocked: boolean;
  filing_verify_status: CorpVerifyStatus;
  legal_verify_status: CorpVerifyStatus;
  qualification_verify_status: CorpVerifyStatus;
  info_completeness: number;
  missing_fields: string[];
  errors: CorpPreCheckFieldError[];
  warnings: string[];
  block_reason?: string;
}

export interface CorpTypeAdaptResult {
  customer_type: CorporateCustomerType;
  customer_type_text: string;
  credit_limit: number;
  service_level: CorpServiceLevel;
  service_level_text: string;
  risk_level: CorpRiskLevel;
  risk_level_text: string;
  risk_tags: string[];
  service_permissions: string[];
  adapt_factors: {
    registered_capital: number;
    business_years: number;
    business_status: BusinessStatus;
    industry_type: string;
  };
  adapt_rules: string[];
}

export interface CreateCorporateProfileRequest {
  org_id?: string;
  enterprise_name: string;
  credit_code: string;
  enterprise_short_name?: string;
  legal_representative: string;
  legal_id_card_no: string;
  legal_id_type?: number;
  legal_mobile?: string;
  industry_type?: string;
  industry_code?: string;
  registered_capital?: number;
  registered_address: string;
  business_address?: string;
  establish_date?: string;
  business_years?: number;
  business_status?: BusinessStatus;
  business_scope?: string;
  license_no?: string;
  license_valid_from?: string;
  license_valid_to?: string;
  license_permanent?: number;
  customer_type?: CorporateCustomerType;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  related_customer_id?: string;
  skip_precheck?: boolean;
}

export interface UpdateCorporateProfileRequest {
  org_id?: string;
  enterprise_short_name?: string;
  legal_mobile?: string;
  industry_type?: string;
  industry_code?: string;
  registered_capital?: number;
  registered_address?: string;
  business_address?: string;
  business_status?: BusinessStatus;
  business_scope?: string;
  license_no?: string;
  license_valid_from?: string;
  license_valid_to?: string;
  license_permanent?: number;
  customer_type?: CorporateCustomerType;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  risk_level?: CorpRiskLevel;
  risk_tags?: string;
  change_remark?: string;
}

export interface CorporateProfileQueryParams extends PaginationParams {
  keyword?: string;
  profile_no?: string;
  enterprise_name?: string;
  credit_code?: string;
  customer_type?: CorporateCustomerType;
  business_status?: BusinessStatus;
  risk_level?: CorpRiskLevel;
  status?: CorporateStatus;
  need_complete?: number;
  is_abnormal?: number;
  is_dishonest?: number;
  org_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface CorporateProfileVO extends BaseEntity {
  profile_no: string;
  org_id?: string;
  org_name?: string;
  enterprise_name: string;
  credit_code: string;
  enterprise_short_name?: string;
  legal_representative: string;
  legal_id_card_no: string;
  legal_id_type?: number;
  legal_id_type_text?: string;
  legal_mobile?: string;
  industry_type?: string;
  industry_code?: string;
  registered_capital?: number;
  registered_address: string;
  business_address?: string;
  establish_date?: string;
  business_years?: number;
  business_status: BusinessStatus;
  business_status_text?: string;
  business_scope?: string;
  license_no?: string;
  license_valid_from?: string;
  license_valid_to?: string;
  license_permanent?: number;
  customer_type: CorporateCustomerType;
  customer_type_text?: string;
  credit_limit?: number;
  service_level: CorpServiceLevel;
  service_level_text?: string;
  risk_level: CorpRiskLevel;
  risk_level_text?: string;
  risk_tags?: string;
  risk_tag_list?: string[];
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  filing_verify_status: CorpVerifyStatus;
  filing_verify_status_text?: string;
  legal_verify_status: CorpVerifyStatus;
  legal_verify_status_text?: string;
  qualification_verify_status: CorpVerifyStatus;
  qualification_verify_status_text?: string;
  verify_fail_reason?: string;
  is_dishonest: number;
  dishonest_info?: string;
  info_completeness: number;
  missing_fields?: string;
  missing_field_list?: string[];
  need_complete: number;
  is_abnormal: number;
  abnormal_reason?: string;
  service_permissions?: string;
  service_permission_list?: string[];
  status: CorporateStatus;
  status_text?: string;
  related_customer_id?: string;
  creator_id?: string;
  creator_name?: string;
  profile_time?: string;
}

export interface CorporateProfileLogVO {
  id: string;
  profile_id: string;
  profile_no?: string;
  change_type: string;
  change_type_name?: string;
  before_content?: string;
  after_content?: string;
  change_remark?: string;
  operator_id?: string;
  operator_name?: string;
  operator_org_id?: string;
  operator_org_name?: string;
  operate_time?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  review_time?: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface CorporateTraceRequest {
  credit_code: string;
  enterprise_name?: string;
}

export interface CorporateTraceRecord {
  id: string;
  profile_no: string;
  enterprise_name: string;
  credit_code: string;
  status: number;
  status_text?: string;
  customer_type: number;
  customer_type_text?: string;
  change_type?: string;
  change_type_name?: string;
  operate_time?: string;
  operator_name?: string;
  org_name?: string;
  remark?: string;
}

export interface CorporateTraceResponse {
  credit_code: string;
  matched: boolean;
  total_profiles: number;
  total_active: number;
  total_closed: number;
  total_abnormal: number;
  has_duplicate: boolean;
  has_dishonest: boolean;
  has_tampering: boolean;
  history_records: CorporateTraceRecord[];
  change_logs: CorporateProfileLogVO[];
  risk_prompts: string[];
  allowed: boolean;
  block_reason?: string;
}

export interface CorpBatchUpdateItem {
  row_index: number;
  credit_code?: string;
  enterprise_name?: string;
  business_status?: BusinessStatus;
  industry_type?: string;
  registered_capital?: number;
  qualification_info?: string;
  risk_level?: CorpRiskLevel;
}

export interface CorpBatchUpdateRequest {
  org_id?: string;
  batch_name?: string;
  update_type: CorpBatchUpdateType;
  file_name?: string;
  file_url?: string;
  items: CorpBatchUpdateItem[];
}

export interface CorpBatchUpdateResultItem {
  row_index: number;
  profile_id?: string;
  profile_no?: string;
  enterprise_name?: string;
  credit_code?: string;
  process_result: CorpProcessResult;
  process_result_text?: string;
  process_message?: string;
  errors?: CorpPreCheckFieldError[];
  missing_fields?: string[];
  warnings?: string[];
  need_review?: boolean;
  review_reason?: string;
}

export interface CorpBatchUpdateResponse {
  batch_id: string;
  batch_no: string;
  batch_name?: string;
  update_type: CorpBatchUpdateType;
  total_count: number;
  success_count: number;
  fail_count: number;
  need_complete_count: number;
  review_count: number;
  status: number;
  status_text?: string;
  items: CorpBatchUpdateResultItem[];
}

export interface CorpBatchQueryParams extends PaginationParams {
  batch_no?: string;
  batch_name?: string;
  update_type?: CorpBatchUpdateType;
  status?: CorpBatchStatus;
  org_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface CorpBatchItemQueryParams extends PaginationParams {
  batch_id: string;
  process_result?: CorpProcessResult;
  keyword?: string;
}

export interface CorpBatchVO extends BaseEntity {
  batch_no: string;
  org_id?: string;
  org_name?: string;
  batch_name?: string;
  update_type: CorpBatchUpdateType;
  update_type_text?: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  need_complete_count: number;
  review_count: number;
  file_url?: string;
  file_name?: string;
  status: CorpBatchStatus;
  status_text?: string;
  fail_reason?: string;
  creator_id?: string;
  creator_name?: string;
  import_time?: string;
  finish_time?: string;
}

export interface CorpBatchItemVO extends BaseEntity {
  batch_id: string;
  row_index: number;
  profile_id?: string;
  enterprise_name?: string;
  credit_code?: string;
  business_status?: number;
  industry_type?: string;
  registered_capital?: number;
  risk_level?: number;
  process_result: CorpProcessResult;
  process_result_text?: string;
  process_message?: string;
  error_field_list?: CorpPreCheckFieldError[];
  missing_field_list?: string[];
}

export interface CorpReviewAbnormalRequest {
  profile_id: string;
  passed: boolean;
  review_remark: string;
}
