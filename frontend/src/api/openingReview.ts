import { get, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export enum OpeningType {
  PERSONAL = 1,
  CORPORATE = 2
}

export const OpeningTypeText: Record<number, string> = {
  1: '个人开户',
  2: '对公户开户'
}

export enum ReviewLevel {
  FIRST = 1,
  SECOND = 2,
  FINAL = 3
}

export const ReviewLevelText: Record<number, string> = {
  1: '初审',
  2: '复审',
  3: '终审'
}

export enum ReviewResult {
  APPROVED = 1,
  REJECTED = 2,
  CANCELLED = 3
}

export const ReviewResultText: Record<number, string> = {
  1: '通过',
  2: '驳回',
  3: '取消'
}

export enum ReviewStage {
  PENDING = 0,
  IN_REVIEW = 1,
  FIRST_PASS = 2,
  SECOND_PASS = 3,
  FINAL_PASS = 4,
  ALL_REJECTED = 5,
  CANCELLED = 6
}

export const ReviewStageText: Record<number, string> = {
  0: '待审核',
  1: '审核中',
  2: '初审通过',
  3: '复审通过',
  4: '终审通过',
  5: '已驳回',
  6: '已取消'
}

export const ReviewStageType: Record<number, string> = {
  0: 'info',
  1: 'warning',
  2: 'primary',
  3: 'success',
  4: 'success',
  5: 'danger',
  6: 'info'
}

export const RejectReasonOptions: Record<string, string> = {
  MATERIAL_MISSING: '资料缺失',
  MATERIAL_INVALID: '资料无效/伪造',
  IDENTITY_UNVERIFIED: '身份核验未通过',
  RISK_HIGH: '高风险客户',
  INFO_CONFLICT: '信息冲突不一致',
  LEGAL_ISSUE: '涉诉/违法记录',
  POLICY_RESTRICT: '政策限制',
  OTHER: '其他原因'
}

export interface OpeningReviewItem {
  id: string
  openingType: number
  openingNo: string
  customerName: string
  idCardNo: string
  accountTypeText: string
  riskLevelText: string
  channelCode: string
  submitTime: string
  submitterName: string
  reviewStage: number
  reviewStageText: string
  currentLevel: number
  nextLevel: number
  requiredLevel: number
  precheckPassed: number
  materialsUploaded: number
  riskPrechecked: number
  missingMaterials: string[]
  hasConflict: number
}

export interface ReviewLog {
  id: string
  openingType: number
  openingNo: string
  reviewLevel: number
  reviewLevelText: string
  reviewerName: string
  reviewResult: number
  reviewResultText: string
  reviewComment: string
  rejectReason: string
  rejectDetails: string
  supportingFiles: string
  reviewTime: string
}

export interface MaterialItem {
  name: string
  required: number
  provided: number
  passed: number
  message: string
}

export interface OpeningReviewDetail {
  basicInfo: Record<string, any>
  materialsList: MaterialItem[]
  precheckResult: any
  reviewLogs: ReviewLog[]
}

export interface ReviewSubmitForm {
  openingType: number
  openingId: string
  level: number
  result: number
  comment: string
  rejectReason?: string
  rejectDetails?: string
  supportingFiles?: string
}

export interface BatchReviewForm {
  ids: string[]
  openingType: number
  level: number
  result: number
  comment?: string
  rejectReason?: string
}

export interface ReviewTraceQuery {
  openingNo?: string
  idCardNo?: string
  creditCode?: string
}

export interface ReviewConfig {
  reviewLevels: Array<{ value: number; label: string; roles: string[] }>
  rejectReasons: Array<{ value: string; label: string }>
  reviewStages: Array<{ value: number; label: string; type: string }>
  accountTypes: Array<{ value: number; label: string }>
}

export interface ReviewPreCheck {
  canEnter: boolean
  reasons: string[]
  checklist: Array<{ name: string; passed: boolean; message: string }>
}

export interface ReviewTraceVO {
  openingList: OpeningReviewItem[]
  reviewLogs: ReviewLog[]
  consistencyReport: {
    basicInfoMatch: boolean
    materialConsistent: boolean
    riskLevelConsistent: boolean
    issues: string[]
  }
}

export interface OpeningReviewQueryParams extends PageParams {
  keyword?: string
  openingNo?: string
  customerName?: string
  idCardNo?: string
  channelCode?: string
  accountType?: number
  reviewStage?: number
  openingType?: number
  currentLevel?: number
  startTime?: string
  endTime?: string
}

export function preCheckReviewApi(openingType: number, openingId: string) {
  return get<ReviewPreCheck>('/business/opening/review/precheck', { openingType, openingId })
}

export function getReviewListApi(params: OpeningReviewQueryParams) {
  return get<PageResult<OpeningReviewItem>>('/business/opening/review/list', params)
}

export function getReviewDetailApi(openingType: number, openingId: string) {
  return get<OpeningReviewDetail>('/business/opening/review/detail', { openingType, openingId })
}

export function submitReviewApi(data: ReviewSubmitForm) {
  return post<OpeningReviewItem>('/business/opening/review/submit', data)
}

export function batchReviewApi(data: BatchReviewForm) {
  return post<{ successCount: number; failCount: number; details: Array<{ id: string; success: boolean; message?: string }> }>('/business/opening/review/batch', data)
}

export function traceReviewApi(data: ReviewTraceQuery) {
  return post<ReviewTraceVO>('/business/opening/review/trace', data)
}

export function getReviewConfigApi() {
  return get<ReviewConfig>('/business/opening/review/config')
}
