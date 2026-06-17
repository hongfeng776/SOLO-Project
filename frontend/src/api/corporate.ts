import { get, post, put } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export enum CorporateAccountType {
  BASIC = 1,
  GENERAL = 2,
  SPECIAL = 3,
  TEMPORARY = 4
}

export const CorporateAccountTypeText: Record<number, string> = {
  1: '基本存款账户',
  2: '一般存款账户',
  3: '专用存款账户',
  4: '临时存款账户'
}

export const CorporateAccountTypeConfig: Record<number, {
  dailyLimit: number
  singleLimit: number
  annualFee: number
  permissions: string[]
  description: string
  approvalLevel: number
}> = {
  1: {
    dailyLimit: 50000000,
    singleLimit: 10000000,
    annualFee: 500,
    permissions: ['transfer', 'deposit', 'withdraw', 'payment', 'online_banking', 'mobile_banking', 'loan', 'payroll', 'tax', 'trade', 'investment'],
    description: '基本存款账户是存款人办理日常转账结算和现金收付的账户，是存款人的主办账户',
    approvalLevel: 3
  },
  2: {
    dailyLimit: 20000000,
    singleLimit: 5000000,
    annualFee: 300,
    permissions: ['transfer', 'deposit', 'payment', 'online_banking', 'mobile_banking', 'loan', 'payroll', 'tax'],
    description: '一般存款账户用于办理存款人借款转存、借款归还和其他结算的资金收付，不得办理现金支取',
    approvalLevel: 2
  },
  3: {
    dailyLimit: 10000000,
    singleLimit: 2000000,
    annualFee: 200,
    permissions: ['transfer', 'deposit', 'payment', 'online_banking', 'special_fund'],
    description: '专用存款账户用于办理各项专用资金的收付，如基本建设资金、更新改造资金、财政预算外资金等',
    approvalLevel: 2
  },
  4: {
    dailyLimit: 5000000,
    singleLimit: 1000000,
    annualFee: 100,
    permissions: ['transfer', 'deposit', 'payment', 'online_banking'],
    description: '临时存款账户用于办理临时机构以及存款人临时经营活动发生的资金收付，有效期最长不得超过2年',
    approvalLevel: 1
  }
}

export enum BusinessStatus {
  NORMAL = 1,
  SUSPENDED = 2,
  CANCELLED = 3,
  REVOKED = 4,
  MOVED_IN = 5,
  MOVED_OUT = 6
}

export const BusinessStatusText: Record<number, string> = {
  1: '正常经营',
  2: '停业',
  3: '注销',
  4: '吊销',
  5: '迁入',
  6: '迁出'
}

export enum CorporateOpeningStatus {
  PENDING_PRECHECK = 0,
  PRECHECK_PASSED = 1,
  FILLING = 2,
  PENDING_REVIEW = 3,
  REVIEW_PASSED = 4,
  ACCOUNT_OPENED = 5,
  REJECTED = 6,
  CANCELLED = 7,
  REFUSED = 8,
  PAUSED = 9
}

export const CorporateOpeningStatusText: Record<number, string> = {
  0: '待预检',
  1: '预检通过待录入',
  2: '录入中',
  3: '待复核',
  4: '复核通过待开户',
  5: '已开户',
  6: '已驳回',
  7: '已取消',
  8: '已拒绝',
  9: '已暂停'
}

export const RiskLevelText: Record<number, string> = {
  0: '无风险',
  1: '低风险',
  2: '中低风险',
  3: '中风险',
  4: '中高风险',
  5: '高风险'
}

export const ChannelText: Record<string, string> = {
  counter: '柜面',
  mobile: '手机银行',
  ebank: '网上银行',
  smart: '智慧柜员',
  pos: 'POS终端'
}

export interface PrecheckItem {
  name: string
  field: string
  passed: boolean
  score: number
  message: string
  level?: 'error' | 'warning' | 'info'
}

export interface PrecheckResponse {
  passed: boolean
  overallScore: number
  riskLevel: number
  items: PrecheckItem[]
  riskTags: string[]
  customerExists: boolean
  customerId?: string
  customerNo?: string
  requireManualReview: boolean
  blockedReason?: string
}

export interface PrecheckRequest {
  enterpriseName: string
  creditCode: string
  accountType?: number
  licenseValidFrom?: string
  licenseValidTo?: string
  licensePermanent?: number
  legalRepresentative?: string
  legalIdCardNo?: string
  legalVerified?: number
  authorizationComplete?: number
  industryType?: string
  registeredCapital?: number
  businessYears?: number
  channelCode?: string
}

export interface CorporateOpening {
  id: string
  openingNo: string
  customerId?: string
  customerNo?: string
  accountType: number
  accountTypeText: string
  enterpriseName: string
  creditCode: string
  licenseValidFrom?: string
  licenseValidTo?: string
  licensePermanent?: number
  legalRepresentative?: string
  legalIdCardNo?: string
  legalVerified?: number
  agentName?: string
  agentIdCardNo?: string
  agentMobile?: string
  agentVerified?: number
  registeredAddress?: string
  businessAddress?: string
  businessStatus?: number
  businessStatusText?: string
  taxRegistrationNo?: string
  taxInfoConsistent?: number
  industryType?: string
  registeredCapital?: number
  businessYears?: number
  authorizationComplete?: number
  targetOrgId?: string
  targetOrgName?: string
  openPurpose?: string
  supportingMaterials?: string
  approvalLevel?: string
  riskLevel: number
  riskLevelText: string
  riskTags?: string
  channelCode?: string
  channelText?: string
  status: number
  statusText: string
  precheckResult?: number
  precheckReasons?: any
  rejectReason?: string
  reviewerId?: string
  reviewerName?: string
  submitOrgId?: string
  submitOrgName?: string
  submitterId?: string
  submitterName?: string
  submitTime?: string
  reviewTime?: string
  accountId?: string
  accountNo?: string
  isDishonest: number
  isAbnormal: number
  isPaused: number
  isIsolated: number
  isolateReason?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface CorporateOpeningForm {
  accountType: number
  enterpriseName: string
  creditCode: string
  licenseValidFrom?: string
  licenseValidTo?: string
  licensePermanent?: number
  legalRepresentative?: string
  legalIdCardNo?: string
  legalVerified?: number
  agentName?: string
  agentIdCardNo?: string
  agentMobile?: string
  agentVerified?: number
  registeredAddress?: string
  businessAddress?: string
  businessStatus?: number
  taxRegistrationNo?: string
  taxInfoConsistent?: number
  industryType?: string
  registeredCapital?: number
  businessYears?: number
  authorizationComplete?: number
  targetOrgId?: string
  openPurpose?: string
  supportingMaterials?: string
  channelCode?: string
  remark?: string
}

export interface CorporateOpeningQueryParams extends PageParams {
  keyword?: string
  openingNo?: string
  enterpriseName?: string
  creditCode?: string
  accountType?: number
  status?: number
  riskLevel?: number
  channelCode?: string
  isIsolated?: number
  isPaused?: number
  submitOrgId?: string
  customerId?: string
  industryType?: string
  startTime?: string
  endTime?: string
}

export interface BatchImportItem {
  enterpriseName: string
  creditCode: string
  accountType: number
  licenseValidFrom?: string
  licenseValidTo?: string
  licensePermanent?: number
  legalRepresentative?: string
  legalIdCardNo?: string
  legalVerified?: number
  agentName?: string
  agentIdCardNo?: string
  agentMobile?: string
  registeredAddress?: string
  businessAddress?: string
  industryType?: string
  registeredCapital?: number
  businessYears?: number
  authorizationComplete?: number
  targetOrgId?: string
  openPurpose?: string
  supportingMaterials?: string
  channelCode?: string
  remark?: string
}

export interface BatchImportResult {
  index: number
  success: boolean
  openingId?: string
  openingNo?: string
  errors?: string[]
  warnings?: string[]
  needManualReview?: boolean
  riskLevel?: number
  status?: number
  isIsolated?: number
}

export interface BatchReviewItem {
  id: string
  operation: 'approve' | 'reject' | 'pause' | 'resume' | 'isolate' | 'deisolate'
  reason?: string
}

export interface BatchReviewRequest {
  items: BatchReviewItem[]
}

export interface BatchReviewResult {
  successCount: number
  failCount: number
  details: Array<{
    id: string
    success: boolean
    message?: string
  }>
}

export interface TraceCheckRequest {
  creditCode: string
  enterpriseName?: string
  legalIdCardNo?: string
  agentIdCardNo?: string
}

export interface TraceCheckResponse {
  creditCode: string
  matched: boolean
  totalOpenings: number
  totalClosed: number
  totalAbnormal: number
  historyRecords: Array<{
    openingNo: string
    accountType: number
    status: number
    createdAt: string
    targetOrgName?: string
  }>
  isDishonest: boolean
  isAbnormal: boolean
  legalVerified: boolean
  agentVerified: boolean
  riskPrompts: string[]
  allowed: boolean
  blockReason?: string
}

export interface AccountConfigResponse {
  accountTypes: Array<{
    type: number
    name: string
    description: string
    dailyLimit: number
    singleLimit: number
    annualFee: number
    permissions: string[]
    approvalLevel: number
  }>
  riskLevels: Record<number, string>
  channels: Record<string, string>
  businessStatus: Record<number, string>
}

export function precheckCorporateApi(data: PrecheckRequest) {
  return post<PrecheckResponse>('/business/corporate/precheck', data)
}

export function traceCheckCorporateApi(data: TraceCheckRequest) {
  return post<TraceCheckResponse>('/business/corporate/trace', data)
}

export function getCorporateListApi(params: CorporateOpeningQueryParams) {
  return get<PageResult<CorporateOpening>>('/business/corporate/list', params)
}

export function getCorporateDetailApi(id: string) {
  return get<CorporateOpening>(`/business/corporate/${id}`)
}

export function createCorporateApi(data: CorporateOpeningForm) {
  return post<CorporateOpening>('/business/corporate', data)
}

export function updateCorporateApi(id: string, data: Partial<CorporateOpeningForm>) {
  return put<CorporateOpening>(`/business/corporate/${id}`, data)
}

export function cancelCorporateApi(id: string, remark?: string) {
  return post<CorporateOpening>(`/business/corporate/${id}/cancel`, { remark })
}

export function reviewCorporateApi(id: string, operation: 'approve' | 'reject', reason?: string) {
  return post<CorporateOpening>(`/business/corporate/${id}/review`, { operation, reason })
}

export function openAccountCorporateApi(id: string) {
  return post<CorporateOpening>(`/business/corporate/${id}/open`)
}

export function refreshCorporateApi(id: string) {
  return post<CorporateOpening>(`/business/corporate/${id}/refresh`)
}

export function batchImportCorporateApi(data: { items: BatchImportItem[] }) {
  return post<BatchImportResult[]>('/business/corporate/batch/import', data)
}

export function batchReviewCorporateApi(data: BatchReviewRequest) {
  return post<BatchReviewResult>('/business/corporate/batch/review', data)
}

export function getCorporateConfigApi() {
  return get<AccountConfigResponse>('/business/corporate/config')
}
