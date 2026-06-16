import { request, PaginationResult } from '@/utils/request';
import { JobStatus } from '@/constants/recruitment';

export interface JobItem {
  id: number;
  companyId: number;
  title: string;
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
  publishTime?: string;
  deadline?: string;
  sort: number;
  company?: any;
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

export const publishJobApi = (id: number): Promise<any> => {
  return request.put<any>(`/jobs/${id}/publish`);
};

export const closeJobApi = (id: number): Promise<any> => {
  return request.put<any>(`/jobs/${id}/close`);
};
