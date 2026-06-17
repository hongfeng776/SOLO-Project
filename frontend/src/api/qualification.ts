import { request, PaginationResult } from '@/utils/request';

export interface QualificationItem {
  id: number;
  companyId?: number;
  companyName: string;
  unifiedCreditCode: string;
  registeredAddress: string;
  legalPerson: string;
  legalPersonIdCard?: string;
  businessStatus: string;
  industryCategory: string;
  businessScope?: string;
  registeredCapital?: string;
  establishedDate?: string;
  businessLicenseNo?: string;
  businessLicenseStart?: string;
  businessLicenseEnd?: string;
  businessLicenseImage?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  auditStatus: string;
  auditRemark?: string;
  rejectReason?: string;
  auditUserId?: number;
  auditTime?: string;
  creatorId?: number;
  creatorName?: string;
  isRealNameVerified: boolean;
  remark?: string;
  auditLogs?: AuditLogItem[];
  created_at?: string;
  updated_at?: string;
}

export interface AuditLogItem {
  id: number;
  qualificationId: number;
  action: string;
  fromStatus: string;
  toStatus: string;
  operatorId?: number;
  operatorName?: string;
  remark?: string;
  created_at: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingRecords: any[];
  isRecentDuplicate: boolean;
}

export interface BatchImportResult {
  total: number;
  added: number;
  updated: number;
  invalid: number;
  errors: { row: number; field: string; message: string }[];
}

export interface ValidateResult {
  valid: boolean;
  errors: string[];
}

export interface CreditCodeValidateResult {
  valid: boolean;
  message: string;
}

export const getQualificationListApi = (params: any): Promise<PaginationResult<QualificationItem>> => {
  return request.get<PaginationResult<QualificationItem>>('/qualifications', { params });
};

export const getQualificationDetailApi = (id: number): Promise<QualificationItem> => {
  return request.get<QualificationItem>(`/qualifications/${id}`);
};

export const createQualificationApi = (data: Partial<QualificationItem>): Promise<QualificationItem> => {
  return request.post<QualificationItem>('/qualifications', data);
};

export const updateQualificationApi = (id: number, data: Partial<QualificationItem>): Promise<any> => {
  return request.put<any>(`/qualifications/${id}`, data);
};

export const deleteQualificationApi = (id: number): Promise<any> => {
  return request.delete<any>(`/qualifications/${id}`);
};

export const batchDeleteQualificationApi = (ids: number[]): Promise<any> => {
  return request.post<any>('/qualifications/batch-remove', { ids });
};

export const approveQualificationApi = (id: number, auditRemark: string): Promise<any> => {
  return request.put<any>(`/qualifications/${id}/approve`, { auditRemark });
};

export const rejectQualificationApi = (id: number, rejectReason: string): Promise<any> => {
  return request.put<any>(`/qualifications/${id}/reject`, { rejectReason });
};

export const invalidateQualificationApi = (id: number): Promise<any> => {
  return request.put<any>(`/qualifications/${id}/invalidate`);
};

export const batchImportQualificationApi = (dataList: any[]): Promise<BatchImportResult> => {
  return request.post<BatchImportResult>('/qualifications/batch-import', { dataList });
};

export const getQualificationAuditLogsApi = (id: number): Promise<AuditLogItem[]> => {
  return request.get<AuditLogItem[]>(`/qualifications/${id}/audit-logs`);
};

export const checkQualificationDuplicateApi = (unifiedCreditCode: string, excludeId?: number): Promise<DuplicateCheckResult> => {
  const params: any = { unifiedCreditCode };
  if (excludeId) params.excludeId = excludeId;
  return request.get<DuplicateCheckResult>('/qualifications/check/duplicate', { params });
};

export const validateQualificationForSubmitApi = (data: any): Promise<ValidateResult> => {
  return request.post<ValidateResult>('/qualifications/validate', data);
};

export const validateCreditCodeApi = (code: string): Promise<CreditCodeValidateResult> => {
  return request.get<CreditCodeValidateResult>(`/qualifications/validate/credit-code/${code}`);
};
