import { request, PaginationResult } from '@/utils/request';
import { ProbationStatus, ProbationOperationAction, type AssessmentIndicator } from '@/constants/recruitment';

export interface ProbationItem {
  id: number;
  onboardId: number;
  resumeId: number;
  jobId: number;
  employeeNo?: string;
  name?: string;
  phone?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  salaryProbation?: string;
  salaryRegular?: string;
  mentor?: string;
  onboardBatch?: string;
  status: ProbationStatus | string;
  warningTriggered?: boolean;
  warningTime?: string;
  assessmentFinalScore?: number;
  assessmentResult?: string;
  assessmentComment?: string;
  assessmentTime?: string;
  durationComplianceChecked?: boolean;
  durationComplianceResult?: string;
  assessmentStandardCheck?: boolean;
  archived?: boolean;
  probationSalaryPercent?: number;
  hrOperatorId?: number;
  hrOperatorName?: string;
  version?: number;
  assessments?: ProbationAssessmentItem[];
  operationLogs?: ProbationOperationLogItem[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ProbationAssessmentItem {
  id?: number;
  probationId: number;
  indicatorName: string;
  indicatorWeight: number;
  indicatorDesc?: string;
  targetValue?: string;
  actualValue?: string;
  score?: number;
  evaluatorId?: number;
  evaluatorName?: string;
  evaluationTime?: string;
}

export interface ProbationOperationLogItem {
  id: number;
  probationId: number;
  action: ProbationOperationAction | string;
  operatorId: number;
  operatorName: string;
  operatorRole: string;
  beforeData?: Partial<ProbationItem>;
  afterData?: Partial<ProbationItem>;
  changedFields?: string[];
  remark?: string;
  ipAddress?: string;
  created_at: string;
}

export interface IBatchResult<T = any> {
  success: number;
  failed: number;
  total: number;
  successList?: T[];
  successIds?: number[];
  failedList?: Array<{
    id?: number;
    index?: number;
    data?: any;
    reason: string;
  }>;
  normalizeBy?: string;
}

export interface ProbationPrerequisiteResult {
  valid: boolean;
  onboardExists: boolean;
  onboardAuditPassed: boolean;
  alreadyInProbation: boolean;
  jobExists?: boolean;
  resumeExists?: boolean;
  messages?: string[];
  onboardData?: Partial<ProbationItem>;
}

export interface ProbationDefaultMatchingResult {
  defaultDuration: number;
  defaultIndicators: AssessmentIndicator[];
}

export interface ProbationDurationValidationResult {
  valid: boolean;
  message: string;
  jobCategory?: string;
  recommendedDuration?: number;
  allowedRange?: { min: number; max: number };
}

export interface ProbationListParams {
  page?: number;
  pageSize?: number;
  status?: ProbationStatus | string;
  keyword?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  mentor?: string;
  onboardBatch?: string;
  startDateStart?: string;
  startDateEnd?: string;
  endDateStart?: string;
  endDateEnd?: string;
  hrOperatorId?: number;
  archived?: boolean;
  warningTriggered?: boolean;
  [key: string]: any;
}

export interface ProbationCreateData {
  onboardId: number;
  resumeId?: number;
  jobId?: number;
  startDate: string;
  endDate: string;
  duration?: number;
  salaryProbation?: string;
  salaryRegular?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  mentor?: string;
  probationSalaryPercent?: number;
  reasonAdjusted?: string;
  indicators?: AssessmentIndicator[];
  [key: string]: any;
}

export interface ProbationDurationUpdateData {
  newDuration: number;
  reason: string;
}

export interface ProbationAssessmentSubmitData {
  indicators: ProbationAssessmentItem[];
}

export interface ProbationPassFailData {
  finalScore?: number;
  comment?: string;
}

export interface ProbationExtendData {
  extendDays: number;
  reason: string;
}

export interface BatchSetAssessmentsData {
  list: Array<{
    probationId: number;
    indicators: ProbationAssessmentItem[];
  }>;
  normalizeBy?: string;
}

export interface BatchUpdateStatusData {
  ids: number[];
  action: ProbationOperationAction | string;
  params?: ProbationPassFailData | ProbationExtendData | any;
}

export interface ProbationPassRateStats {
  total: number;
  passed: number;
  failed: number;
  inProbation: number;
  passRate: number;
  failRate: number;
  byDepartment?: Array<{
    department: string;
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  }>;
  byJobLevel?: Array<{
    jobLevel: string;
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  }>;
  byMonth?: Array<{
    month: string;
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  }>;
}

export interface ProbationStatsFilters {
  department?: string;
  jobLevel?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: 'department' | 'jobLevel' | 'month';
}

export const checkProbationPrerequisitesApi = (onboardId: number): Promise<ProbationPrerequisiteResult> => {
  return request.get<ProbationPrerequisiteResult>(`/probations/prerequisites/${onboardId}`);
};

export const getProbationDefaultMatchingApi = (jobId: number): Promise<ProbationDefaultMatchingResult> => {
  return request.get<ProbationDefaultMatchingResult>(`/probations/default-matching/${jobId}`);
};

export const validateProbationDurationApi = (
  jobCategory: string,
  proposedMonths: number
): Promise<ProbationDurationValidationResult> => {
  return request.get<ProbationDurationValidationResult>('/probations/validate-duration', {
    params: { jobCategory, proposedMonths },
  });
};

export const getProbationListApi = (params: ProbationListParams): Promise<PaginationResult<ProbationItem>> => {
  return request.get<PaginationResult<ProbationItem>>('/probations', { params });
};

export const getProbationDetailApi = (id: number): Promise<ProbationItem> => {
  return request.get<ProbationItem>(`/probations/${id}`);
};

export const getProbationExpiringListApi = (days?: number): Promise<ProbationItem[]> => {
  return request.get<ProbationItem[]>('/probations/expiring-soon', {
    params: days ? { days } : {},
  });
};

export const createProbationApi = (data: ProbationCreateData): Promise<ProbationItem> => {
  return request.post<ProbationItem>('/probations', data);
};

export const updateProbationDurationApi = (
  id: number,
  data: ProbationDurationUpdateData
): Promise<ProbationItem> => {
  return request.put<ProbationItem>(`/probations/${id}/duration`, data);
};

export const setProbationAssessmentsApi = (
  id: number,
  indicators: ProbationAssessmentItem[]
): Promise<ProbationItem> => {
  return request.put<ProbationItem>(`/probations/${id}/assessments`, { indicators });
};

export const passProbationApi = (
  id: number,
  data?: ProbationPassFailData
): Promise<ProbationItem> => {
  return request.put<ProbationItem>(`/probations/${id}/pass`, data || {});
};

export const failProbationApi = (
  id: number,
  data?: ProbationPassFailData
): Promise<ProbationItem> => {
  return request.put<ProbationItem>(`/probations/${id}/fail`, data || {});
};

export const extendProbationApi = (
  id: number,
  data: ProbationExtendData
): Promise<ProbationItem> => {
  return request.put<ProbationItem>(`/probations/${id}/extend`, data);
};

export const batchSetProbationAssessmentsApi = (
  data: BatchSetAssessmentsData
): Promise<IBatchResult<ProbationItem>> => {
  return request.post<IBatchResult<ProbationItem>>('/probations/batch-assessments', data);
};

export const batchUpdateProbationStatusApi = (
  data: BatchUpdateStatusData
): Promise<IBatchResult<ProbationItem>> => {
  return request.post<IBatchResult<ProbationItem>>('/probations/batch-status', data);
};

export const syncProbationStatusApi = (): Promise<{
  syncedCount: number;
  updatedIds: number[];
  timestamp: string;
}> => {
  return request.post<{
    syncedCount: number;
    updatedIds: number[];
    timestamp: string;
  }>('/probations/sync-status');
};

export const getProbationPassRateStatsApi = (
  filters?: ProbationStatsFilters
): Promise<ProbationPassRateStats> => {
  return request.get<ProbationPassRateStats>('/probations/pass-rate-stats', {
    params: filters || {},
  });
};

export const getProbationOperationLogsApi = (id: number): Promise<ProbationOperationLogItem[]> => {
  return request.get<ProbationOperationLogItem[]>(`/probations/${id}/operation-logs`);
};

export const getOnboardAuditPassedList = (): Promise<Array<{
  id: number;
  resumeId: number;
  jobId: number;
  name?: string;
  phone?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  salaryBase?: number;
  reportTo?: string;
  onboardDate?: string;
}>> => {
  return request.get<Array<{
    id: number;
    resumeId: number;
    jobId: number;
    name?: string;
    phone?: string;
    department?: string;
    position?: string;
    jobLevel?: string;
    salaryBase?: number;
    reportTo?: string;
    onboardDate?: string;
  }>>('/onboards/audit-passed');
};
