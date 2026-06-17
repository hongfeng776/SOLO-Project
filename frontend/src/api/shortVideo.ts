import { http } from '@/utils/request'
import type {
  ShortVideoItem,
  PaginationParams,
  PaginationResult,
  StatusLogItem,
  VideoFingerprintCheckResult,
  BatchOperationResult,
} from '@/types'

export const getShortVideoListApi = (
  params: PaginationParams
): Promise<PaginationResult<ShortVideoItem>> => {
  return http.get<PaginationResult<ShortVideoItem>>('/api/v1/short-videos', params)
}

export const getShortVideoDetailApi = (id: number): Promise<ShortVideoItem> => {
  return http.get<ShortVideoItem>(`/api/v1/short-videos/${id}`)
}

export const createShortVideoApi = (
  data: Partial<ShortVideoItem>
): Promise<{ id: number }> => {
  return http.post<{ id: number }>('/api/v1/short-videos', data)
}

export const updateShortVideoApi = (
  id: number,
  data: Partial<ShortVideoItem>
): Promise<void> => {
  return http.put<void>(`/api/v1/short-videos/${id}`, data)
}

export const changeVideoStatusApi = (
  id: number,
  data: { status: number; changeReason?: string; remark?: string }
): Promise<void> => {
  return http.post<void>(`/api/v1/short-videos/${id}/change-status`, data)
}

export const batchResetTagsApi = (
  ids: number[],
  newTags: string[]
): Promise<BatchOperationResult> => {
  return http.post<BatchOperationResult>('/api/v1/short-videos/batch-reset-tags', {
    ids,
    newTags,
  })
}

export const batchRestoreVideosApi = (
  ids: number[],
  reason: string
): Promise<BatchOperationResult> => {
  return http.post<BatchOperationResult>('/api/v1/short-videos/batch-restore', {
    ids,
    reason,
  })
}

export const batchArchiveVideosApi = (ids: number[]): Promise<BatchOperationResult> => {
  return http.post<BatchOperationResult>('/api/v1/short-videos/batch-archive', { ids })
}

export const checkVideoFingerprintApi = (
  fingerprint: string,
  excludeId?: number
): Promise<VideoFingerprintCheckResult> => {
  return http.get<VideoFingerprintCheckResult>('/api/v1/short-videos/check-fingerprint', {
    fingerprint,
    excludeId: excludeId || '',
  })
}

export const getStatusLogsApi = (contentId: number): Promise<StatusLogItem[]> => {
  return http.get<StatusLogItem[]>(`/api/v1/short-videos/${contentId}/status-logs`)
}
