import { request, PaginationResult } from '@/utils/request';
import { JobStatus } from '@/constants/recruitment';

export interface JobItem {
  id: number;
  companyId: number;
  title: string;
  category?: string;
  department?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryUnit?: string;
  city?: string;
  address?: string;
  experience?: string;
  education?: string;
  recruitNum?: number;
  description?: string;
  requirements?: string;
  benefits?: string;
  status: JobStatus;
  rejectReason?: string;
  submitTime?: string;
  auditTime?: string;
  auditUserId?: number;
  auditUserName?: string;
  publishTime?: string;
  deadline?: string;
  creatorId?: number;
  creatorName?: string;
  sort: number;
  matchWeight?: number;
  isMajorChange?: boolean;
  pendingChanges?: string;
  changeOperatorId?: number;
  changeOperatorName?: string;
  changeSubmitTime?: string;
  abnormalFlag?: boolean;
  abnormalReason?: string;
  version?: number;
  lastEditTime?: string;
  lastEditorId?: number;
  lastEditorName?: string;
  company?: any;
  operationLogs?: OperationLogItem[];
}

export interface EditCheckResult {
  canEdit: boolean;
  reason?: string;
  editableFields: string[];
  isMajorChange?: boolean;
}

export interface VersionDiff {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
  changed: boolean;
}

export interface BatchEditFilter {
  category?: string;
  publishTimeStart?: string;
  publishTimeEnd?: string;
  status?: string;
  companyId?: number;
}

export interface OperationLogItem {
  id: number;
  jobId: number;
  action: string;
  actionLabel: string;
  fromStatus?: string;
  toStatus?: string;
  operatorId?: number;
  operatorName?: string;
  remark?: string;
  changedFields?: string;
  oldValues?: string;
  newValues?: string;
  ip?: string;
  created_at: string;
}

export interface ValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PreCheckResult {
  passed: boolean;
  failedItems: { key: string; label: string; reason?: string }[];
}

export interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: { jobId?: number; title?: string; message: string }[];
}

export const getJobListApi = (params: any): Promise<PaginationResult<JobItem>> => {
  return request.get<PaginationResult<JobItem>>('/jobs', { params });
};

export const getJobDetailApi = (id: number): Promise<JobItem> => {
  return request.get<JobItem>(`/jobs/${id}`);
};

export const createJobApi = (data: Partial<JobItem>): Promise<JobItem> => {
  return request.post<JobItem>('/jobs', data);
};

export const updateJobApi = (id: number, data: Partial<JobItem>): Promise<any> => {
  return request.put<any>(`/jobs/${id}`, data);
};

export const deleteJobApi = (id: number): Promise<any> => {
  return request.delete<any>(`/jobs/${id}`);
};

export const batchDeleteJobApi = (ids: number[]): Promise<any> => {
  return request.post<any>('/jobs/batch-remove', { ids });
};

export const submitJobAuditApi = (id: number): Promise<any> => {
  return request.put<any>(`/jobs/${id}/submit-audit`);
};

export const approveJobApi = (id: number, remark?: string): Promise<any> => {
  return request.put<any>(`/jobs/${id}/approve`, { remark });
};

export const rejectJobApi = (id: number, rejectReason: string): Promise<any> => {
  return request.put<any>(`/jobs/${id}/reject`, { rejectReason });
};

export const publishJobApi = (id: number): Promise<any> => {
  return request.put<any>(`/jobs/${id}/publish`);
};

export const closeJobApi = (id: number): Promise<any> => {
  return request.put<any>(`/jobs/${id}/close`);
};

export const batchCreateJobApi = (jobs: Partial<JobItem>[]): Promise<BatchResult> => {
  return request.post<BatchResult>('/jobs/batch-create', { jobs });
};

export const batchSubmitJobAuditApi = (ids: number[]): Promise<BatchResult> => {
  return request.post<BatchResult>('/jobs/batch-submit-audit', { ids });
};

export const batchApproveJobApi = (ids: number[], remark?: string): Promise<BatchResult> => {
  return request.post<BatchResult>('/jobs/batch-approve', { ids, remark });
};

export const getJobOperationLogsApi = (id: number): Promise<OperationLogItem[]> => {
  return request.get<OperationLogItem[]>(`/jobs/${id}/operation-logs`);
};

export const validateJobForSubmitApi = (id: number): Promise<ValidateResult> => {
  return request.get<ValidateResult>(`/jobs/${id}/validate-submit`);
};

export const getJobPreCheckInfoApi = (companyId: number): Promise<PreCheckResult> => {
  return request.get<PreCheckResult>(`/jobs/pre-check/${companyId}`);
};

export const getBatchFillConfigApi = (category: string, department?: string): Promise<any> => {
  return request.get<any>('/jobs/batch-fill/config', { params: { category, department } });
};

export const checkJobEditPermissionApi = (id: number): Promise<EditCheckResult> => {
  return request.get<EditCheckResult>(`/jobs/${id}/edit-permission`);
};

export const updateJobFullApi = (id: number, data: Partial<JobItem>): Promise<any> => {
  return request.put<any>(`/jobs/${id}/update-job`, data);
};

export const approveJobChangeApi = (id: number, remark?: string): Promise<any> => {
  return request.put<any>(`/jobs/${id}/approve-change`, { remark });
};

export const rejectJobChangeApi = (id: number, rejectReason: string): Promise<any> => {
  return request.put<any>(`/jobs/${id}/reject-change`, { rejectReason });
};

export const cancelJobChangeApi = (id: number): Promise<any> => {
  return request.put<any>(`/jobs/${id}/cancel-change`);
};

export const getJobVersionDiffApi = (id: number, fromVersion?: number, toVersion?: number): Promise<VersionDiff[]> => {
  return request.get<VersionDiff[]>(`/jobs/${id}/version-diff`, { params: { fromVersion, toVersion } });
};

export const getJobEditHistoryApi = (id: number): Promise<OperationLogItem[]> => {
  return request.get<OperationLogItem[]>(`/jobs/${id}/edit-history`);
};

export const batchUpdateJobApi = (ids: number[], data: Partial<JobItem>, filter?: BatchEditFilter): Promise<BatchResult> => {
  return request.post<BatchResult>('/jobs/batch-update', { ids, data, filter });
};

export const rollbackJobVersionApi = (id: number): Promise<any> => {
  return request.put<any>(`/jobs/${id}/rollback`);
};

export const calculateMatchWeightApi = (data: Partial<JobItem>): Promise<{ matchWeight: number }> => {
  return request.post<{ matchWeight: number }>('/jobs/calculate-match-weight', data);
};

export const validateIndustryNormApi = (data: Partial<JobItem>, category?: string): Promise<ValidateResult> => {
  return request.post<ValidateResult>('/jobs/validate-industry-norm', { data, category });
};
