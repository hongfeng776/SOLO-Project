import { BaseEntity, PaginationParams } from './common';

export type CustomerLevel = 1 | 2 | 3 | 4 | 5;
export type TagType = 1 | 2 | 3 | 4 | 5;
export type TagSource = 1 | 2 | 3 | 4;
export type TagStatus = 1 | 2 | 3 | 4;
export type TagBatchOperationType = 1 | 2 | 3 | 4;
export type TagBatchStatus = 0 | 1 | 2 | 3 | 4;
export type TagProcessResult = 0 | 1 | 2 | 3 | 4;
export type DataUpdateStatus = 0 | 1;

export interface TagPreCheckFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface TagPreCheckResult {
  passed: boolean;
  blocked: boolean;
  asset_data_ready: boolean;
  transaction_data_ready: boolean;
  retention_data_ready: boolean;
  risk_data_ready: boolean;
  all_data_ready: boolean;
  tag_compliance_valid: boolean;
  tag_customer_group_match: boolean;
  errors: TagPreCheckFieldError[];
  warnings: string[];
  block_reason?: string;
}

export interface TagAdaptResult {
  tag_code: string;
  tag_name: string;
  tag_type: TagType;
  customer_level: CustomerLevel;
  customer_level_text: string;
  service_permissions: string[];
  fee_discounts: { code: string; name: string; discount: number }[];
  marketing_rules: { code: string; name: string; description: string }[];
  adapt_factors: {
    asset_amount: number;
    transaction_count: number;
    retention_days: number;
    risk_level: number;
  };
  adapt_rules: string[];
}

export interface TagComplianceCheckResult {
  compliant: boolean;
  tag_customer_group_match: boolean;
  violation_type?: string;
  violation_message?: string;
}

export interface CreateCustomerTagRequest {
  customer_id: string;
  tag_code: string;
  tag_name: string;
  tag_type?: TagType;
  tag_source?: TagSource;
  effective_time?: string;
  expire_time?: string;
  remark?: string;
  skip_precheck?: boolean;
}

export interface UpdateCustomerTagRequest {
  tag_status?: TagStatus;
  effective_time?: string;
  expire_time?: string;
  remark?: string;
  change_remark?: string;
}

export interface AdjustTagRequest {
  customer_id: string;
  old_tag_code: string;
  new_tag_code: string;
  new_tag_name: string;
  tag_type?: TagType;
  change_remark?: string;
}

export interface CustomerTagQueryParams extends PaginationParams {
  keyword?: string;
  customer_id?: string;
  customer_no?: string;
  customer_name?: string;
  customer_level?: CustomerLevel;
  tag_code?: string;
  tag_type?: TagType;
  tag_source?: TagSource;
  tag_status?: TagStatus;
  data_ready?: number;
  start_time?: string;
  end_time?: string;
}

export interface CustomerTagVO {
  id: string;
  customer_id: string;
  customer_no?: string;
  customer_name?: string;
  customer_level: CustomerLevel;
  customer_level_text?: string;
  tag_code: string;
  tag_name: string;
  tag_type: TagType;
  tag_type_text?: string;
  tag_source: TagSource;
  tag_source_text?: string;
  tag_status: TagStatus;
  tag_status_text?: string;
  effective_time?: string;
  expire_time?: string;
  service_permission_list?: string[];
  fee_discount_list?: { code: string; name: string; discount: number }[];
  marketing_rule_list?: { code: string; name: string; description: string }[];
  asset_data_status: DataUpdateStatus;
  transaction_data_status: DataUpdateStatus;
  retention_data_status: DataUpdateStatus;
  risk_data_status: DataUpdateStatus;
  all_data_ready: boolean;
  asset_data_time?: string;
  transaction_data_time?: string;
  retention_data_time?: string;
  risk_data_time?: string;
  operator_id?: string;
  operator_name?: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerTagLogVO {
  id: string;
  tag_id: string;
  customer_id: string;
  customer_no?: string;
  customer_name?: string;
  tag_code?: string;
  tag_name?: string;
  change_type: string;
  change_type_name?: string;
  before_content?: string;
  after_content?: string;
  change_remark?: string;
  is_unauthorized: number;
  is_violation: number;
  block_reason?: string;
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

export interface TagTraceRequest {
  customer_id: string;
  tag_code?: string;
}

export interface TagTraceRecord {
  id: string;
  tag_id: string;
  customer_id: string;
  customer_no?: string;
  customer_name?: string;
  tag_code: string;
  tag_name: string;
  tag_status: number;
  tag_status_text?: string;
  change_type?: string;
  change_type_name?: string;
  operate_time?: string;
  operator_name?: string;
  is_unauthorized: number;
  is_violation: number;
  block_reason?: string;
}

export interface TagTraceResponse {
  customer_id: string;
  customer_name?: string;
  matched: boolean;
  total_tags: number;
  active_tags: number;
  expired_tags: number;
  removed_tags: number;
  has_unauthorized: boolean;
  has_violation: boolean;
  has_tampering: boolean;
  history_records: TagTraceRecord[];
  change_logs: CustomerTagLogVO[];
  risk_prompts: string[];
  allowed: boolean;
  block_reason?: string;
}

export interface TagBatchItem {
  row_index: number;
  customer_id?: string;
  customer_no?: string;
  customer_name?: string;
  current_level?: CustomerLevel;
  current_tags?: string;
}

export interface TagBatchRequest {
  org_id?: string;
  batch_name?: string;
  operation_type: TagBatchOperationType;
  target_tag_code?: string;
  target_tag_name?: string;
  filter_level?: CustomerLevel;
  filter_tag_code?: string;
  items: TagBatchItem[];
}

export interface TagBatchResultItem {
  row_index: number;
  customer_id?: string;
  customer_no?: string;
  customer_name?: string;
  current_level?: number;
  process_result: TagProcessResult;
  process_result_text?: string;
  process_message?: string;
  block_reason?: string;
}

export interface TagBatchResponse {
  batch_id: string;
  batch_no: string;
  batch_name?: string;
  operation_type: TagBatchOperationType;
  total_count: number;
  success_count: number;
  fail_count: number;
  unauthorized_count: number;
  violation_count: number;
  status: number;
  status_text?: string;
  items: TagBatchResultItem[];
}

export interface TagBatchQueryParams extends PaginationParams {
  batch_no?: string;
  batch_name?: string;
  operation_type?: TagBatchOperationType;
  status?: TagBatchStatus;
  org_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface TagBatchItemQueryParams extends PaginationParams {
  batch_id: string;
  process_result?: TagProcessResult;
  keyword?: string;
}

export interface TagBatchVO {
  id: string;
  batch_no: string;
  org_id?: string;
  org_name?: string;
  batch_name?: string;
  operation_type: TagBatchOperationType;
  operation_type_text?: string;
  target_tag_code?: string;
  target_tag_name?: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  unauthorized_count: number;
  violation_count: number;
  status: TagBatchStatus;
  status_text?: string;
  fail_reason?: string;
  creator_id?: string;
  creator_name?: string;
  create_time?: string;
  finish_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TagBatchItemVO {
  id: string;
  batch_id: string;
  row_index: number;
  customer_id?: string;
  customer_no?: string;
  customer_name?: string;
  current_level?: number;
  current_tags?: string;
  process_result: TagProcessResult;
  process_result_text?: string;
  process_message?: string;
  block_reason?: string;
  created_at?: string;
  updated_at?: string;
}
