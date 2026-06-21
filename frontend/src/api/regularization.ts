import { request, PaginationResult } from '@/utils/request';

export enum RegularizationStatus {
  PENDING_APPLY = 'pending_apply',
  APPROVING = 'approving',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const RegularizationStatusLabel: Record<RegularizationStatus, string> = {
  [RegularizationStatus.PENDING_APPLY]: '待申请',
  [RegularizationStatus.APPROVING]: '审批中',
  [RegularizationStatus.APPROVED]: '转正通过',
  [RegularizationStatus.REJECTED]: '转正驳回',
};

export const RegularizationStatusType: Record<RegularizationStatus, string> = {
  [RegularizationStatus.PENDING_APPLY]: 'info',
  [RegularizationStatus.APPROVING]: 'primary',
  [RegularizationStatus.APPROVED]: 'success',
  [RegularizationStatus.REJECTED]: 'danger',
};

export const REGULARIZATION_STATUS_OPTIONS = Object.entries(RegularizationStatusLabel).map(
  ([value, label]) => ({ label, value })
);

export enum ApprovalNodeType {
  DEPT_HEAD = 'DEPT_HEAD',
  HR = 'HR',
  HR_DIRECTOR = 'HR_DIRECTOR',
  GENERAL_MANAGER = 'GENERAL_MANAGER',
}

export const ApprovalNodeTypeLabel: Record<ApprovalNodeType, string> = {
  [ApprovalNodeType.DEPT_HEAD]: '部门负责人',
  [ApprovalNodeType.HR]: 'HR专员',
  [ApprovalNodeType.HR_DIRECTOR]: 'HR总监',
  [ApprovalNodeType.GENERAL_MANAGER]: '总经理',
};

export enum RegularizationOperationAction {
  CREATE = 'create',
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  RESUBMIT = 'resubmit',
  WITHDRAW = 'withdraw',
  BATCH_APPLY = 'batch_apply',
  BATCH_APPROVE = 'batch_approve',
  BATCH_FILTER = 'batch_filter',
  SYNC_PENDING = 'sync_pending',
}

export const RegularizationOperationActionLabel: Record<RegularizationOperationAction, string> = {
  [RegularizationOperationAction.CREATE]: '创建申请',
  [RegularizationOperationAction.SUBMIT]: '提交申请',
  [RegularizationOperationAction.APPROVE]: '审批通过',
  [RegularizationOperationAction.REJECT]: '审批驳回',
  [RegularizationOperationAction.RESUBMIT]: '重新提交',
  [RegularizationOperationAction.WITHDRAW]: '撤回申请',
  [RegularizationOperationAction.BATCH_APPLY]: '批量发起申请',
  [RegularizationOperationAction.BATCH_APPROVE]: '批量审批通过',
  [RegularizationOperationAction.BATCH_FILTER]: '批量筛选到期人员',
  [RegularizationOperationAction.SYNC_PENDING]: '同步待申请人员',
};

export const REGULARIZATION_LOCKED_STATUSES: RegularizationStatus[] = [
  RegularizationStatus.APPROVED,
];

export const EXPIRING_SOON_DAYS = 7;

export interface RegularizationAssessmentIndicator {
  id?: number;
  regularizationId?: number;
  indicatorName: string;
  indicatorWeight: number;
  indicatorDesc?: string;
  targetValue?: string;
  actualValue?: string;
  score?: number;
  evaluatorId?: number;
  evaluatorName?: string;
  evaluationTime?: string;
}

export interface RegularizationApprovalNode {
  id?: number;
  regularizationId?: number;
  nodeType: ApprovalNodeType | string;
  nodeName?: string;
  approverId?: number;
  approverName?: string;
  approverRole?: string;
  status: 'pending' | 'approved' | 'rejected' | 'current' | 'skipped';
  comment?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt?: string;
  attachments?: string[];
}

export interface RegularizationOperationLog {
  id: number;
  regularizationId: number;
  action: RegularizationOperationAction | string;
  operatorId: number;
  operatorName: string;
  operatorRole: string;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
  changedFields?: string[];
  remark?: string;
  ipAddress?: string;
  created_at: string;
}

export interface ComplianceIssue {
  field: string;
  label: string;
  passed: boolean;
  reason?: string;
  detail?: string;
}

export interface RegularizationItem {
  id: number;
  probationId: number;
  onboardId: number;
  resumeId: number;
  jobId: number;
  employeeNo?: string;
  employeeName?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  jobCategory?: string;
  mentor?: string;
  entryBatch?: string;
  probationStartDate?: string;
  probationEndDate?: string;
  remainingDays?: number;
  comprehensiveScore?: number;
  reviewResult?: 'passed' | 'failed' | 'pending';
  reviewScore?: number;
  reviewComment?: string;
  reviewDate?: string;
  applicationRemark?: string;
  applyTime?: string;
  finalApproveTime?: string;
  status: RegularizationStatus | string;
  currentNode?: ApprovalNodeType | string;
  currentNodeName?: string;
  currentApproverId?: number;
  currentApproverName?: string;
  complianceChecked?: boolean;
  complianceIssues?: ComplianceIssue[];
  salaryBefore?: number | string;
  salaryAfter?: number | string;
  salaryAdjustPercent?: number;
  hrOperatorId?: number;
  hrOperatorName?: string;
  recruitmentHrId?: number;
  recruitmentHrName?: string;
  recruitmentMatchLevel?: 'A' | 'B' | 'C' | 'D';
  attachments?: string[];
  assessments?: RegularizationAssessmentIndicator[];
  approvalNodes?: RegularizationApprovalNode[];
  operationLogs?: RegularizationOperationLog[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface RegularizationListParams {
  page?: number;
  pageSize?: number;
  name?: string;
  employeeNo?: string;
  department?: string;
  position?: string;
  entryBatch?: string;
  status?: RegularizationStatus | string;
  applyTimeStart?: string;
  applyTimeEnd?: string;
  hrOperatorId?: number;
  [key: string]: any;
}

export interface RegularizationCreateData {
  probationId: number;
  applicationRemark?: string;
  attachments?: string[];
  [key: string]: any;
}

export interface RegularizationApproveData {
  comment?: string;
  attachments?: string[];
}

export interface RegularizationRejectData {
  reason: string;
  attachments?: string[];
}

export interface RegularizationResubmitData {
  applicationRemark?: string;
  attachments?: string[];
}

export interface BatchFilterParams {
  entryBatches?: string[];
  jobCategories?: string[];
  hasEnoughIndicators?: boolean;
  hasScored?: boolean;
  minScore?: number;
}

export interface BatchApplyData {
  ids: number[];
  applicationRemark?: string;
}

export interface BatchApproveData {
  ids: number[];
  comment: string;
}

export interface IBatchResult<T = any> {
  success: number;
  failed: number;
  total: number;
  successList?: T[];
  successIds?: number[];
  failedList?: Array<{
    id?: number;
    index?: number;
    data?: any;
    reason: string;
  }>;
}

export interface RegularizationStatsItem {
  name: string;
  total: number;
  passed: number;
  rejected: number;
  approving: number;
  passRate: number;
}

export interface RegularizationStatsData {
  overall: {
    total: number;
    passed: number;
    rejected: number;
    approving: number;
    passRate: number;
  };
  byDepartment: RegularizationStatsItem[];
  byPosition: RegularizationStatsItem[];
  byEntryBatch: RegularizationStatsItem[];
  byRecruitmentHr: (RegularizationStatsItem & { hrId?: number })[];
  recruitmentMatchDistribution: Array<{
    level: 'A' | 'B' | 'C' | 'D';
    count: number;
    percent: number;
  }>;
}

export const getRegularizationListApi = (
  params: RegularizationListParams
): Promise<PaginationResult<RegularizationItem>> => {
  return request.get<PaginationResult<RegularizationItem>>('/regularizations', { params });
};

export const getRegularizationFullDetailApi = (id: number): Promise<RegularizationItem> => {
  return request.get<RegularizationItem>(`/regularizations/${id}`);
};

export const createRegularizationApi = (data: RegularizationCreateData): Promise<RegularizationItem> => {
  return request.post<RegularizationItem>('/regularizations', data);
};

export const submitRegularizationApi = (id: number): Promise<RegularizationItem> => {
  return request.post<RegularizationItem>(`/regularizations/${id}/submit`);
};

export const approveRegularizationApi = (
  id: number,
  data: RegularizationApproveData
): Promise<RegularizationItem> => {
  return request.post<RegularizationItem>(`/regularizations/${id}/approve`, data);
};

export const rejectRegularizationApi = (
  id: number,
  data: RegularizationRejectData
): Promise<RegularizationItem> => {
  return request.post<RegularizationItem>(`/regularizations/${id}/reject`, data);
};

export const resubmitRegularizationApi = (
  id: number,
  data: RegularizationResubmitData
): Promise<RegularizationItem> => {
  return request.post<RegularizationItem>(`/regularizations/${id}/resubmit`, data);
};

export const withdrawRegularizationApi = (id: number): Promise<RegularizationItem> => {
  return request.post<RegularizationItem>(`/regularizations/${id}/withdraw`);
};

export const batchFilterRegularizationApi = (
  params: BatchFilterParams
): Promise<RegularizationItem[]> => {
  return request.post<RegularizationItem[]>('/regularizations/batch-filter', params);
};

export const batchApplyRegularizationApi = (data: BatchApplyData): Promise<IBatchResult<RegularizationItem>> => {
  return request.post<IBatchResult<RegularizationItem>>('/regularizations/batch-apply', data);
};

export const batchApproveRegularizationApi = (data: BatchApproveData): Promise<IBatchResult<RegularizationItem>> => {
  return request.post<IBatchResult<RegularizationItem>>('/regularizations/batch-approve', data);
};

export const syncRegularizationPendingApi = (): Promise<{
  syncedCount: number;
  updatedIds: number[];
  timestamp: string;
}> => {
  return request.post<{
    syncedCount: number;
    updatedIds: number[];
    timestamp: string;
  }>('/regularizations/sync-pending');
};

export const getRegularizationStatsApi = (): Promise<RegularizationStatsData> => {
  return request.get<RegularizationStatsData>('/regularizations/stats');
};

export const getRegularizationPendingListApi = (): Promise<RegularizationItem[]> => {
  return request.get<RegularizationItem[]>('/regularizations/pending-list');
};
