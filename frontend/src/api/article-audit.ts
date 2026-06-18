import { http } from '@/utils/request'
import type {
  ArticleAuditDetail,
  ArticleAuditSubmitData,
  BatchArticleAuditParams,
  PaginationResult,
  PaginationParams,
  ArticleAuditPoolItem,
  ArticleAuditTraceRecord,
  ArticleAuditQCResult,
  ArticleAuditDuplicateCheckResult,
  ArticleAuditConsistencyCheck,
  ArticleAuditLedgerExportResult,
  AiPreScreenResult,
  BatchOperationResult,
} from '@/types'

export const getArticleAuditPoolApi = (
  params: PaginationParams
): Promise<PaginationResult<ArticleAuditPoolItem>> => {
  return http.get<PaginationResult<ArticleAuditPoolItem>>('/api/v1/article-audit/pool', params)
}

export const getArticleAuditDetailApi = (articleId: number): Promise<ArticleAuditDetail> => {
  return http.get<ArticleAuditDetail>(`/api/v1/article-audit/${articleId}/detail`)
}

export const getArticleAiPreScreenApi = (articleId: number): Promise<AiPreScreenResult> => {
  return http.get<AiPreScreenResult>(`/api/v1/article-audit/${articleId}/ai-screen`)
}

export const checkArticleAuditDuplicateApi = (
  articleId: number
): Promise<ArticleAuditDuplicateCheckResult> => {
  return http.get<ArticleAuditDuplicateCheckResult>(
    `/api/v1/article-audit/${articleId}/check-duplicate`
  )
}

export const checkArticleConsistencyApi = (
  articleId: number,
  hash: string
): Promise<ArticleAuditConsistencyCheck> => {
  return http.get<ArticleAuditConsistencyCheck>(
    `/api/v1/article-audit/${articleId}/check-consistency`,
    { contentHash: hash }
  )
}

export const handleArticleAiRiskApi = (
  articleId: number,
  riskType: string,
  handled: boolean
): Promise<{ success: boolean; handledCount: number; totalCount: number }> => {
  return http.post(`/api/v1/article-audit/${articleId}/risks/${riskType}/handle`, { handled })
}

export const submitArticleAuditApi = (
  data: ArticleAuditSubmitData
): Promise<{ auditNo: string; publishPermission: number; distributionQualification: boolean }> => {
  return http.post('/api/v1/article-audit/submit', data)
}

export const reviewSuspectedArticleApi = (
  articleId: number,
  reviewData: { reviewLevel: number; auditRemark?: string }
): Promise<{ success: boolean; newAuditStatus: number }> => {
  return http.post(`/api/v1/article-audit/${articleId}/review-suspected`, reviewData)
}

export const batchArticleAuditActionApi = (
  params: BatchArticleAuditParams
): Promise<BatchOperationResult> => {
  return http.post('/api/v1/article-audit/batch-action', params)
}

export const exportArticleAuditLedgerApi = (
  params: Partial<BatchArticleAuditParams>
): Promise<ArticleAuditLedgerExportResult> => {
  return http.post('/api/v1/article-audit/export-ledger', params)
}

export const getArticleAuditTraceApi = (
  articleCode: string,
  options?: { auditBatch?: string; riskTag?: string }
): Promise<ArticleAuditTraceRecord> => {
  return http.get<ArticleAuditTraceRecord>(`/api/v1/article-audit/trace/${articleCode}`, options || {})
}

export const getArticleAuditQCApi = (
  period: 'today' | 'week' | 'month',
  auditorId?: number
): Promise<ArticleAuditQCResult> => {
  return http.get<ArticleAuditQCResult>('/api/v1/article-audit/qc-report', { period, auditorId })
}
