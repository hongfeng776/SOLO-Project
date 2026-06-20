import { request, PaginationResult } from '@/utils/request';
import { ResumeStatus, Gender, Education, ParseStatus, ResumeCollectMode, ResumeSource, MatchLevel, ResumeTag, ScreenAction } from '@/constants/recruitment';

export interface ParseLogItem {
  id: number;
  resumeId: number;
  parseStatus: ParseStatus;
  parseTime?: string;
  parseDuration?: number;
  parsedFields?: string;
  failedFields?: string;
  errorMessage?: string;
  parseAttempts: number;
  parserVersion?: string;
  rawContent?: string;
  operatorId?: number;
  operatorName?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScreenLogItem {
  id: number;
  resumeId: number;
  jobId: number;
  action: ScreenAction;
  screenConditions?: string;
  matchLevelBefore?: MatchLevel;
  matchLevelAfter?: MatchLevel;
  matchScoreBefore?: number;
  matchScoreAfter?: number;
  tagBefore?: ResumeTag;
  tagAfter?: ResumeTag;
  conflictDetected?: boolean;
  conflictReason?: string;
  isDuplicateScreen?: boolean;
  operatorId?: number;
  operatorName?: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScreenTemplateItem {
  id: number;
  name: string;
  description?: string;
  conditions: string;
  jobId?: number;
  isGlobal?: boolean;
  creatorId?: number;
  creatorName?: string;
  useCount?: number;
  created_at?: string;
  updated_at?: string;
}

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
  fileName?: string;
  selfEvaluation?: string;
  status: ResumeStatus;
  source?: ResumeSource;
  remark?: string;
  parseStatus?: ParseStatus;
  matchScore?: number;
  matchDetails?: string;
  collectMode?: ResumeCollectMode;
  collectorId?: number;
  collectorName?: string;
  collectTime?: string;
  isLocked?: boolean;
  lockReason?: string;
  isDuplicate?: boolean;
  duplicateResumeId?: number;
  abnormalFields?: string;
  isBlankResume?: boolean;
  isFakeResume?: boolean;
  fakeCheckReason?: string;
  matchLevel?: MatchLevel;
  resumeTag?: ResumeTag;
  skillTags?: string;
  screenTime?: string;
  screenOperatorId?: number;
  screenOperatorName?: string;
  job?: any;
  latestParseLog?: ParseLogItem;
  parseLogs?: ParseLogItem[];
  screenLogs?: ScreenLogItem[];
  created_at?: string;
  updated_at?: string;
}

export interface BatchResult {
  total: number;
  success: number;
  failed: number;
  duplicates: number;
  errors: {
    resumeId?: number;
    fileName?: string;
    name?: string;
    message: string;
  }[];
}

export interface FileValidateResult {
  valid: boolean;
  error?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateResume?: ResumeItem;
  reason?: string;
}

export interface ScreenConditions {
  education?: string;
  minEducation?: string;
  minExperience?: number;
  maxExperience?: number;
  experienceRange?: string;
  minSalary?: number;
  maxSalary?: number;
  skillTags?: string[];
  city?: string;
  isFreshGraduate?: boolean;
  matchLevel?: MatchLevel;
  resumeTag?: ResumeTag;
}

export interface ScreenResult {
  total: number;
  filtered: ResumeItem[];
  conditions: ScreenConditions;
  conflictDetected: boolean;
  conflictReason?: string;
}

export interface MatchOptimizationData {
  jobId: number;
  totalResumes: number;
  matchDistribution: Record<MatchLevel, number>;
  averageScore: number;
  suggestions: string[];
  weightAnalysis: any;
}

export interface UploadParseParams {
  fileInfo: {
    fileName: string;
    fileSize: number;
    filePath?: string;
  };
  jobId: number;
  content: string;
}

export interface BatchUploadParseParams {
  fileList: {
    fileName: string;
    fileSize: number;
    filePath?: string;
  }[];
  jobId: number;
  contents: string[];
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

export const uploadAndParseApi = (params: UploadParseParams): Promise<ResumeItem> => {
  return request.post<ResumeItem>('/resumes/upload-parse', params);
};

export const retryParseApi = (id: number, content?: string): Promise<ResumeItem> => {
  return request.put<ResumeItem>(`/resumes/${id}/retry-parse`, { content });
};

export const batchUploadAndParseApi = (params: BatchUploadParseParams): Promise<BatchResult> => {
  return request.post<BatchResult>('/resumes/batch-upload-parse', params);
};

export const batchRetryParseApi = (ids: number[]): Promise<BatchResult> => {
  return request.post<BatchResult>('/resumes/batch-retry-parse', { ids });
};

export const batchTriggerParseApi = (ids: number[]): Promise<BatchResult> => {
  return request.post<BatchResult>('/resumes/batch-trigger-parse', { ids });
};

export const getResumeParseLogsApi = (id: number): Promise<ParseLogItem[]> => {
  return request.get<ParseLogItem[]>(`/resumes/${id}/parse-logs`);
};

export const getFailedResumeListApi = (params: any): Promise<PaginationResult<ResumeItem>> => {
  return request.get<PaginationResult<ResumeItem>>('/resumes/failed', { params });
};

export const exportExceptionListApi = (): Promise<any[]> => {
  return request.get<any[]>('/resumes/exception/export');
};

export const completeResumeInfoApi = (id: number, data: Partial<ResumeItem>): Promise<ResumeItem> => {
  return request.put<ResumeItem>(`/resumes/${id}/complete-info`, data);
};

export const unlockResumeApi = (id: number, reason: string): Promise<ResumeItem> => {
  return request.put<ResumeItem>(`/resumes/${id}/unlock`, { reason });
};

export const validateFileApi = (fileName: string, fileSize: number): Promise<FileValidateResult> => {
  return request.post<FileValidateResult>('/resumes/validate-file', { fileName, fileSize });
};

export const checkDuplicateApi = (name: string, phone: string, excludeId?: number): Promise<DuplicateCheckResult> => {
  return request.post<DuplicateCheckResult>('/resumes/check-duplicate', { name, phone, excludeId });
};

export const screenResumesApi = (jobId: number, conditions: ScreenConditions): Promise<ScreenResult> => {
  return request.post<ScreenResult>('/resumes/screen', { jobId, conditions });
};

export const batchScreenResumesApi = (jobId: number, conditions: ScreenConditions): Promise<ScreenResult> => {
  return request.post<ScreenResult>('/resumes/batch-screen', { jobId, conditions });
};

export const updateMatchLevelApi = (id: number): Promise<any> => {
  return request.put<any>(`/resumes/${id}/match-level`);
};

export const refreshJobMatchLevelsApi = (jobId: number): Promise<BatchResult> => {
  return request.post<BatchResult>('/resumes/refresh-match-levels', { jobId });
};

export const tagResumeApi = (id: number, tag: ResumeTag): Promise<ResumeItem> => {
  return request.put<ResumeItem>(`/resumes/${id}/tag`, { tag });
};

export const batchTagResumesApi = (ids: number[], tag: ResumeTag): Promise<BatchResult> => {
  return request.post<BatchResult>('/resumes/batch-tag', { ids, tag });
};

export const getScreenTemplatesApi = (jobId?: number): Promise<ScreenTemplateItem[]> => {
  return request.get<ScreenTemplateItem[]>('/resumes/screen-templates', { params: { jobId } });
};

export const saveScreenTemplateApi = (data: any): Promise<ScreenTemplateItem> => {
  return request.post<ScreenTemplateItem>('/resumes/screen-templates', data);
};

export const deleteScreenTemplateApi = (id: number): Promise<any> => {
  return request.delete<any>(`/resumes/screen-templates/${id}`);
};

export const useScreenTemplateApi = (id: number, jobId: number): Promise<ScreenResult> => {
  return request.post<ScreenResult>(`/resumes/screen-templates/${id}/use`, { jobId });
};

export const getScreenLogsApi = (id: number): Promise<ScreenLogItem[]> => {
  return request.get<ScreenLogItem[]>(`/resumes/${id}/screen-logs`);
};

export const getMatchOptimizationDataApi = (jobId: number): Promise<MatchOptimizationData> => {
  return request.get<MatchOptimizationData>('/resumes/match-optimization', { params: { jobId } });
};

export const checkScreenPreconditionsApi = (jobId: number): Promise<{ canScreen: boolean; reason?: string }> => {
  return request.get<{ canScreen: boolean; reason?: string }>('/resumes/screen-preconditions', { params: { jobId } });
};
