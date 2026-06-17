import { http } from '@/utils/request'
import type {
  TopicItem,
  TopicContentItem,
  TopicTitleCheckResult,
  TopicTimeOverlapResult,
  ContentMountCheckResult,
  TopicBatchMountItem,
  PaginationParams,
  PaginationResult,
  BatchOperationResult,
} from '@/types'

export const getTopicListApi = (
  params: PaginationParams
): Promise<PaginationResult<TopicItem>> => {
  return http.get<PaginationResult<TopicItem>>('/api/v1/topics', params)
}

export const getTopicDetailApi = (
  id: number
): Promise<TopicItem & { topicContents: TopicContentItem[] }> => {
  return http.get<TopicItem & { topicContents: TopicContentItem[] }>(`/api/v1/topics/${id}`)
}

export const createTopicApi = (
  data: Partial<TopicItem>
): Promise<{ id: number; topicCode: string; resourceLink: string }> => {
  return http.post<{ id: number; topicCode: string; resourceLink: string }>('/api/v1/topics', data)
}

export const updateTopicApi = (
  id: number,
  data: Partial<TopicItem>
): Promise<void> => {
  return http.put<void>(`/api/v1/topics/${id}`, data)
}

export const changeTopicStatusApi = (
  id: number,
  data: { toStatus: number; reason?: string }
): Promise<void> => {
  return http.post<void>(`/api/v1/topics/${id}/change-status`, data)
}

export const mountTopicContentApi = (
  topicId: number,
  contentList: TopicBatchMountItem[]
): Promise<void> => {
  return http.post<void>(`/api/v1/topics/${topicId}/contents/mount`, { contentList })
}

export const unmountTopicContentApi = (
  topicId: number,
  contentIds: number[]
): Promise<void> => {
  return http.post<void>(`/api/v1/topics/${topicId}/contents/unmount`, { contentIds })
}

export const reorderTopicContentsApi = (
  topicId: number,
  orderList: { id: number; sortOrder: number }[]
): Promise<void> => {
  return http.post<void>(`/api/v1/topics/${topicId}/contents/reorder`, { orderList })
}

export const batchEnableTopicsApi = (
  ids: number[]
): Promise<BatchOperationResult> => {
  return http.post<BatchOperationResult>('/api/v1/topics/batch-enable', { ids })
}

export const batchDisableTopicsApi = (
  ids: number[],
  reason: string
): Promise<BatchOperationResult> => {
  return http.post<BatchOperationResult>('/api/v1/topics/batch-disable', { ids, reason })
}

export const batchSupplementContentsApi = (
  ids: number[],
  contentIds: number[]
): Promise<BatchOperationResult> => {
  return http.post<BatchOperationResult>('/api/v1/topics/batch-supplement-contents', { ids, contentIds })
}

export const batchUpdateTopicWeightApi = (
  ids: number[],
  weightScore: number
): Promise<BatchOperationResult> => {
  return http.post<BatchOperationResult>('/api/v1/topics/batch-update-weight', { ids, weightScore })
}

export const checkTopicTitleUniqueApi = (
  title: string,
  topicType: number,
  excludeId?: number
): Promise<TopicTitleCheckResult> => {
  return http.get<TopicTitleCheckResult>('/api/v1/topics/check-title-unique', {
    title,
    topicType,
    excludeId: excludeId || '',
  })
}

export const checkTopicTimeOverlapApi = (
  topicType: number,
  startTime: string,
  endTime: string,
  excludeId?: number
): Promise<TopicTimeOverlapResult> => {
  return http.get<TopicTimeOverlapResult>('/api/v1/topics/check-time-overlap', {
    topicType,
    startTime,
    endTime,
    excludeId: excludeId || '',
  })
}

export const checkContentMountedApi = (
  topicId: number,
  contentIds: number[]
): Promise<ContentMountCheckResult> => {
  return http.get<ContentMountCheckResult>(`/api/v1/topics/${topicId}/check-content-mounted`, {
    contentIds: contentIds.join(','),
  })
}
