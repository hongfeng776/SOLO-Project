import { request, PaginationResult } from '@/utils/request';
import { InterviewStage, InterviewResult } from '@/constants/recruitment';

export interface InterviewItem {
  id: number;
  resumeId: number;
  jobId: number;
  stage: InterviewStage;
  interviewer?: string;
  interviewTime?: string;
  endTime?: string;
  location?: string;
  type?: string;
  result: InterviewResult;
  score?: number;
  evaluation?: string;
  feedback?: string;
  nextStage?: string;
  nextTime?: string;
  remark?: string;
  resume?: any;
  job?: any;
}

export const getInterviewListApi = (params: any): Promise<PaginationResult<InterviewItem>> => {
  return request.get<PaginationResult<InterviewItem>>('/interviews', { params });
};

export const getInterviewDetailApi = (id: number): Promise<InterviewItem> => {
  return request.get<InterviewItem>(`/interviews/${id}`);
};

export const createInterviewApi = (data: Partial<InterviewItem>): Promise<InterviewItem> => {
  return request.post<InterviewItem>('/interviews', data);
};

export const updateInterviewApi = (id: number, data: Partial<InterviewItem>): Promise<any> => {
  return request.put<any>(`/interviews/${id}`, data);
};

export const deleteInterviewApi = (id: number): Promise<any> => {
  return request.delete<any>(`/interviews/${id}`);
};

export const batchDeleteInterviewApi = (ids: number[]): Promise<any> => {
  return request.post<any>('/interviews/batch-remove', { ids });
};
