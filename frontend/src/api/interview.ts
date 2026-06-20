import { request, PaginationResult } from '@/utils/request';
import {
  InterviewStage,
  InterviewResult,
  InterviewSessionStatus,
  InterviewCancelReasonType,
  InterviewBatchSortType,
} from '@/constants/recruitment';

export interface InterviewItem {
  id: number;
  resumeId: number;
  jobId: number;
  stage: InterviewStage;
  sessionStatus: InterviewSessionStatus;
  interviewer?: string;
  interviewerId?: number;
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
  appointTime?: string;
  appointOperatorName?: string;
  confirmTime?: string;
  completeTime?: string;
  cancelTime?: string;
  isLocked?: boolean;
  sortWeight?: number;
  matchScoreSnapshot?: number;
  jobUrgencySnapshot?: number;
  resume?: any;
  job?: any;
  cancelRecord?: any;
  operationLogs?: any[];
  messages?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface InterviewStats {
  total: number;
  successCount: number;
  cancelledCount: number;
  pendingCount: number;
  successRate: number;
}

export interface CancelInterviewParams {
  reasonType: InterviewCancelReasonType;
  reasonDetail: string;
  cancelledByCandidate?: boolean;
}

export interface BatchAppointItem {
  resumeId: number;
  jobId: number;
  stage: InterviewStage;
  interviewer: string;
  interviewerId?: number;
  interviewTime: string;
  endTime: string;
  location?: string;
  type?: string;
  remark?: string;
}

export interface TimeConflictCheck {
  conflict: boolean;
  conflicts: Array<{
    id: number;
    interviewTime: string;
    endTime: string;
  }>;
}

export const getInterviewListApi = (params: any): Promise<PaginationResult<InterviewItem>> => {
  return request.get<PaginationResult<InterviewItem>>('/interviews', { params });
};

export const getInterviewDetailApi = (id: number): Promise<InterviewItem> => {
  return request.get<InterviewItem>(`/interviews/${id}`);
};

export const getInterviewOperationLogsApi = (id: number): Promise<any[]> => {
  return request.get<any[]>(`/interviews/${id}/logs`);
};

export const getInterviewStatsApi = (params?: any): Promise<InterviewStats> => {
  return request.get<InterviewStats>('/interviews/stats', { params });
};

export const createInterviewApi = (data: Partial<InterviewItem>): Promise<any> => {
  return request.post<any>('/interviews', data);
};

export const updateInterviewApi = (id: number, data: Partial<InterviewItem>): Promise<any> => {
  return request.put<any>(`/interviews/${id}`, data);
};

export const confirmAppointmentApi = (id: number): Promise<any> => {
  return request.put<any>(`/interviews/${id}/confirm-appointment`);
};

export const confirmByInterviewerApi = (id: number): Promise<any> => {
  return request.put<any>(`/interviews/${id}/confirm-interviewer`);
};

export const completeInterviewApi = (id: number, data: any): Promise<any> => {
  return request.put<any>(`/interviews/${id}/complete`, data);
};

export const cancelInterviewApi = (id: number, data: CancelInterviewParams): Promise<any> => {
  return request.put<any>(`/interviews/${id}/cancel`, data);
};

export const deleteInterviewApi = (id: number): Promise<any> => {
  return request.delete<any>(`/interviews/${id}`);
};

export const batchDeleteInterviewApi = (ids: number[]): Promise<any> => {
  return request.post<any>('/interviews/batch-remove', { ids });
};

export const validateTimeConflictApi = (data: {
  interviewer: string;
  interviewTime: string;
  endTime: string;
  excludeId?: number;
}): Promise<TimeConflictCheck> => {
  return request.post<TimeConflictCheck>('/interviews/validate-time-conflict', data);
};

export const batchAppointApi = (items: BatchAppointItem[]): Promise<any> => {
  return request.post<any>('/interviews/batch-appoint', { items });
};

export const batchCancelOverdueApi = (): Promise<any> => {
  return request.post<any>('/interviews/batch-cancel-overdue');
};

export const batchSortApi = (ids: number[], sortType: InterviewBatchSortType): Promise<any> => {
  return request.post<any>('/interviews/batch-sort', { ids, sortType });
};

export const validateInterviewRecordApi = (id: number, data: any): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  allowedResults: InterviewResult[];
  defaultResult?: InterviewResult;
  abnormal?: any;
  conflicts?: any[];
}> => {
  return request.post<any>(`/interviews/${id}/validate-record`, data);
};

export const batchSupplementOverdueApi = (data: {
  jobId?: number;
  interviewer?: string;
  days?: number;
  defaultResult?: InterviewResult;
  defaultScore?: number;
}): Promise<any> => {
  return request.post<any>('/interviews/batch-supplement-overdue', data);
};

export const batchUpdatePendingResultsApi = (data: {
  ids: number[];
  result: InterviewResult;
  score?: number;
  evaluation?: string;
  feedback?: string;
}): Promise<any> => {
  return request.post<any>('/interviews/batch-update-pending-results', data);
};

export const getInterviewRecordStatsApi = (jobId?: number): Promise<{
  total: number;
  completedCount: number;
  passCount: number;
  failCount: number;
  pendingDecisionCount: number;
  abnormalCount: number;
  passRate: number;
  abnormalRate: number;
}> => {
  return request.get<any>('/interviews/record-stats', { params: { jobId } });
};

export const allocateInterviewerApi = (interviewId: number, data: {
  targetInterviewerId: number;
  crossDomainConfirmed?: boolean;
}): Promise<any> => {
  return request.put<any>(`/interviews/${interviewId}/allocate-interviewer`, data);
};

export const updateInterviewerStatusApi = (data: {
  interviewerId: number;
  newStatus: string;
}): Promise<any> => {
  return request.post<any>('/interviews/interviewer-status', data);
};

export const getAvailableInterviewersApi = (params?: {
  jobCategory?: string;
  date?: string;
  domain?: string;
}): Promise<any[]> => {
  return request.get<any[]>('/interviews/available-interviewers', { params });
};

export const batchReplaceInterviewerApi = (data: {
  ids: number[];
  targetInterviewerId: number;
  crossDomainConfirmed?: boolean;
}): Promise<any> => {
  return request.post<any>('/interviews/batch-replace-interviewer', data);
};

export const batchScheduleOptimizeApi = (data: {
  interviewerId?: number;
  jobId?: number;
  optimizeBy: 'workload' | 'domain' | 'availability';
  ids?: number[];
}): Promise<any> => {
  return request.post<any>('/interviews/batch-schedule-optimize', data);
};

export const getInterviewerWorkloadApi = (interviewerId: number): Promise<any> => {
  return request.get<any>(`/interviews/interviewer-workload/${interviewerId}`);
};

export const getAllocationLogsApi = (params?: {
  interviewId?: number;
  interviewerId?: number;
  operatorId?: number;
  limit?: number;
}): Promise<any[]> => {
  return request.get<any[]>('/interviews/allocation-logs', { params });
};

export const checkWarningsApi = (): Promise<any> => {
  return request.post<any>('/interviews/check-warnings');
};

export const getWarningListApi = (params?: {
  warningStatus?: string;
  warningLevel?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}): Promise<any> => {
  return request.get<any>('/interviews/warning-list', { params });
};

export const getWarningStatsApi = (): Promise<any> => {
  return request.get<any>('/interviews/warning-stats');
};

export const handleOverdueInterviewApi = (id: number, data: {
  overdueReasonType: string;
  overdueReason: string;
  remedyPlan: string;
}): Promise<any> => {
  return request.put<any>(`/interviews/${id}/handle-overdue`, data);
};

export const batchHandleOverdueApi = (data: {
  ids: number[];
  overdueReasonType: string;
  overdueReason: string;
  remedyPlan: string;
}): Promise<any> => {
  return request.post<any>('/interviews/batch-handle-overdue', data);
};

export const batchPostponeInterviewsApi = (data: {
  ids: number[];
  postponeHours: number;
}): Promise<any> => {
  return request.post<any>('/interviews/batch-postpone-interviews', data);
};

export const dismissWarningApi = (id: number): Promise<any> => {
  return request.put<any>(`/interviews/${id}/dismiss-warning`);
};

export const markFalseAlarmApi = (id: number, data: {
  falseAlarmReason: string;
}): Promise<any> => {
  return request.put<any>(`/interviews/${id}/mark-false-alarm`, data);
};

export const getWarningLogsApi = (params?: {
  interviewId?: number;
  handlerId?: number;
  operatorId?: number;
  limit?: number;
}): Promise<any[]> => {
  return request.get<any[]>('/interviews/warning-logs', { params });
};

export const getOverdueRateStatsApi = (): Promise<any> => {
  return request.get<any>('/interviews/overdue-rate-stats');
};

export const sortWarningListApi = (data: {
  ids: number[];
  strategy: string;
}): Promise<any> => {
  return request.post<any>('/interviews/sort-warning-list', data);
};
