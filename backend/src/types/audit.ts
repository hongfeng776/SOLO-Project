import { BaseEntity, StatusType, PaginationParams } from './common';

export type AuditRecordStatus = 0 | 1 | 2 | 3;
export type AuditResult = 1 | 2;
export type AuditType = 1 | 2 | 3;

export interface AuditRecord extends BaseEntity {
  biz_type: string;
  biz_id: string;
  biz_no: string;
  type: AuditType;
  level?: 1 | 2 | 3;
  status: AuditRecordStatus;
  submitter_id?: string;
  submitter_org_id?: string;
  submit_time?: Date;
  auditor_id?: string;
  auditor_org_id?: string;
  audit_time?: Date;
  result?: AuditResult;
  audit_remark?: string;
  current_node?: string;
  next_auditor_id?: string;
}

export interface AuditRequest {
  biz_type: string;
  biz_id: string;
  biz_no: string;
  type?: AuditType;
  level?: 1 | 2 | 3;
  remark?: string;
}

export interface AuditApprovalRequest {
  id: string;
  result: AuditResult;
  audit_remark?: string;
}

export interface AuditQueryParams extends PaginationParams {
  keyword?: string;
  biz_type?: string;
  type?: AuditType;
  status?: AuditRecordStatus;
  result?: AuditResult;
  level?: 1 | 2 | 3;
  auditor_id?: string;
  submitter_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface AuditRule extends BaseEntity {
  name: string;
  code: string;
  biz_type: string;
  rule_type: 1 | 2;
  min_amount?: number;
  max_amount?: number;
  condition_expression?: string;
  audit_level: 1 | 2 | 3;
  auditor_ids?: string;
  description?: string;
  sort?: number;
  status: StatusType;
}

export interface AuditRuleRequest {
  name: string;
  code: string;
  biz_type: string;
  rule_type: 1 | 2;
  min_amount?: number;
  max_amount?: number;
  condition_expression?: string;
  audit_level: 1 | 2 | 3;
  auditor_ids?: string;
  description?: string;
  sort?: number;
  status?: StatusType;
}

export interface AuditVO extends AuditRecord {
  submitter_name?: string;
  submitter_org_name?: string;
  auditor_name?: string;
  auditor_org_name?: string;
  status_text?: string;
  result_text?: string;
  type_text?: string;
}