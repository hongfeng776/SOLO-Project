import { request, PaginationResult } from '@/utils/request';

export interface CompanyItem {
  id: number;
  name: string;
  shortName?: string;
  logo?: string;
  industry?: string;
  scale?: string;
  nature?: string;
  address?: string;
  officeAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  recruitStatus: string;
  jobCategories?: string;
  qualificationId?: number;
  isQualificationApproved: boolean;
  pendingChanges?: string;
  changeAuditStatus?: 'pending' | 'approved' | 'rejected';
  changeOperatorId?: number;
  changeOperatorName?: string;
  status: number;
  sort: number;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyChangeLogItem {
  id: number;
  companyId: number;
  action: string;
  changedFields: string;
  oldValues?: string;
  newValues?: string;
  operatorId?: number;
  operatorName?: string;
  needAudit: boolean;
  auditStatus?: string;
  auditorId?: number;
  auditorName?: string;
  auditRemark?: string;
  auditTime?: string;
  effectiveMode?: string;
  remark?: string;
  created_at: string;
}

export interface ValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BatchUpdateResult {
  total: number;
  success: number;
  failed: number;
  needAudit: number;
  errors: { companyId: number; companyName: string; message: string }[];
}

export const getCompanyListApi = (params: any): Promise<PaginationResult<CompanyItem>> => {
  return request.get<PaginationResult<CompanyItem>>('/companies', { params });
};

export const getCompanyDetailApi = (id: number): Promise<{ company: CompanyItem; changeLogs: CompanyChangeLogItem[] }> => {
  return request.get<{ company: CompanyItem; changeLogs: CompanyChangeLogItem[] }>(`/companies/${id}`);
};

export const checkCompanyQualificationApi = (id: number): Promise<{ approved: boolean }> => {
  return request.get<{ approved: boolean }>(`/companies/${id}/check-qualification`);
};

export const getMatchingJobCategoriesApi = (industry: string): Promise<{ categories: string[] }> => {
  return request.get<{ categories: string[] }>('/companies/matching/job-categories', { params: { industry } });
};

export const getMatchingRecruitRangeApi = (scale: string): Promise<{ range: string[] }> => {
  return request.get<{ range: string[] }>('/companies/matching/recruit-range', { params: { scale } });
};

export const validateCompanyDataApi = (data: any, id?: number): Promise<ValidateResult> => {
  if (id) {
    return request.post<ValidateResult>(`/companies/${id}/validate`, data);
  }
  return request.post<ValidateResult>('/companies/validate', data);
};

export const createCompanyApi = (data: Partial<CompanyItem>): Promise<CompanyItem> => {
  return request.post<CompanyItem>('/companies', data);
};

export const updateCompanyApi = (id: number, data: Partial<CompanyItem>): Promise<{ needAudit: boolean; company: CompanyItem }> => {
  return request.put<{ needAudit: boolean; company: CompanyItem }>(`/companies/${id}`, data);
};

export const approveCompanyChangeApi = (id: number, auditRemark: string): Promise<CompanyItem> => {
  return request.put<CompanyItem>(`/companies/${id}/approve-change`, { auditRemark });
};

export const rejectCompanyChangeApi = (id: number, rejectReason: string): Promise<any> => {
  return request.put<any>(`/companies/${id}/reject-change`, { rejectReason });
};

export const batchUpdateCompanyApi = (ids: number[], updateData: any, effectiveMode?: 'global' | 'backend_only'): Promise<BatchUpdateResult> => {
  return request.post<BatchUpdateResult>('/companies/batch-update', { ids, updateData, effectiveMode });
};

export const getCompanyChangeLogsApi = (params: any): Promise<PaginationResult<CompanyChangeLogItem>> => {
  return request.get<PaginationResult<CompanyChangeLogItem>>('/companies/change-logs/list', { params });
};

export const deleteCompanyApi = (id: number): Promise<any> => {
  return request.delete<any>(`/companies/${id}`);
};

export const batchDeleteCompanyApi = (ids: number[]): Promise<any> => {
  return request.post<any>('/companies/batch-remove', { ids });
};
