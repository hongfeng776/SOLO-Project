import { request, PaginationResult } from '@/utils/request';
import { ResumeStatus, Gender, Education } from '@/constants/recruitment';

export interface ResumeItem {
  id: number;
  jobId: number;
  name: string;
  gender?: Gender;
  age?: number;
  phone: string;
  email?: string;
  education?: Education;
  school?: string;
  major?: string;
  experience?: number;
  currentCompany?: string;
  currentPosition?: string;
  expectedSalary?: string;
  city?: string;
  resumeFile?: string;
  selfEvaluation?: string;
  status: ResumeStatus;
  source?: string;
  remark?: string;
  job?: any;
}

export const getResumeListApi = (params: any): Promise<PaginationResult<ResumeItem>> => {
  return request.get<PaginationResult<ResumeItem>>('/resumes', { params });
};

export const getResumeDetailApi = (id: number): Promise<ResumeItem> => {
  return request.get<ResumeItem>(`/resumes/${id}`);
};

export const createResumeApi = (data: Partial<ResumeItem>): Promise<ResumeItem> => {
  return request.post<ResumeItem>('/resumes', data);
};

export const updateResumeApi = (id: number, data: Partial<ResumeItem>): Promise<any> => {
  return request.put<any>(`/resumes/${id}`, data);
};

export const deleteResumeApi = (id: number): Promise<any> => {
  return request.delete<any>(`/resumes/${id}`);
};

export const batchDeleteResumeApi = (ids: number[]): Promise<any> => {
  return request.post<any>('/resumes/batch-remove', { ids });
};

export const updateResumeStatusApi = (id: number, status: ResumeStatus): Promise<any> => {
  return request.put<any>(`/resumes/${id}/status`, { status });
};
