import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'
import type {
  ArticleInfo,
  ArticleVersion,
  ArticleTopic,
  SensitiveHit,
  ValidateArticleResult,
  EditMode,
  BatchOperScope,
  ArticleFullTrace,
  DuplicateCheckResult,
  QualityReport,
  Channel,
  BatchResult
} from '@/types/business'

const API_PREFIX = '/api/v1'

export interface ArticleQueryParams extends PageParams {
  title?: string
  uniqueCode?: string
  domainCategoryId?: number
  channel?: Channel
  status?: number
  topicId?: number
  publisherId?: number
  topFlag?: boolean
  minViewCount?: number
  maxViewCount?: number
  minLikeCount?: number
  maxLikeCount?: number
  startDate?: string
  endDate?: string
}

export function getArticleList(params: ArticleQueryParams): Promise<ApiResponse<PageResult<ArticleInfo>>> {
  return request.get<PageResult<ArticleInfo>>(`${API_PREFIX}/article/list`, { params })
}

export function getArticle(id: number): Promise<ApiResponse<ArticleInfo>> {
  return request.get<ArticleInfo>(`${API_PREFIX}/article/${id}`)
}

export function createArticle(data: Partial<ArticleInfo>): Promise<ApiResponse<ArticleInfo>> {
  return request.post<ArticleInfo>(`${API_PREFIX}/article/create`, data)
}

export function updateArticle(id: number, data: Partial<ArticleInfo>): Promise<ApiResponse<ArticleInfo>> {
  return request.put<ArticleInfo>(`${API_PREFIX}/article/${id}`, data)
}

export function deleteArticle(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`${API_PREFIX}/article/${id}`)
}

export interface ValidateArticleCreateData {
  title?: string
  content?: string
  channel?: Channel
  domainCategoryId?: number
  topicId?: number
}

export function validateArticleCreate(data: ValidateArticleCreateData): Promise<ApiResponse<ValidateArticleResult>> {
  return request.post<ValidateArticleResult>(`${API_PREFIX}/articleValidate/validate-create`, data)
}

export function getChannelTemplate(channel: Channel): Promise<ApiResponse<{
  templates: { key: string; name: string; preview: string }[]
  wordConfig: { minWord: number; maxWord: number }
}>> {
  return request.get(`${API_PREFIX}/articleValidate/channel-template`, { params: { channel } })
}

export function scanSensitivePreview(text: string): Promise<ApiResponse<SensitiveHit[]>> {
  return request.get<SensitiveHit[]>(`${API_PREFIX}/articleValidate/scan-sensitive`, { params: { text } })
}

export function getEditMode(articleId: number): Promise<ApiResponse<EditMode>> {
  return request.get<EditMode>(`${API_PREFIX}/articleEditor/edit-mode/${articleId}`)
}

export interface IncrementalEditData {
  coverImage?: string
  summary?: string
  images?: string[]
  changeLog: string
}

export function incrementalEdit(
  id: number,
  data: IncrementalEditData,
  editorId: number
): Promise<ApiResponse<ArticleVersion>> {
  return request.post<ArticleVersion>(`${API_PREFIX}/articleEditor/incremental/${id}`, { ...data, editorId })
}

export interface FullEditData {
  title?: string
  summary?: string
  content?: string
  coverImage?: string
  images?: string[]
  domainCategoryId?: number
  template?: string
  topicId?: number
  changeLog: string
}

export function fullEdit(
  id: number,
  data: FullEditData,
  editorId: number
): Promise<ApiResponse<ArticleVersion>> {
  return request.post<ArticleVersion>(`${API_PREFIX}/articleEditor/full/${id}`, { ...data, editorId })
}

export function saveDraft(id: number, data: Partial<ArticleInfo>): Promise<ApiResponse<ArticleInfo>> {
  return request.post<ArticleInfo>(`${API_PREFIX}/articleEditor/draft/${id}`, data)
}

export function submitForReview(id: number, version: string): Promise<ApiResponse<null>> {
  return request.post<null>(`${API_PREFIX}/articleEditor/submit-review`, { id, version })
}

export interface BatchTopParams {
  ids: number[]
  roleId: number
}

export function batchTopArticles(ids: number[], roleId: number): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>(`${API_PREFIX}/articleBatch/top`, { ids, roleId })
}

export interface BatchOfflineParams {
  ids: number[]
  reason: string
  roleId: number
}

export function batchOfflineArticles(ids: number[], reason: string, roleId: number): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>(`${API_PREFIX}/articleBatch/offline`, { ids, reason, roleId })
}

export interface BatchAssignTopicParams {
  ids: number[]
  topicId: number
  roleId: number
}

export function batchAssignTopic(ids: number[], topicId: number, roleId: number): Promise<ApiResponse<BatchResult>> {
  return request.post<BatchResult>(`${API_PREFIX}/articleBatch/assign-topic`, { ids, topicId, roleId })
}

export function getOperableScope(): Promise<ApiResponse<BatchOperScope>> {
  return request.get<BatchOperScope>(`${API_PREFIX}/articleBatch/operable-scope`)
}

export interface BatchAbilityData {
  ids: number[]
  roleId: number
}

export function batchAbility(ids: number[], roleId: number): Promise<ApiResponse<{
  canTop: boolean
  canOffline: boolean
  canAssignTopic: boolean
  canEdit: boolean
  canDelete: boolean
  abilityList: Record<number, {
    canTop: boolean
    canOffline: boolean
    canEdit: boolean
    canDelete: boolean
    reason?: string
  }>
}>> {
  return request.post(`${API_PREFIX}/articleBatch/ability`, { ids, roleId })
}

export function getArticleFullTrace(id: number): Promise<ApiResponse<ArticleFullTrace>> {
  return request.get<ArticleFullTrace>(`${API_PREFIX}/articleTrace/full/${id}`)
}

export interface CheckDuplicateData {
  title?: string
  content?: string
  excludeId?: number
}

export function checkDuplicate(data: CheckDuplicateData): Promise<ApiResponse<DuplicateCheckResult>> {
  return request.post<DuplicateCheckResult>(`${API_PREFIX}/articleTrace/check-duplicate`, data)
}

export function validateQuality(id: number): Promise<ApiResponse<QualityReport>> {
  return request.get<QualityReport>(`${API_PREFIX}/articleTrace/quality/${id}`)
}

export function getTopicList(): Promise<ApiResponse<ArticleTopic[]>> {
  return request.get<ArticleTopic[]>(`${API_PREFIX}/article/topic/list`)
}

export function getDomainCategoryList(): Promise<ApiResponse<{ id: number; name: string; parentId?: number }[]>> {
  return request.get(`${API_PREFIX}/article/domain-category/list`)
}
