import { BaseEntity, PaginationParams } from './common';

export type ViolationType = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ViolationLevel = 1 | 2 | 3 | 4 | 5;
export type ViolationStatus = 0 | 1 | 2 | 3 | 4;
export type BizType = 'transaction' | 'product' | 'customer';

export interface ViolationRecord extends BaseEntity {
  violation_no: string;
  customer_id?: string;
  customer_no?: string;
  biz_id?: string;
  biz_no?: string;
  biz_type?: BizType;
  violation_type?: ViolationType;
  violation_level?: ViolationLevel;
  description?: string;
  rule_ref?: string;
  status: ViolationStatus;
  discoverer_id?: string;
  discoverer_org_id?: string;
  handler_id?: string;
  discover_time?: Date;
  handle_time?: Date;
  rectification?: string;
  remark?: string;
}

export interface CreateViolationRecordRequest {
  violation_no: string;
  customer_id?: string;
  customer_no?: string;
  biz_id?: string;
  biz_no?: string;
  biz_type?: BizType;
  violation_type?: ViolationType;
  violation_level?: ViolationLevel;
  description?: string;
  rule_ref?: string;
  status?: ViolationStatus;
  discoverer_id?: string;
  discoverer_org_id?: string;
  handler_id?: string;
  discover_time?: string;
  handle_time?: string;
  rectification?: string;
  remark?: string;
}

export interface UpdateViolationRecordRequest {
  customer_id?: string;
  customer_no?: string;
  biz_id?: string;
  biz_no?: string;
  biz_type?: BizType;
  violation_type?: ViolationType;
  violation_level?: ViolationLevel;
  description?: string;
  rule_ref?: string;
  status?: ViolationStatus;
  handler_id?: string;
  handle_time?: string;
  rectification?: string;
  remark?: string;
}

export interface ViolationRecordQueryParams extends PaginationParams {
  keyword?: string;
  violation_no?: string;
  customer_id?: string;
  customer_no?: string;
  biz_id?: string;
  biz_no?: string;
  biz_type?: BizType;
  violation_type?: ViolationType;
  violation_level?: ViolationLevel;
  status?: ViolationStatus;
  discoverer_id?: string;
  discoverer_org_id?: string;
  handler_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface ViolationRecordVO extends ViolationRecord {
  customer_name?: string;
  discoverer_name?: string;
  discoverer_org_name?: string;
  handler_name?: string;
  biz_type_text?: string;
  violation_type_text?: string;
  violation_level_text?: string;
  status_text?: string;
}
