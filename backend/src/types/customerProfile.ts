import { BaseEntity, PaginationParams } from './common';

export type ProfileCustomerLevel = 1 | 2 | 3 | 4;
export type ProfileStatus = 0 | 1 | 2 | 3 | 4;
export type VerifyStatus = 0 | 1 | 2;
export type BatchStatus = 0 | 1 | 2 | 3 | 4;
export type ProcessResult = 0 | 1 | 2 | 3 | 4;

export interface PreCheckFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface PreCheckResult {
  passed: boolean;
  blocked: boolean;
  id_verify_status: VerifyStatus;
  face_verify_status: VerifyStatus;
  mobile_verify_status: VerifyStatus;
  police_verify_status: VerifyStatus;
  info_completeness: number;
  missing_fields: string[];
  errors: PreCheckFieldError[];
  warnings: string[];
  block_reason?: string;
}

export interface LevelJudgeResult {
  customer_level: ProfileCustomerLevel;
  customer_level_text: string;
  customer_tags: string[];
  service_permissions: string[];
  judge_factors: {
    total_assets: number;
    monthly_transaction_count: number;
    retention_days: number;
  };
  judge_rules: string[];
}

export interface CreateCustomerProfileRequest {
  org_id?: string;
  customer_name: string;
  id_card_no: string;
  id_type?: number;
  gender?: string;
  birth_date?: string;
  nation?: string;
  mobile: string;
  email?: string;
  registered_address: string;
  residential_address: string;
  occupation?: string;
  employer?: string;
  position?: string;
  education?: string;
  marital_status?: string;
  total_assets?: number;
  monthly_transaction_count?: number;
  retention_days?: number;
  related_customer_id?: string;
  skip_precheck?: boolean;
}

export interface UpdateCustomerProfileRequest {
  org_id?: string;
  customer_name?: string;
  mobile?: string;
  email?: string;
  registered_address?: string;
  residential_address?: string;
  occupation?: string;
  employer?: string;
  position?: string;
  education?: string;
  marital_status?: string;
  total_assets?: number;
  monthly_transaction_count?: number;
  retention_days?: number;
  change_remark?: string;
}

export interface CustomerProfileQueryParams extends PaginationParams {
  keyword?: string;
  profile_no?: string;
  customer_name?: string;
  id_card_no?: string;
  mobile?: string;
  customer_level?: ProfileCustomerLevel;
  status?: ProfileStatus;
  need_complete?: number;
  is_abnormal?: number;
  org_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface CustomerProfileVO extends BaseEntity {
  profile_no: string;
  org_id?: string;
  org_name?: string;
  customer_name: string;
  id_card_no: string;
  id_type?: number;
  id_type_text?: string;
  gender?: string;
  gender_text?: string;
  birth_date?: string;
  nation?: string;
  mobile: string;
  email?: string;
  registered_address: string;
  residential_address: string;
  occupation?: string;
  employer?: string;
  position?: string;
  education?: string;
  marital_status?: string;
  total_assets?: number;
  monthly_transaction_count?: number;
  retention_days?: number;
  customer_level: ProfileCustomerLevel;
  customer_level_text?: string;
  customer_tags?: string;
  customer_tag_list?: string[];
  service_permissions?: string;
  service_permission_list?: string[];
  id_verify_status: VerifyStatus;
  id_verify_status_text?: string;
  face_verify_status: VerifyStatus;
  face_verify_status_text?: string;
  mobile_verify_status: VerifyStatus;
  mobile_verify_status_text?: string;
  police_verify_status: VerifyStatus;
  police_verify_status_text?: string;
  police_verify_reason?: string;
  info_completeness: number;
  missing_fields?: string;
  missing_field_list?: string[];
  need_complete: number;
  is_abnormal: number;
  abnormal_reason?: string;
  status: ProfileStatus;
  status_text?: string;
  related_customer_id?: string;
  creator_id?: string;
  creator_name?: string;
  profile_time?: string;
}

export interface CustomerProfileLogVO extends BaseEntity {
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
}

export interface CustomerProfileTraceRequest {
  id_card_no: string;
  customer_name?: string;
  mobile?: string;
}

export interface CustomerProfileTraceRecord {
  id: string;
  profile_no: string;
  customer_name: string;
  id_card_no: string;
  status: number;
  status_text?: string;
  customer_level: number;
  customer_level_text?: string;
  change_type?: string;
  change_type_name?: string;
  operate_time?: string;
  operator_name?: string;
  org_name?: string;
  remark?: string;
}

export interface CustomerProfileTraceResponse {
  id_card_no: string;
  matched: boolean;
  total_profiles: number;
  total_active: number;
  total_closed: number;
  total_abnormal: number;
  has_duplicate: boolean;
  has_fake_info: boolean;
  history_records: CustomerProfileTraceRecord[];
  change_logs: CustomerProfileLogVO[];
  risk_prompts: string[];
  allowed: boolean;
  block_reason?: string;
}

export interface BatchImportItem {
  row_index: number;
  customer_name?: string;
  id_card_no?: string;
  id_type?: number;
  gender?: string;
  mobile?: string;
  registered_address?: string;
  residential_address?: string;
  occupation?: string;
  employer?: string;
  total_assets?: number;
  monthly_transaction_count?: number;
  retention_days?: number;
}

export interface BatchImportRequest {
  org_id?: string;
  batch_name?: string;
  file_name?: string;
  file_url?: string;
  items: BatchImportItem[];
}

export interface BatchImportResultItem {
  row_index: number;
  profile_id?: string;
  profile_no?: string;
  customer_name?: string;
  id_card_no?: string;
  process_result: ProcessResult;
  process_result_text?: string;
  process_message?: string;
  errors?: PreCheckFieldError[];
  missing_fields?: string[];
  warnings?: string[];
  is_abnormal?: boolean;
  abnormal_reason?: string;
}

export interface BatchImportResponse {
  batch_id: string;
  batch_no: string;
  batch_name?: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  need_complete_count: number;
  abnormal_count: number;
  status: number;
  status_text?: string;
  items: BatchImportResultItem[];
}

export interface ProfileBatchQueryParams extends PaginationParams {
  batch_no?: string;
  batch_name?: string;
  status?: BatchStatus;
  org_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface BatchItemQueryParams extends PaginationParams {
  batch_id: string;
  process_result?: ProcessResult;
  keyword?: string;
}

export interface BatchVO extends BaseEntity {
  batch_no: string;
  org_id?: string;
  org_name?: string;
  batch_name?: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  need_complete_count: number;
  abnormal_count: number;
  file_url?: string;
  file_name?: string;
  status: BatchStatus;
  status_text?: string;
  fail_reason?: string;
  creator_id?: string;
  creator_name?: string;
  import_time?: string;
  finish_time?: string;
}

export interface BatchItemVO extends BaseEntity {
  batch_id: string;
  row_index: number;
  profile_id?: string;
  customer_name?: string;
  id_card_no?: string;
  mobile?: string;
  total_assets?: number;
  process_result: ProcessResult;
  process_result_text?: string;
  process_message?: string;
  error_field_list?: PreCheckFieldError[];
  missing_field_list?: string[];
}

export interface ReviewAbnormalRequest {
  profile_id: string;
  passed: boolean;
  review_remark: string;
}
