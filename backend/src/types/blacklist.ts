export enum BlacklistGrade {
  TEMPORARY = 1,
  SHORT_TERM = 2,
  LONG_TERM = 3,
  PERMANENT = 4
}

export const BlacklistGradeText: Record<number, string> = {
  1: '临时黑名单',
  2: '短期黑名单',
  3: '长期黑名单',
  4: '永久黑名单'
};

export const BlacklistGradeColor: Record<number, string> = {
  1: 'warning',
  2: 'warning',
  3: 'danger',
  4: 'danger'
};

export enum BlacklistStatus {
  PENDING_REVIEW = 0,
  ACTIVE = 1,
  REVIEWING = 2,
  EXPIRED = 3,
  REMOVED = 4,
  REJECTED = 5
}

export const BlacklistStatusText: Record<number, string> = {
  0: '待审核',
  1: '生效中',
  2: '复核中',
  3: '已到期',
  4: '已移除',
  5: '已驳回'
};

export const BlacklistStatusColor: Record<number, string> = {
  0: 'info',
  1: 'success',
  2: 'warning',
  3: 'warning',
  4: 'info',
  5: 'danger'
};

export enum BusinessRestrictionType {
  TRANSACTION_BLOCK = 1,
  ACCOUNT_FREEZE = 2,
  LOAN_REJECT = 3,
  CARD_REJECT = 4,
  WITHDRAWAL_LIMIT = 5,
  ALL_CHANNEL_BLOCK = 6
}

export const BusinessRestrictionTypeText: Record<number, string> = {
  1: '禁止交易',
  2: '账户冻结',
  3: '贷款拒绝',
  4: '开卡拒绝',
  5: '取现限额',
  6: '全渠道限制'
};

export enum EvidenceType {
  VIOLATION_RECORD = 1,
  TRANSACTION_EVIDENCE = 2,
  SUPERVISION_DOCUMENT = 3,
  COURT_DOCUMENT = 4,
  MANUAL_EVIDENCE = 5
}

export const EvidenceTypeText: Record<number, string> = {
  1: '违规记录',
  2: '交易凭证',
  3: '监管文书',
  4: '司法文书',
  5: '手工录入'
};

export enum BlacklistTraceType {
  ADD_BLACKLIST = 1,
  REVIEW_PASS = 2,
  REVIEW_REJECT = 3,
  REMOVE_BLACKLIST = 4,
  EXTEND_PERIOD = 5,
  GRADE_CHANGE = 6,
  COMPLIANCE_CHECK = 7,
  BATCH_PROCESS = 8
}

export const BlacklistTraceTypeText: Record<number, string> = {
  1: '加入黑名单',
  2: '审核通过',
  3: '审核驳回',
  4: '移除黑名单',
  5: '延期',
  6: '等级变更',
  7: '合规校验',
  8: '批量处理'
};

export enum BlacklistBatchType {
  SCREEN_ADD = 1,
  BATCH_ADD = 2,
  BATCH_REMOVE = 3,
  BATCH_EXTEND = 4,
  BATCH_GRADE_CHANGE = 5
}

export const BlacklistBatchTypeText: Record<number, string> = {
  1: '筛查录入',
  2: '批量录入',
  3: '批量移除',
  4: '批量延期',
  5: '批量等级变更'
};

export enum BlacklistBatchStatus {
  PENDING = 0,
  PROCESSING = 1,
  COMPLETED = 2,
  FAILED = 3
}

export const BlacklistBatchStatusText: Record<number, string> = {
  0: '待执行',
  1: '执行中',
  2: '已完成',
  3: '执行失败'
};

export enum ViolationType {
  FUND_ABNORMAL = 1,
  SUSPICIOUS_ACCOUNT = 2,
  OPERATION_VIOLATION = 3,
  INCOMPLETE_DATA = 4,
  AML = 5,
  SUPERVISION_VIOLATION = 6,
  CREDIT_DEFAULT = 7,
  FRAUD = 8,
  OTHER = 9
}

export const ViolationTypeText: Record<number, string> = {
  1: '资金异常',
  2: '可疑账户',
  3: '操作违规',
  4: '资料不全',
  5: '反洗钱',
  6: '监管违规',
  7: '信用违约',
  8: '欺诈行为',
  9: '其他'
};

export interface EvidenceItem {
  evidence_type: number;
  evidence_id?: string;
  evidence_no?: string;
  evidence_name?: string;
  evidence_url?: string;
  upload_time?: string;
}

export interface BusinessRestrictionConfig {
  restriction_type: number;
  is_enabled: boolean;
  description?: string;
}

export interface ReleaseCondition {
  min_duration_days: number;
  rectification_required: boolean;
  review_required: boolean;
  approval_required: boolean;
  additional_conditions?: string[];
}

export interface GradeConfig {
  grade: number;
  default_duration_days?: number;
  review_cycle_days: number;
  restrictions: BusinessRestrictionConfig[];
  release_condition: ReleaseCondition;
  allow_manual_remove: boolean;
  allow_extend: boolean;
  max_extend_days?: number;
}

export interface BusinessStatusInfo {
  account_id: string;
  account_no: string;
  account_type: number;
  account_status: number;
  is_locked: boolean;
  lock_reason?: string;
}

export interface PendingBusinessInfo {
  biz_id: string;
  biz_no: string;
  biz_type: string;
  biz_status: number;
  is_locked: boolean;
  lock_reason?: string;
}

export interface PreCheckResult {
  passed: boolean;
  failed_reasons: string[];
  violation_records: any[];
  evidence_items: EvidenceItem[];
  missing_evidence: string[];
  incomplete_processes: string[];
  business_statuses: BusinessStatusInfo[];
  pending_businesses: PendingBusinessInfo[];
}

export interface BlacklistQueryParams {
  keyword?: string;
  blacklist_no?: string;
  customer_no?: string;
  customer_name?: string;
  id_card_no?: string;
  grade?: number;
  status?: number;
  violation_type?: number;
  is_auto_remind?: number;
  start_date?: string;
  end_date?: string;
  expire_start_date?: string;
  expire_end_date?: string;
  org_id?: string;
  page?: number;
  pageSize?: number;
}

export interface BlacklistCreateRequest {
  customer_id: string;
  violation_type: number;
  violation_level: number;
  grade: number;
  description: string;
  evidence_ids: string[];
  evidence_items: EvidenceItem[];
  effective_date?: string;
  expire_date?: string;
  auto_remind: number;
  remark?: string;
  biz_ids?: string[];
}

export interface BlacklistReviewRequest {
  id: string;
  review_result: number;
  review_opinion: string;
}

export interface BlacklistRemoveRequest {
  id: string;
  remove_reason: string;
  rectification_evidence?: EvidenceItem[];
  release_conditions_met: boolean;
}

export interface BlacklistExtendRequest {
  id: string;
  extend_days: number;
  extend_reason: string;
}

export interface BlacklistGradeChangeRequest {
  id: string;
  target_grade: number;
  change_reason: string;
}

export interface BlacklistBatchQueryParams {
  keyword?: string;
  batch_no?: string;
  batch_type?: number;
  status?: number;
  start_date?: string;
  end_date?: string;
  creator_id?: string;
  page?: number;
  pageSize?: number;
}

export interface BlacklistBatchCreateRequest {
  batch_type: number;
  batch_name: string;
  customer_ids?: string[];
  filter_condition?: any;
  grade_filter?: number;
  violation_type_filter?: number;
  target_grade?: number;
  extend_days?: number;
  handle_reason: string;
}

export interface BlacklistTraceQueryParams {
  blacklist_id?: string;
  trace_type?: number;
  operator_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
}

export interface BlacklistComplianceCheckRequest {
  id: string;
  check_type: number;
}

export interface BlacklistVO {
  id: string;
  blacklist_no: string;
  customer_id: string;
  customer_no: string;
  customer_name: string;
  id_card_no?: string;
  customer_type?: number;
  violation_type: number;
  violation_type_text?: string;
  violation_level: number;
  grade: number;
  grade_text?: string;
  grade_color?: string;
  status: number;
  status_text?: string;
  status_color?: string;
  description: string;
  evidence_count: number;
  violation_record_ids?: string[];
  evidence_items?: EvidenceItem[];
  business_restrictions?: BusinessRestrictionConfig[];
  effective_date: string;
  expire_date?: string;
  remaining_days?: number;
  auto_remind: number;
  review_count: number;
  last_review_date?: string;
  next_review_date?: string;
  locked_accounts?: BusinessStatusInfo[];
  locked_businesses?: PendingBusinessInfo[];
  creator_id?: string;
  creator_name?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  review_time?: string;
  review_opinion?: string;
  remove_reason?: string;
  remove_time?: string;
  remover_id?: string;
  remover_name?: string;
  org_id?: string;
  org_name?: string;
  batch_id?: string;
  batch_no?: string;
  is_compliant?: number;
  violation_details?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BlacklistBatchVO {
  id: string;
  batch_no: string;
  batch_name: string;
  batch_type: number;
  batch_type_text?: string;
  status: number;
  status_text?: string;
  status_color?: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  filter_condition?: any;
  grade_filter?: number;
  violation_type_filter?: number;
  target_grade?: number;
  extend_days?: number;
  handle_reason: string;
  execute_start_time?: string;
  execute_end_time?: string;
  execute_log?: string;
  creator_id?: string;
  creator_name?: string;
  org_id?: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
  items?: BlacklistVO[];
}

export interface BlacklistTraceVO {
  id: string;
  blacklist_id: string;
  blacklist_no: string;
  trace_type: number;
  trace_type_text?: string;
  operator_id?: string;
  operator_name?: string;
  operation_detail?: any;
  before_grade?: number;
  after_grade?: number;
  before_status?: number;
  after_status?: number;
  is_compliant: number;
  violation_type?: number;
  violation_details?: string;
  remark?: string;
  created_at?: string;
}

export interface BlacklistStatisticsVO {
  total_count: number;
  active_count: number;
  pending_review_count: number;
  expired_count: number;
  removed_count: number;
  temporary_count: number;
  short_term_count: number;
  long_term_count: number;
  permanent_count: number;
  today_add_count: number;
  today_remove_count: number;
  expire_soon_count: number;
  review_due_count: number;
  grade_distribution: { grade: number; count: number }[];
  violation_type_distribution: { type: number; count: number }[];
}

export interface BlacklistComplianceCheckResult {
  passed: boolean;
  check_type: number;
  failed_reasons: string[];
  risk_points: string[];
  suggestions: string[];
}

export interface BlacklistGradeConfigVO {
  grade: number;
  grade_text: string;
  default_duration_days?: number;
  review_cycle_days: number;
  restrictions: BusinessRestrictionConfig[];
  release_condition: ReleaseCondition;
  allow_manual_remove: boolean;
  allow_extend: boolean;
  max_extend_days?: number;
}
