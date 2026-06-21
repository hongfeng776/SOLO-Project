import { request, PaginationResult } from '@/utils/request';

export interface MessageTemplateItem {
  id: number;
  templateName: string;
  templateCode: string;
  scene: string;
  notificationType: string;
  recipientType: string;
  pushChannel: string;
  title: string;
  content: string;
  templateStatus: string;
  weight: number;
  successRate?: number;
  sendCount?: number;
  successCount?: number;
  version: number;
  createdBy?: number;
  createdByName?: string;
  updatedBy?: number;
  updatedByName?: string;
  activatedAt?: string;
  deactivatedAt?: string;
  lastTestedAt?: string;
  isComplianceChecked: boolean;
  complianceIssues?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplateLogItem {
  id: number;
  templateId: number;
  templateName?: string;
  action: string;
  changedFields?: string;
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
  statusBefore?: string;
  statusAfter?: string;
  weightBefore?: number;
  weightAfter?: number;
  created_at: string;
}

export interface TemplateValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  violationKeywords: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  message: string;
}

export interface BatchTemplateResult {
  total: number;
  success: number;
  failed: number;
  errors: { templateId: number; templateName: string; message: string }[];
}

export interface TestTemplateResult {
  success: boolean;
  message: string;
  preview: string;
}

export const getMessageTemplateListApi = (params: any): Promise<PaginationResult<MessageTemplateItem>> => {
  return request.get<PaginationResult<MessageTemplateItem>>('/message-templates', { params });
};

export const getMessageTemplateDetailApi = (id: number): Promise<MessageTemplateItem> => {
  return request.get<MessageTemplateItem>(`/message-templates/${id}`);
};

export const getSceneConfigsApi = (): Promise<any[]> => {
  return request.get<any[]>('/message-templates/scene-configs');
};

export const getEnabledTemplatesBySceneApi = (scene: string): Promise<MessageTemplateItem[]> => {
  return request.get<MessageTemplateItem[]>(`/message-templates/enabled/scene/${scene}`);
};

export const validateTemplateApi = (data: any): Promise<TemplateValidateResult> => {
  return request.post<TemplateValidateResult>('/message-templates/validate', data);
};

export const checkDuplicateTemplateApi = (id: number | null, templateCode: string): Promise<DuplicateCheckResult> => {
  const url = id ? `/message-templates/${id}/check-duplicate` : '/message-templates/0/check-duplicate';
  return request.post<DuplicateCheckResult>(url, { templateCode });
};

export const createMessageTemplateApi = (data: any): Promise<MessageTemplateItem> => {
  return request.post<MessageTemplateItem>('/message-templates', data);
};

export const updateMessageTemplateApi = (id: number, data: any): Promise<MessageTemplateItem> => {
  return request.put<MessageTemplateItem>(`/message-templates/${id}`, data);
};

export const enableTemplateApi = (id: number, remark?: string): Promise<MessageTemplateItem> => {
  return request.put<MessageTemplateItem>(`/message-templates/${id}/enable`, { remark });
};

export const disableTemplateApi = (id: number, remark?: string): Promise<MessageTemplateItem> => {
  return request.put<MessageTemplateItem>(`/message-templates/${id}/disable`, { remark });
};

export const setTestingTemplateApi = (id: number, remark?: string): Promise<MessageTemplateItem> => {
  return request.put<MessageTemplateItem>(`/message-templates/${id}/testing`, { remark });
};

export const testTemplateApi = (id: number, testData: any): Promise<TestTemplateResult> => {
  return request.post<TestTemplateResult>(`/message-templates/${id}/test`, testData);
};

export const deleteTemplateApi = (id: number): Promise<void> => {
  return request.delete<void>(`/message-templates/${id}`);
};

export const batchEnableTemplateApi = (ids: number[]): Promise<BatchTemplateResult> => {
  return request.post<BatchTemplateResult>('/message-templates/batch/enable', { ids });
};

export const batchDisableTemplateApi = (ids: number[]): Promise<BatchTemplateResult> => {
  return request.post<BatchTemplateResult>('/message-templates/batch/disable', { ids });
};

export const batchStandardizeTemplateApi = (ids: number[]): Promise<BatchTemplateResult> => {
  return request.post<BatchTemplateResult>('/message-templates/batch/standardize', { ids });
};

export const batchAdjustWeightApi = (ids: number[], weight: number): Promise<BatchTemplateResult> => {
  return request.post<BatchTemplateResult>('/message-templates/batch/adjust-weight', { ids, weight });
};

export const getTemplateLogsApi = (params: any): Promise<PaginationResult<MessageTemplateLogItem>> => {
  return request.get<PaginationResult<MessageTemplateLogItem>>('/message-templates/change-logs/list', { params });
};

export const getTemplateLogsByTemplateIdApi = (templateId: number): Promise<PaginationResult<MessageTemplateLogItem>> => {
  return request.get<PaginationResult<MessageTemplateLogItem>>(`/message-templates/${templateId}/change-logs`);
};
