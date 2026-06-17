import { http } from '@/utils/request'
import type {
  ArticleItem,
  ArticleVersionItem,
  PaginationParams,
  PaginationResult,
  BatchOperationResult,
  TitleCheckResult,
  ContentCheckResult,
  CheckReport,
} from '@/types'

export const getArticleListApi = (
  params: PaginationParams
): Promise<PaginationResult<ArticleItem>> => {
  return http.get<PaginationResult<ArticleItem>>('/api/v1/articles', params)
}

export const getArticleDetailApi = (id: number): Promise<ArticleItem> => {
  return http.get<ArticleItem>(`/api/v1/articles/${id}`)
}

export const createArticleApi = (
  data: Partial<ArticleItem>
): Promise<{ id: number; articleCode: string }> => {
  return http.post<{ id: number; articleCode: string }>('/api/v1/articles', data)
}

export const updateArticleApi = (
  id: number,
  data: Partial<ArticleItem>,
  editMode: number
): Promise<{ versionNo: number; needAudit: boolean }> => {
  return http.put<{ versionNo: number; needAudit: boolean }>(`/api/v1/articles/${id}`, {
    ...data,
    editMode,
  })
}

export const publishArticleVersionApi = (
  id: number,
  versionNo: number
): Promise<void> => {
  return http.post<void>(`/api/v1/articles/${id}/publish-version`, { versionNo })
}

export const getVersionListApi = (contentId: number): Promise<ArticleVersionItem[]> => {
  return http.get<ArticleVersionItem[]>(`/api/v1/articles/${contentId}/versions`)
}

export const getVersionDetailApi = (versionId: number): Promise<ArticleVersionItem> => {
  return http.get<ArticleVersionItem>(`/api/v1/articles/versions/${versionId}`)
}

export const batchTopArticlesApi = (
  ids: number[],
  topDays: number
): Promise<BatchOperationResult> => {
  return http.post<BatchOperationResult>('/api/v1/articles/batch-top', {
    ids,
    topDays,
  })
}

export const batchOfflineArticlesApi = (
  ids: number[],
  reason: string
): Promise<BatchOperationResult> => {
  return http.post<BatchOperationResult>('/api/v1/articles/batch-offline', {
    ids,
    reason,
  })
}

export const batchClassifyTopicApi = (
  ids: number[],
  topicId: number,
  topicTitle: string
): Promise<BatchOperationResult> => {
  return http.post<BatchOperationResult>('/api/v1/articles/batch-classify-topic', {
    ids,
    topicId,
    topicTitle,
  })
}

export const checkTitleUniqueApi = (
  title: string,
  excludeId?: number,
  category?: number
): Promise<TitleCheckResult> => {
  return http.get<TitleCheckResult>('/api/v1/articles/check-title', {
    title,
    excludeId: excludeId || '',
    category: category || '',
  })
}

export const checkContentUniqueApi = (
  hash: string,
  excludeId?: number
): Promise<ContentCheckResult> => {
  return http.get<ContentCheckResult>('/api/v1/articles/check-content', {
    hash,
    excludeId: excludeId || '',
  })
}

export const generateCheckReportApi = (id: number): Promise<CheckReport> => {
  return http.post<CheckReport>(`/api/v1/articles/${id}/generate-check-report`)
}
