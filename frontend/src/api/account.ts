import { get, post, put } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export enum AccountType {
  TYPE_I = 1,
  TYPE_II = 2,
  TYPE_III = 3
}

export const AccountTypeText: Record<number, string> = {
  1: '一类账户（普通）',
  2: '二类账户',
  3: '三类账户'
}

export const AccountTypeConfig: Record<number, {
  dailyLimit: number
  singleLimit: number
  annualFee: number
  permissions: string[]
  description: string
}> = {
  1: {
    dailyLimit: 200000,
    singleLimit: 50000,
    annualFee: 10,
    permissions: ['transfer', 'deposit', 'withdraw', 'payment', 'online_banking', 'mobile_banking', 'investment', 'loan'],
    description: '全功能账户，无交易场景限制，作为主账户使用'
  },
  2: {
    dailyLimit: 10000,
    singleLimit: 5000,
    annualFee: 0,
    permissions: ['transfer', 'deposit', 'payment', 'online_banking', 'mobile_banking'],
    description: '限制功能账户，可办理存款、购买投资理财产品、限额消费和缴费、限额向非绑定账户转出资金'
  },
  3: {
    dailyLimit: 2000,
    singleLimit: 1000,
    annualFee: 0,
    permissions: ['payment', 'mobile_banking'],
    description: '小额支付账户，仅支持小额消费和缴费支付，最高余额不超过2000元'
  }
}

export enum AccountOpeningStatus {
  PENDING_PRECHECK = 0,
  PRECHECK_PASSED = 1,
  FILLING = 2,
  PENDING_REVIEW = 3,
  REVIEW_PASSED = 4,
  ACCOUNT_OPENED = 5,
  REJECTED = 6,
  CANCELLED = 7,
  REFUSED = 8
}

export const AccountOpeningStatusText: Record<number, string> = {
  0: '待预检',
  1: '预检通过待录入',
  2: '录入中',
  3: '待复核',
  4: '复核通过待开户',
  5: '已开户',
  6: '已驳回',
  7: '已取消',
  8: '已拒绝'
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
  atm: '自助设备',
  phone: '电话银行',
  smart: '智慧柜员',
  pos: 'POS终端',
  wechat: '微信',
  alipay: '支付宝'
}

export interface PrecheckItem {
  field: string
  passed: boolean
  message: string
  level?: 'error' | 'warning' | 'info'
}

export interface PrecheckResponse {
  passed: boolean
  overallScore: number
  items: PrecheckItem[]
  riskLevel: number
  riskTags: string[]
  customerExists: boolean
  customerId?: string
  customerNo?: string
  requireManualReview: boolean
  blockedReason?: string
}

export interface PrecheckRequest {
  customerName: string
  idCardNo: string
  mobile: string
  idValidFrom?: string
  idValidTo?: string
  idPermanent?: number
  accountType?: number
  channelCode?: string
}

export interface AccountOpening {
  id: string
  openingNo: string
  customerId?: string
  customerNo?: string
  accountType: number
  accountTypeText: string
  customerName: string
  idCardNo: string
  idMasked?: string
  mobile: string
  mobileMasked?: string
  mobileVerified?: number
  residentialAddress?: string
  targetOrgId?: string
  targetOrgName?: string
  regionMatched?: number
  regionMatchedText?: string
  openPurpose?: string
  imageUrls?: string
  imageClarityScore?: string
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
  isIsolated: number
  isolateReason?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface AccountOpeningForm {
  accountType: number
  customerName: string
  idCardNo: string
  idType?: number
  idValidFrom?: string
  idValidTo?: string
  idPermanent?: number
  mobile: string
  mobileVerified?: number
  residentialAddress?: string
  residentialProvinceCode?: string
  targetOrgId?: string
  targetOrgProvinceCode?: string
  regionMatched?: number
  openPurpose?: string
  imageUrls?: string
  imageClarityScore?: string
  channelCode?: string
  remark?: string
}

export interface AccountOpeningQueryParams extends PageParams {
  keyword?: string
  openingNo?: string
  customerName?: string
  idCardNo?: string
  accountType?: number
  status?: number
  riskLevel?: number
  channelCode?: string
  isIsolated?: number
  submitOrgId?: string
  startTime?: string
  endTime?: string
}

export interface BatchImportItem {
  customerName: string
  idCardNo: string
  mobile: string
  accountType: number
  idValidFrom?: string
  idValidTo?: string
  idPermanent?: number
  residentialAddress?: string
  openPurpose?: string
  targetOrgId?: string
  imageUrls?: string
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
}

export interface BatchReviewRequest {
  ids: string[]
  operation: 'approve' | 'reject' | 'isolate' | 'deisolate'
  reason?: string
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
  idCardNo: string
  customerName?: string
}

export interface TraceCheckResponse {
  idCardNo: string
  matched: boolean
  totalOpenings: number
  recentOpenings: Array<{
    openingNo: string
    accountType: number
    status: number
    createdAt: string
    targetOrgName?: string
  }>
  duplicateRisk: boolean
  duplicateRiskReason?: string
  imageChecks: {
    clarityOk: boolean
    consistencyOk: boolean
    validityOk: boolean
    details?: string[]
  }
  allowed: boolean
  blockReason?: string
}

export interface Account {
  id: string
  accountNo: string
  customerId: string
  customerNo?: string
  customerName?: string
  accountType: number
  accountTypeText: string
  alias?: string
  currency: string
  balance: number
  availableBalance: number
  frozenAmount: number
  dailyLimit: number
  singleLimit: number
  annualFee: number
  openPurpose?: string
  functionPermissions?: string
  openOrgId?: string
  openOrgName?: string
  openOperatorId?: string
  openOperatorName?: string
  status: number
  statusText: string
  openDate?: string
  closeDate?: string
  openingId?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export function precheckOpeningApi(data: PrecheckRequest) {
  return post<PrecheckResponse>('/business/opening/precheck', data)
}

export function traceCheckOpeningApi(data: TraceCheckRequest) {
  return post<TraceCheckResponse>('/business/opening/trace', data)
}

export function getOpeningListApi(params: AccountOpeningQueryParams) {
  return get<PageResult<AccountOpening>>('/business/opening/list', params)
}

export function getOpeningDetailApi(id: string) {
  return get<AccountOpening>(`/business/opening/${id}`)
}

export function createOpeningApi(data: AccountOpeningForm) {
  return post<AccountOpening>('/business/opening', data)
}

export function updateOpeningApi(id: string, data: Partial<AccountOpeningForm>) {
  return put<AccountOpening>(`/business/opening/${id}`, data)
}

export function cancelOpeningApi(id: string, remark?: string) {
  return post<AccountOpening>(`/business/opening/${id}/cancel`, { remark })
}

export function reviewOpeningApi(id: string, operation: 'approve' | 'reject', reason?: string) {
  return post<AccountOpening>(`/business/opening/${id}/review`, { operation, reason })
}

export function openAccountApi(id: string) {
  return post<AccountOpening>(`/business/opening/${id}/open`)
}

export function refreshOpeningApi(id: string) {
  return post<AccountOpening>(`/business/opening/${id}/refresh`)
}

export function batchImportOpeningApi(data: { items: BatchImportItem[] }) {
  return post<BatchImportResult[]>('/business/opening/batch/import', data)
}

export function batchReviewOpeningApi(data: BatchReviewRequest) {
  return post<BatchReviewResult>('/business/opening/batch/review', data)
}

export function getAccountListApi(params: PageParams & { keyword?: string; accountType?: number; status?: number }) {
  return get<PageResult<Account>>('/business/account/list', params)
}

export function getAccountDetailApi(id: string) {
  return get<Account>(`/business/account/${id}`)
}

export function getAccountsByCustomerApi(customerId: string) {
  return get<Account[]>(`/business/account/customer/${customerId}`)
}

export function updateAccountStatusApi(id: string, status: number, remark?: string) {
  return post<Account>(`/business/account/${id}/status`, { status, remark })
}
