import { get, post, put } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  LevelListUser,
  UserLevelDetail,
  LevelScoreDetail,
  LevelAdjustValidationResult,
  LevelAdjustResult,
  UserLevelLog,
  LevelAnalysisResult,
  BatchLevelAdjustParams,
  BatchLevelAdjustResult,
  UserLevelConfig,
  UserLevelPermission,
  UserPreCheckResult
} from '@/types/business'

export const getLevelList = (
  params: Record<string, unknown>
): Promise<PageResult<LevelListUser> & { permission: UserLevelPermission }> => {
  return get<PageResult<LevelListUser> & { permission: UserLevelPermission }>('/user-level/list', params)
}

export const getUserLevelDetail = (id: number): Promise<UserLevelDetail> => {
  return get<UserLevelDetail>(`/user-level/${id}/detail`)
}

export const preCheckUser = (id: number): Promise<UserPreCheckResult> => {
  return get<UserPreCheckResult>(`/user-level/${id}/precheck`)
}

export const calculateLevelScore = (
  id: number
): Promise<{ totalScore: number; detail: LevelScoreDetail }> => {
  return get<{ totalScore: number; detail: LevelScoreDetail }>(`/user-level/${id}/calculate-score`)
}

export const autoCalculateLevel = (id: number): Promise<LevelAdjustResult> => {
  return post<LevelAdjustResult>(`/user-level/${id}/auto-calculate`)
}

export const adjustLevel = (
  id: number,
  data: {
    targetLevel: number
    reason: string
    reasonDetail?: string
  }
): Promise<LevelAdjustResult> => {
  return put<LevelAdjustResult>(`/user-level/${id}/adjust`, data)
}

export const validateLevelAdjustment = (
  id: number,
  data: {
    targetLevel: number
  }
): Promise<LevelAdjustValidationResult> => {
  return post<LevelAdjustValidationResult>(`/user-level/${id}/validate-adjustment`, data)
}

export const batchAdjustLevel = (data: BatchLevelAdjustParams): Promise<BatchLevelAdjustResult> => {
  return post<BatchLevelAdjustResult>('/user-level/batch/adjust', data)
}

export const getLevelLogs = (params: Record<string, unknown>): Promise<PageResult<UserLevelLog>> => {
  return get<PageResult<UserLevelLog>>('/user-level/logs/list', params)
}

export const analyzeLevelChange = (
  logId: number,
  userId?: number
): Promise<LevelAnalysisResult> => {
  return get<LevelAnalysisResult>(`/user-level/logs/${logId}/analyze`, { userId })
}

export const getLevelConfigs = (): Promise<UserLevelConfig[]> => {
  return get<UserLevelConfig[]>('/user-level/configs/list')
}

export const updateLevelConfig = (
  id: number,
  data: Partial<UserLevelConfig>
): Promise<UserLevelConfig> => {
  return put<UserLevelConfig>(`/user-level/configs/${id}`, data)
}
