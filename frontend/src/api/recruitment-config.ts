import { request, PaginationResult } from '@/utils/request';

export interface RecruitmentConfigItem {
  id: number;
  companyId: number;
  companyName?: string;
  displayTags: string;
  welfareTags: string;
  requirements: string;
  workTypes: string;
  jobCategories: string;
  configStatus: 'enabled' | 'disabled';
  version: number;
  createdBy?: number;
  createdByName?: string;
  updatedBy?: number;
  updatedByName?: string;
  activatedAt?: string;
  deactivatedAt?: string;
  activityLevel?: number;
  positionGapCount?: number;
  created_at: string;
  updated_at: string;
}

export interface ConfigLogItem {
  id: number;
  configId: number;
  companyId: number;
  companyName?: string;
  action: string;
  changedFields: string;
  oldValues?: string;
  newValues?: string;
  versionBefore?: number;
  versionAfter?: number;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  operationRemark?: string;
  isComplianceChecked: boolean;
  complianceIssues?: string;
  isDuplicateDetected: boolean;
  effectiveMode?: string;
  created_at: string;
}

export interface CompletenessResult {
  score: number;
  threshold: number;
  isReached: boolean;
  fieldDetails: { key: string; label: string; filled: boolean; weight: number }[];
}

export interface ConfigValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  violationTags: string[];
  falseRecruitmentTags: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  message: string;
}

export interface BatchConfigResult {
  total: number;
  success: number;
  failed: number;
  errors: { configId: number; companyName: string; message: string }[];
}

export const getRecruitmentConfigListApi = (params: any): Promise<PaginationResult<RecruitmentConfigItem>> => {
  return request.get<PaginationResult<RecruitmentConfigItem>>('/recruitment-configs', { params });
};

export const getRecruitmentConfigDetailApi = (id: number): Promise<RecruitmentConfigItem> => {
  return request.get<RecruitmentConfigItem>(`/recruitment-configs/${id}`);
};

export const getConfigByCompanyIdApi = (companyId: number): Promise<RecruitmentConfigItem | null> => {
  return request.get<RecruitmentConfigItem | null>(`/recruitment-configs/company/${companyId}`);
};

export const checkInfoCompletenessApi = (companyId: number): Promise<CompletenessResult> => {
  return request.get<CompletenessResult>(`/recruitment-configs/company/${companyId}/completeness`);
};

export const getMatchingTagsApi = (industry: string, jobCategory: string): Promise<{ welfareTags: string[]; displayTags: string[] }> => {
  return request.get<{ welfareTags: string[]; displayTags: string[] }>('/recruitment-configs/matching/tags', {
    params: { industry, jobCategory },
  });
};

export const getMatchingWelfareByIndustryApi = (industry: string): Promise<{ welfareTags: string[] }> => {
  return request.get<{ welfareTags: string[] }>('/recruitment-configs/matching/welfare-by-industry', {
    params: { industry },
  });
};

export const validateConfigApi = (data: any, industry: string): Promise<ConfigValidateResult> => {
  return request.post<ConfigValidateResult>('/recruitment-configs/validate', data, { params: { industry } });
};

export const checkDuplicateConfigApi = (id: number, data: any): Promise<DuplicateCheckResult> => {
  return request.post<DuplicateCheckResult>(`/recruitment-configs/${id}/check-duplicate`, data);
};

export const createRecruitmentConfigApi = (companyId: number, data: any): Promise<RecruitmentConfigItem> => {
  return request.post<RecruitmentConfigItem>(`/recruitment-configs/company/${companyId}`, data);
};

export const updateRecruitmentConfigApi = (id: number, data: any): Promise<RecruitmentConfigItem> => {
  return request.put<RecruitmentConfigItem>(`/recruitment-configs/${id}`, data);
};

export const enableConfigApi = (id: number, remark?: string): Promise<RecruitmentConfigItem> => {
  return request.put<RecruitmentConfigItem>(`/recruitment-configs/${id}/enable`, { remark });
};

export const disableConfigApi = (id: number, remark?: string): Promise<RecruitmentConfigItem> => {
  return request.put<RecruitmentConfigItem>(`/recruitment-configs/${id}/disable`, { remark });
};

export const batchEnableConfigApi = (ids: number[]): Promise<BatchConfigResult> => {
  return request.post<BatchConfigResult>('/recruitment-configs/batch/enable', { ids });
};

export const batchDisableConfigApi = (ids: number[]): Promise<BatchConfigResult> => {
  return request.post<BatchConfigResult>('/recruitment-configs/batch/disable', { ids });
};

export const batchReplaceWelfareApi = (ids: number[], oldTags: string[], newTags: string[]): Promise<BatchConfigResult> => {
  return request.post<BatchConfigResult>('/recruitment-configs/batch/replace-welfare', { ids, oldTags, newTags });
};

export const getConfigLogsApi = (params: any): Promise<PaginationResult<ConfigLogItem>> => {
  return request.get<PaginationResult<ConfigLogItem>>('/recruitment-configs/change-logs/list', { params });
};

export const getConfigLogsByConfigIdApi = (configId: number): Promise<PaginationResult<ConfigLogItem>> => {
  return request.get<PaginationResult<ConfigLogItem>>(`/recruitment-configs/${configId}/change-logs`);
};
