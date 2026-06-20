import { request, PaginationResult } from '@/utils/request';
import { OnboardStatus, OnboardOperationAction } from '@/constants/recruitment';

export interface OnboardItem {
  id: number;
  resumeId: number;
  jobId: number;
  interviewId?: number;
  candidateConfirmed?: boolean;
  name?: string;
  gender?: string;
  age?: number;
  phone?: string;
  email?: string;
  idCard?: string;
  education?: string;
  school?: string;
  major?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  reportTo?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryBase?: number;
  salaryPerformance?: number;
  salaryBonus?: number;
  salaryUnit?: string;
  onboardDate?: string;
  workLocation?: string;
  workType?: string;
  probationSalary?: number;
  contractType?: string;
  contractTerm?: string;
  status: OnboardStatus;
  rejectReason?: string;
  auditTime?: string;
  auditUserId?: number;
  auditUserName?: string;
  auditRemark?: string;
  ledgerGenerated?: boolean;
  ledgerGenerateTime?: string;
  hrOperatorId?: number;
  hrOperatorName?: string;
  submitTime?: string;
  onboardRemark?: string;
  dataConsistencyCheck?: boolean;
  fakeInfoDetected?: boolean;
  version?: number;
  operationLogs?: OnboardOperationLogItem[];
  ledger?: any;
  resume?: any;
  job?: any;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardOperationLogItem {
  id: number;
  onboardId: number;
  action: OnboardOperationAction;
  operatorId: number;
  operatorName: string;
  operatorRole: string;
  beforeData?: Partial<OnboardItem>;
  afterData?: Partial<OnboardItem>;
  changedFields?: string[];
  remark?: string;
  ipAddress?: string;
  created_at: string;
}

export interface OnboardListParams {
  page?: number;
  pageSize?: number;
  status?: OnboardStatus;
  keyword?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  workType?: string;
  onboardDateStart?: string;
  onboardDateEnd?: string;
  submitTimeStart?: string;
  submitTimeEnd?: string;
  hrOperatorId?: number;
  [key: string]: any;
}

export interface OnboardCreateData {
  resumeId: number;
  jobId: number;
  interviewId?: number;
  candidateConfirmed?: boolean;
  name?: string;
  gender?: string;
  age?: number;
  phone?: string;
  email?: string;
  idCard?: string;
  education?: string;
  school?: string;
  major?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  reportTo?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryBase?: number;
  salaryPerformance?: number;
  salaryBonus?: number;
  salaryUnit?: string;
  onboardDate?: string;
  workLocation?: string;
  workType?: string;
  probationSalary?: number;
  contractType?: string;
  contractTerm?: string;
  onboardRemark?: string;
  [key: string]: any;
}

export interface OnboardUpdateData extends Partial<OnboardCreateData> {
  rejectReason?: string;
  auditRemark?: string;
  remark?: string;
}

export interface OnboardPrerequisiteResult {
  valid: boolean;
  resumeExists: boolean;
  jobExists: boolean;
  interviewPassed?: boolean;
  resumeStatusValid?: boolean;
  jobStatusValid?: boolean;
  alreadyOnboarded?: boolean;
  messages?: string[];
}

export interface OnboardSalaryValidationResult {
  valid: boolean;
  jobLevel: string;
  expectedMin: number;
  expectedMax: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryBase?: number;
  inRange: boolean;
  belowMin: boolean;
  aboveMax: boolean;
  deviation?: number;
  warning?: string;
  message?: string;
}

export interface BatchCreateResult {
  success: number;
  failed: number;
  total: number;
  successList?: OnboardItem[];
  failedList?: Array<{
    index: number;
    data: any;
    reason: string;
  }>;
  normalizeBy?: string;
}

export interface BatchOperationResult {
  success: number;
  failed: number;
  total: number;
  successIds?: number[];
  failedIds?: Array<{
    id: number;
    reason: string;
  }>;
}

export const getOnboardList = (params: OnboardListParams): Promise<PaginationResult<OnboardItem>> => {
  return request.get<PaginationResult<OnboardItem>>('/onboards', { params });
};

export const getOnboardDetailApi = (id: number): Promise<OnboardItem> => {
  return request.get<OnboardItem>(`/onboards/${id}`);
};

export const getOnboardOperationLogsApi = (id: number): Promise<OnboardOperationLogItem[]> => {
  return request.get<OnboardOperationLogItem[]>(`/onboards/${id}/operation-logs`);
};

export const checkOnboardPrerequisitesApi = (resumeId: number): Promise<OnboardPrerequisiteResult> => {
  return request.get<OnboardPrerequisiteResult>(`/onboards/prerequisites/${resumeId}`);
};

export const validateOnboardSalaryApi = (
  jobLevel: string,
  salaryMin: number,
  salaryMax: number
): Promise<OnboardSalaryValidationResult> => {
  return request.get<OnboardSalaryValidationResult>('/onboards/validate-salary', {
    params: { jobLevel, salaryMin, salaryMax },
  });
};

export const createOnboardApi = (data: OnboardCreateData): Promise<OnboardItem> => {
  return request.post<OnboardItem>('/onboards', data);
};

export const updateOnboardApi = (id: number, data: OnboardUpdateData): Promise<OnboardItem> => {
  return request.put<OnboardItem>(`/onboards/${id}`, data);
};

export const submitOnboardAuditApi = (id: number): Promise<OnboardItem> => {
  return request.put<OnboardItem>(`/onboards/${id}/submit`);
};

export const approveOnboardApi = (id: number, remark?: string): Promise<OnboardItem> => {
  return request.put<OnboardItem>(`/onboards/${id}/approve`, { remark });
};

export const rejectOnboardApi = (id: number, rejectReason: string, remark?: string): Promise<OnboardItem> => {
  return request.put<OnboardItem>(`/onboards/${id}/reject`, { rejectReason, remark });
};

export const resubmitOnboardApi = (id: number, data: OnboardUpdateData): Promise<OnboardItem> => {
  return request.put<OnboardItem>(`/onboards/${id}/resubmit`, data);
};

export const markOnboardedApi = (id: number, actualOnboardDate: string): Promise<OnboardItem> => {
  return request.put<OnboardItem>(`/onboards/${id}/mark-onboarded`, { actualOnboardDate });
};

export const batchCreateOnboardApi = (list: OnboardCreateData[], normalizeBy?: string): Promise<BatchCreateResult> => {
  return request.post<BatchCreateResult>('/onboards/batch', { list, normalizeBy });
};

export const batchSubmitOnboardApi = (ids: number[]): Promise<BatchOperationResult> => {
  return request.post<BatchOperationResult>('/onboards/batch-submit', { ids });
};

export const batchApproveOnboardApi = (ids: number[], remark?: string): Promise<BatchOperationResult> => {
  return request.post<BatchOperationResult>('/onboards/batch-approve', { ids, remark });
};

export const deleteOnboardApi = (id: number): Promise<any> => {
  return request.delete<any>(`/onboards/${id}`);
};
