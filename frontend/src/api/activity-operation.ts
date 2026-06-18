import { get, post, put } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  ActivityListUser,
  ActivityUserDetail,
  ActivityScoreDetail,
  FilterValidationResult,
  ActivityStrategy,
  BatchActivityOperationResult,
  ActivityScoreLogItem,
  ActivityAbnormalDetectResult,
  ActivityAbnormalWarningItem,
  ActivityDataValidation,
  ActivityRefreshResult,
  ActivityPermission
} from '@/types/business'

export const getActivityList = (
  params: Record<string, unknown>
): Promise<PageResult<ActivityListUser> & { permission: ActivityPermission; stats?: Record<string, number> }> => {
  return get('/activity-operation/list', params)
}

export const getUserActivityDetail = (
  id: number
): Promise<ActivityUserDetail> => {
  return get(`/activity-operation/${id}/detail`)
}

export const calculateActivityScore = (
  id: number
): Promise<{ totalScore: number; detail: ActivityScoreDetail; level: number }> => {
  return post(`/activity-operation/${id}/calculate`, {})
}

export const validateFilterConditions = (
  conditions: Record<string, unknown>
): Promise<FilterValidationResult> => {
  return post('/activity-operation/validate-filters', { conditions })
}

export const refreshActivityData = (
  id: number
): Promise<ActivityRefreshResult> => {
  return post(`/activity-operation/${id}/refresh`, {})
}

export const getStrategies = (): Promise<{
  list: ActivityStrategy[]
  strategyTypeDict: Record<string, string>
  levelStrategyMap: Record<number, string[]>
}> => {
  return get('/activity-operation/strategies/list')
}

export const updateStrategy = (
  id: number,
  data: Partial<ActivityStrategy>
): Promise<ActivityStrategy> => {
  return put(`/activity-operation/strategies/${id}`, data)
}

export const getUserStrategies = (
  id: number
): Promise<{
  currentStrategies: Array<{ key: string; name: string; enabled: boolean; description: string }>
  availableStrategies: Array<{ key: string; name: string; description: string }>
  userLevel: number
  userLevelName: string
}> => {
  return get(`/activity-operation/${id}/strategies`)
}

export const batchExecuteOperation = (
  data: {
    operationType: string
    userIds: number[]
    strategyIds?: number[]
    executeType: string
    scheduledTime?: string
    remark?: string
  }
): Promise<BatchActivityOperationResult> => {
  return post('/activity-operation/batch/execute', data)
}

export const getActivityScoreLogs = (
  params: Record<string, unknown>
): Promise<PageResult<ActivityScoreLogItem>> => {
  return get('/activity-operation/score-logs/list', params)
}

export const detectAbnormalActivity = (
  id: number
): Promise<ActivityAbnormalDetectResult> => {
  return post(`/activity-operation/${id}/detect-abnormal`, {})
}

export const generateAbnormalWarningList = (
  params: Record<string, unknown>
): Promise<PageResult<ActivityAbnormalWarningItem>> => {
  return get('/activity-operation/abnormal/warning-list', params)
}

export const validateActivityData = (
  id: number
): Promise<ActivityDataValidation> => {
  return post(`/activity-operation/${id}/validate`, {})
}
