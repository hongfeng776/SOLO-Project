import { get } from '@utils/request'
import type { PageResult } from '@/types/api'
import type { PublishEligibilityResult, AccountStatus, PublishAbnormalLog } from '@/types/business'

export const checkPublishEligibility = (): Promise<PublishEligibilityResult> => {
  return get<PublishEligibilityResult>('/user-account/publish-eligibility')
}

export const getAccountStatus = (): Promise<AccountStatus> => {
  return get<AccountStatus>('/user-account/status')
}

export const getAbnormalLogs = (params: {
  page: number
  pageSize: number
  abnormalType?: string
}): Promise<PageResult<PublishAbnormalLog>> => {
  return get<PageResult<PublishAbnormalLog>>('/user-account/abnormal-logs', params)
}
