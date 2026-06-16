import { request, PaginationResult } from '@/utils/request';
import { OnboardStatus } from '@/constants/recruitment';

export interface OnboardItem {
  id: number;
  resumeId: number;
  jobId: number;
  offerSalary?: string;
  offerTime?: string;
  expectOnboardDate?: string;
  actualOnboardDate?: string;
  department?: string;
  position?: string;
  probationPeriod?: number;
  status: OnboardStatus;
  contractSigned?: boolean;
  materialsComplete?: boolean;
  remark?: string;
  resume?: any;
  job?: any;
}

export const getOnboardListApi = (params: any): Promise<PaginationResult<OnboardItem>> => {
  return request.get<PaginationResult<OnboardItem>>('/onboards', { params });
};

export const getOnboardDetailApi = (id: number): Promise<OnboardItem> => {
  return request.get<OnboardItem>(`/onboards/${id}`);
};

export const createOnboardApi = (data: Partial<OnboardItem>): Promise<OnboardItem> => {
  return request.post<OnboardItem>('/onboards', data);
};

export const updateOnboardApi = (id: number, data: Partial<OnboardItem>): Promise<any> => {
  return request.put<any>(`/onboards/${id}`, data);
};

export const deleteOnboardApi = (id: number): Promise<any> => {
  return request.delete<any>(`/onboards/${id}`);
};

export const confirmOnboardApi = (id: number): Promise<any> => {
  return request.put<any>(`/onboards/${id}/confirm`);
};

export const markOnboardedApi = (id: number): Promise<any> => {
  return request.put<any>(`/onboards/${id}/onboarded`);
};

export const cancelOnboardApi = (id: number): Promise<any> => {
  return request.put<any>(`/onboards/${id}/cancel`);
};
