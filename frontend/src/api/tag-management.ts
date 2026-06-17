import { get, post, put, del, patch } from '@utils/request'
import type { PageResult } from '@/types/api'
import type {
  Tag,
  TagUsageLog,
  TagCategoryComplianceResult,
  BatchTagOpsResult
} from '@/types/business'

export interface TagListParams {
  page: number
  pageSize: number
  keyword?: string
  status?: number
  categoryId?: number
  hotLevel?: number
  scene?: string
  type?: string
}

export const getTagList = (params: TagListParams): Promise<PageResult<Tag>> => {
  return get<PageResult<Tag>>('/tags', params)
}

export const getTagDetail = (id: number): Promise<Tag> => {
  return get<Tag>(`/tags/${id}`)
}

export const getTagUsageLogs = (params: {
  page: number
  pageSize: number
  tagId?: number
  categoryId?: number
  startDate?: string
  endDate?: string
}): Promise<PageResult<TagUsageLog>> => {
  return get<PageResult<TagUsageLog>>('/tags/usage-logs', params)
}

export const getTagReviewReport = (days = 30): Promise<{
  topUsedTags: Tag[]
  unusedTagCount: number
  tagUsageStats: Array<{ tagId: number; tagName: string; count: number }>
}> => {
  return get<{
    topUsedTags: Tag[]
    unusedTagCount: number
    tagUsageStats: Array<{ tagId: number; tagName: string; count: number }>
  }>('/tags/review-report', { days })
}

export const createTag = (data: Partial<Tag>): Promise<{ id: number }> => {
  return post<{ id: number }>('/tags', data)
}

export const validateTag = (
  data: Partial<Tag>
): Promise<TagCategoryComplianceResult> => {
  return post<TagCategoryComplianceResult>('/tags/validate', data)
}

export interface BatchTagOpsData {
  ids: number[]
  action: 'enable' | 'disable' | 'update_weight' | 'update_hot_level'
  weight?: number
  hotLevel?: number
}

export const batchTagOperations = (
  data: BatchTagOpsData
): Promise<BatchTagOpsResult> => {
  return post<BatchTagOpsResult>('/tags/batch', data)
}

export const cleanUnusedTags = (
  thresholdDays: number
): Promise<{ cleaned: number; candidates: number[] }> => {
  return post<{ cleaned: number; candidates: number[] }>('/tags/clean-unused', {
    thresholdDays
  })
}

export const updateTag = (id: number, data: Partial<Tag>): Promise<{ id: number }> => {
  return put<{ id: number }>(`/tags/${id}`, data)
}

export const deleteTag = (id: number): Promise<null> => {
  return del<null>(`/tags/${id}`)
}

export const updateTagStatus = (id: number, status: number): Promise<{ id: number }> => {
  return patch<{ id: number }>(`/tags/${id}/status`, { status })
}
