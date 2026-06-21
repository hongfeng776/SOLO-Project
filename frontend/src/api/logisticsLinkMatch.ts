import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type {
  LinkMatchResult,
  MatchStep,
  MatchProgress,
} from '@/types/business'

export enum LinkMatchStatus {
  PENDING = 0,
  MATCHED = 1,
  NO_PROVIDER = 2,
  ADDRESS_REMOTE = 3,
  PRODUCT_FORBIDDEN = 4,
  TIMEOUT_UNMET = 5,
}

export const LinkMatchStatusMap: Record<number, { label: string; type: string }> = {
  [LinkMatchStatus.PENDING]: { label: '待匹配', type: 'info' },
  [LinkMatchStatus.MATCHED]: { label: '匹配成功', type: 'success' },
  [LinkMatchStatus.NO_PROVIDER]: { label: '无可用服务商', type: 'warning' },
  [LinkMatchStatus.ADDRESS_REMOTE]: { label: '地址偏远', type: 'warning' },
  [LinkMatchStatus.PRODUCT_FORBIDDEN]: { label: '商品禁运', type: 'danger' },
  [LinkMatchStatus.TIMEOUT_UNMET]: { label: '时效不满足', type: 'warning' },
}

export enum MatchStepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export const MatchStepStatusMap: Record<string, { label: string; type: string }> = {
  [MatchStepStatus.PENDING]: { label: '等待中', type: 'info' },
  [MatchStepStatus.RUNNING]: { label: '进行中', type: 'primary' },
  [MatchStepStatus.COMPLETED]: { label: '已完成', type: 'success' },
  [MatchStepStatus.FAILED]: { label: '失败', type: 'danger' },
  [MatchStepStatus.SKIPPED]: { label: '已跳过', type: 'info' },
}

export function startLinkMatch(orderId: number): Promise<ApiResponse<{ match_no: string; status: number; steps: MatchStep[] }>> {
  return request.post('/logisticsLinkMatch/start', { order_id: orderId })
}

export function getMatchProgress(matchNo: string): Promise<ApiResponse<MatchProgress>> {
  return request.get(`/logisticsLinkMatch/progress/${matchNo}`)
}

export function getMatchResult(matchNo: string): Promise<ApiResponse<LinkMatchResult>> {
  return request.get(`/logisticsLinkMatch/result/${matchNo}`)
}

export function selectProvider(matchNo: string, providerId: number): Promise<ApiResponse<null>> {
  return request.post('/logisticsLinkMatch/select-provider', {
    match_no: matchNo,
    provider_id: providerId,
  })
}
