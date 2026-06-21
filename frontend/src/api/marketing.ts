import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/api'
import type {
  MarketingValidateResult,
  EditPermissions,
  BatchOperationResult,
  MarketingLog,
  MarketingProduct,
  MarketingTraceData,
  DuplicateCheckResult,
  Marketing,
  AdmissionValidateResult,
  AdmissionTraceData,
  AdmissionRule,
  DuplicateApplyCheckResult,
  CrossCategoryCheckResult,
  BatchApplyResult,
  BatchImportResult,
  MarketingProductAdmissionLog,
  MarketingDiscountRule,
  DiscountRuleForm,
  DiscountValidateResult,
  DiscountRuleTraceData,
  DiscountRuleCombination,
  DiscountBatchResult,
  MarketingDiscountRuleLog,
  MarketingDiscountUsageRecord,
  MarketingDiscountStackConflict,
  MarketingDiscountBudgetLedger
} from '@/types/business'

export type { Marketing }

export interface MarketingQueryParams extends PageParams {
  name?: string
  type?: number
  status?: number
  startTimeStart?: string
  startTimeEnd?: string
  endTimeStart?: string
  endTimeEnd?: string
  minDiscount?: number
  maxDiscount?: number
  discountType?: number
}

export function getMarketingList(params: MarketingQueryParams): Promise<ApiResponse<PageResult<Marketing>>> {
  return request.get<PageResult<Marketing>>('/marketing/list', { params })
}

export function getMarketingDetail(id: number): Promise<ApiResponse<Marketing>> {
  return request.get<Marketing>(`/marketing/${id}`)
}

export function createMarketing(data: Partial<Marketing>): Promise<ApiResponse<Marketing>> {
  return request.post<Marketing>('/marketing/create', data)
}

export function updateMarketing(id: number, data: Partial<Marketing>): Promise<ApiResponse<Marketing>> {
  return request.put<Marketing>(`/marketing/${id}`, data)
}

export function deleteMarketing(id: number): Promise<ApiResponse<null>> {
  return request.delete<null>(`/marketing/${id}`)
}

export function updateMarketingStatus(id: number, status: number): Promise<ApiResponse<null>> {
  return request.put<null>(`/marketing/${id}/status`, { status })
}

export function batchDeleteMarketing(ids: number[]): Promise<ApiResponse<null>> {
  return request.post<null>('/marketing/batchDelete', { ids })
}

export function validateCreateMarketing(data: Partial<Marketing>): Promise<ApiResponse<MarketingValidateResult>> {
  return request.post<MarketingValidateResult>('/marketing/validate/create', data)
}

export function validateEditMarketing(id: number, data: Partial<Marketing>): Promise<ApiResponse<MarketingValidateResult>> {
  return request.post<MarketingValidateResult>(`/marketing/validate/edit/${id}`, data)
}

export function getEditPermissions(status: number): Promise<ApiResponse<EditPermissions>> {
  return request.get<EditPermissions>('/marketing/edit-permissions', { params: { status } })
}

export function batchOnlineMarketing(ids: number[]): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/online', { ids })
}

export function batchOfflineMarketing(ids: number[]): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/offline', { ids })
}

export function batchPauseMarketing(ids: number[]): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/pause', { ids })
}

export function batchFilterOperate(data: {
  operation: 'online' | 'offline' | 'pause'
  type?: number
  status?: number
  startTimeStart?: string
  startTimeEnd?: string
  endTimeStart?: string
  endTimeEnd?: string
  minDiscount?: number
  maxDiscount?: number
  discountType?: number
}): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/filter-operate', data)
}

export function batchOfflineExpired(): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/offline-expired')
}

export function batchOnlinePending(): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/batch/online-pending')
}

export function getMarketingTrace(id: number): Promise<ApiResponse<MarketingTraceData>> {
  return request.get<MarketingTraceData>(`/marketing/trace/${id}`)
}

export function getMarketingLogs(id: number, params?: PageParams): Promise<ApiResponse<PageResult<MarketingLog>>> {
  return request.get<PageResult<MarketingLog>>(`/marketing/trace/${id}/logs`, { params })
}

export function getMarketingProducts(id: number, params?: PageParams): Promise<ApiResponse<PageResult<MarketingProduct>>> {
  return request.get<PageResult<MarketingProduct>>(`/marketing/trace/${id}/products`, { params })
}

export function checkDuplicateConfig(data: {
  type?: number
  startTime?: string
  endTime?: string
  categoryIds?: string
  merchantIds?: string
  discountValue?: number
  excludeId?: number
}): Promise<ApiResponse<DuplicateCheckResult>> {
  return request.post<DuplicateCheckResult>('/marketing/trace/check-duplicate', data)
}

export interface MarketingProductQueryParams extends PageParams {
  marketingId?: number
  admissionStatus?: number
  keyword?: string
  categoryId?: number
  merchantId?: number
  minStock?: number
  maxStock?: number
  isAbnormal?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function getMarketingProductList(params: MarketingProductQueryParams): Promise<ApiResponse<PageResult<MarketingProduct>>> {
  return request.get<PageResult<MarketingProduct>>('/marketing/product/list', { params })
}

export function validateApplyProduct(marketingId: number, goodsId: number): Promise<ApiResponse<AdmissionValidateResult>> {
  return request.post<AdmissionValidateResult>('/marketing/product/validate/apply', { marketingId, goodsId })
}

export function applyProducts(data: {
  marketingId: number
  goodsIds: number[]
  activityPrice?: number
  stock?: number
  sortOrder?: number
}): Promise<ApiResponse<BatchApplyResult>> {
  return request.post<BatchApplyResult>('/marketing/product/apply', data)
}

export function auditPassProduct(id: number, remark?: string): Promise<ApiResponse<MarketingProduct>> {
  return request.post<MarketingProduct>(`/marketing/product/audit-pass/${id}`, { remark })
}

export function auditRejectProduct(id: number, remark: string): Promise<ApiResponse<MarketingProduct>> {
  return request.post<MarketingProduct>(`/marketing/product/audit-reject/${id}`, { remark })
}

export function offlineProduct(id: number, remark?: string): Promise<ApiResponse<MarketingProduct>> {
  return request.post<MarketingProduct>(`/marketing/product/offline/${id}`, { remark })
}

export function onlineProduct(id: number, remark?: string): Promise<ApiResponse<MarketingProduct>> {
  return request.post<MarketingProduct>(`/marketing/product/online/${id}`, { remark })
}

export function removeProduct(id: number, remark?: string): Promise<ApiResponse<null>> {
  return request.delete<null>(`/marketing/product/remove/${id}`, { data: { remark } })
}

export function batchAuditPassProducts(ids: number[], remark?: string): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/product/batch/audit-pass', { ids, remark })
}

export function batchAuditRejectProducts(ids: number[], remark: string): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/product/batch/audit-reject', { ids, remark })
}

export function batchOfflineProducts(ids: number[], remark?: string): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/product/batch/offline', { ids, remark })
}

export function batchOnlineProducts(ids: number[], remark?: string): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/product/batch/online', { ids, remark })
}

export function batchRemoveProducts(ids: number[], remark?: string): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/product/batch/remove', { ids, remark })
}

export function batchFilterOperateProducts(data: {
  marketingId: number
  operation: 'audit_pass' | 'audit_reject' | 'offline' | 'online' | 'remove'
  remark?: string
  admissionStatus?: number
  keyword?: string
  categoryId?: number
  merchantId?: number
  minStock?: number
  maxStock?: number
  isAbnormal?: boolean
}): Promise<ApiResponse<BatchOperationResult>> {
  return request.post<BatchOperationResult>('/marketing/product/batch/filter-operate', data)
}

export function batchImportApplyProducts(data: {
  marketingId: number
  goodsList: {
    goodsId: number
    goodsName?: string
    activityPrice?: number
    stock?: number
    sortOrder?: number
  }[]
}): Promise<ApiResponse<BatchImportResult>> {
  return request.post<BatchImportResult>('/marketing/product/batch/import-apply', data)
}

export function batchAddCompliantGoods(data: {
  marketingId: number
  categoryIds?: number[]
  merchantIds?: number[]
  limit?: number
}): Promise<ApiResponse<BatchImportResult>> {
  return request.post<BatchImportResult>('/marketing/product/batch/add-compliant', data)
}

export function getProductTraceData(id: number): Promise<ApiResponse<AdmissionTraceData>> {
  return request.get<AdmissionTraceData>(`/marketing/product/trace/${id}`)
}

export function getProductAdmissionLogs(id: number, params?: PageParams): Promise<ApiResponse<PageResult<MarketingProductAdmissionLog>>> {
  return request.get<PageResult<MarketingProductAdmissionLog>>(`/marketing/product/logs/${id}`, { params })
}

export function checkDuplicateApply(marketingId: number, goodsIds: number[]): Promise<ApiResponse<DuplicateApplyCheckResult>> {
  return request.post<DuplicateApplyCheckResult>('/marketing/product/check-duplicate', { marketingId, goodsIds })
}

export function checkCrossCategoryViolation(marketingId: number, goodsIds: number[]): Promise<ApiResponse<CrossCategoryCheckResult>> {
  return request.post<CrossCategoryCheckResult>('/marketing/product/trace/check-cross-category', { marketingId, goodsIds })
}

export function getAdmissionRules(marketingId?: number, marketingType?: number): Promise<ApiResponse<AdmissionRule[]>> {
  return request.get<AdmissionRule[]>('/marketing/product/trace/rules', { params: { marketingId, marketingType } })
}

export interface DiscountRuleQueryParams extends PageParams {
  marketingId?: number
  discountType?: number
  effectiveStatus?: number
  keyword?: string
  minAmountMin?: number
  minAmountMax?: number
}

export function getDiscountRuleList(params: DiscountRuleQueryParams): Promise<ApiResponse<PageResult<MarketingDiscountRule>>> {
  return request.get<PageResult<MarketingDiscountRule>>('/marketing/discount-rule/list', { params })
}

export function getDiscountRuleDetail(id: number): Promise<ApiResponse<MarketingDiscountRule>> {
  return request.get<MarketingDiscountRule>(`/marketing/discount-rule/${id}`)
}

export function validateCreateDiscountRule(data: DiscountRuleForm & { originalAmount?: number }): Promise<ApiResponse<DiscountValidateResult>> {
  return request.post<DiscountValidateResult>('/marketing/discount-rule/validate/create', data)
}

export function createDiscountRule(data: DiscountRuleForm): Promise<ApiResponse<MarketingDiscountRule>> {
  return request.post<MarketingDiscountRule>('/marketing/discount-rule/create', data)
}

export function updateDiscountRule(id: number, data: DiscountRuleForm): Promise<ApiResponse<MarketingDiscountRule>> {
  return request.put<MarketingDiscountRule>(`/marketing/discount-rule/${id}`, data)
}

export function enableDiscountRule(id: number): Promise<ApiResponse<MarketingDiscountRule>> {
  return request.post<MarketingDiscountRule>(`/marketing/discount-rule/enable/${id}`)
}

export function disableDiscountRule(id: number): Promise<ApiResponse<MarketingDiscountRule>> {
  return request.post<MarketingDiscountRule>(`/marketing/discount-rule/disable/${id}`)
}

export function adjustDiscountThreshold(id: number, field: string, value: number): Promise<ApiResponse<MarketingDiscountRule>> {
  return request.post<MarketingDiscountRule>(`/marketing/discount-rule/adjust/${id}`, { field, value })
}

export function checkDiscountStacking(ruleIds: number[]): Promise<ApiResponse<{ illegal: boolean; conflicts: MarketingDiscountStackConflict[] }>> {
  return request.post('/marketing/discount-rule/check-stacking', { ruleIds })
}

export function calculateOptimalCombination(marketingId: number, originalAmount: number): Promise<ApiResponse<DiscountRuleCombination>> {
  return request.post('/marketing/discount-rule/calculate-optimal', { marketingId, originalAmount })
}

export function batchEnableDiscountRules(ids: number[]): Promise<ApiResponse<DiscountBatchResult>> {
  return request.post('/marketing/discount-rule/enable', { ids })
}

export function batchDisableDiscountRules(ids: number[]): Promise<ApiResponse<DiscountBatchResult>> {
  return request.post('/marketing/discount-rule/disable', { ids })
}

export function batchAdjustDiscountThreshold(ids: number[], field: string, value: number): Promise<ApiResponse<DiscountBatchResult>> {
  return request.post('/marketing/discount-rule/adjust-threshold', { ids, field, value })
}

export function batchClearExpiredDiscountQuota(marketingId: number): Promise<ApiResponse<DiscountBatchResult>> {
  return request.post('/marketing/discount-rule/clear-quota', { marketingId })
}

export function batchFilterOperateDiscount(data: {
  operation: string
  marketingId?: number
  discountType?: number
  effectiveStatus?: number
  keyword?: string
  minAmountMin?: number
  minAmountMax?: number
}): Promise<ApiResponse<DiscountBatchResult>> {
  return request.post('/marketing/discount-rule/filter-operate', data)
}

export function getDiscountRuleTrace(id: number): Promise<ApiResponse<DiscountRuleTraceData>> {
  return request.get<DiscountRuleTraceData>(`/marketing/discount-rule/trace/${id}`)
}

export function getDiscountRuleLogs(id: number, params?: PageParams): Promise<ApiResponse<PageResult<MarketingDiscountRuleLog>>> {
  return request.get<PageResult<MarketingDiscountRuleLog>>(`/marketing/discount-rule/trace/logs/${id}`, { params })
}

export function getDiscountRuleUsage(id: number, params?: PageParams): Promise<ApiResponse<PageResult<MarketingDiscountUsageRecord>>> {
  return request.get<PageResult<MarketingDiscountUsageRecord>>(`/marketing/discount-rule/trace/usage/${id}`, { params })
}

export function getDiscountRuleConflicts(id: number): Promise<ApiResponse<MarketingDiscountStackConflict[]>> {
  return request.get<MarketingDiscountStackConflict[]>(`/marketing/discount-rule/trace/conflicts/${id}`)
}

export function getDiscountRuleBudget(id: number, params?: PageParams): Promise<ApiResponse<PageResult<MarketingDiscountBudgetLedger>>> {
  return request.get<PageResult<MarketingDiscountBudgetLedger>>(`/marketing/discount-rule/trace/budget/${id}`, { params })
}

export function checkDiscountOverLimit(marketingId: number): Promise<ApiResponse<{ overLimit: boolean; overLimitRules: MarketingDiscountRule[]; message: string }>> {
  return request.get('/marketing/discount-rule/trace/check-overlimit', { params: { marketingId } })
}

export function getMarketingBudgetLedger(marketingId: number, params?: PageParams): Promise<ApiResponse<PageResult<MarketingDiscountBudgetLedger>>> {
  return request.get<PageResult<MarketingDiscountBudgetLedger>>(`/marketing/discount-rule/trace/marketing-budget/${marketingId}`, { params })
}
