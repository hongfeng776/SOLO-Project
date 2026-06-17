import { get, post, put, del } from '@utils/request'
import type { PageParams, PageResult } from '@types'
import type { ChannelBusiness, Transaction, Product } from '@types/business'

export interface ChannelQueryParams extends PageParams {
  channelCode?: string
  businessType?: number
  statDate?: string
}

export interface TransactionQueryParams extends PageParams {
  orderNo?: string
  channelCode?: string
  businessType?: number
  status?: number
  auditStatus?: number
  startTime?: string
  endTime?: string
}

export interface ProductQueryParams extends PageParams {
  name?: string
  category?: number
  status?: number
  riskLevel?: number
}

export function getChannelBusinessListApi(params: ChannelQueryParams) {
  return get<PageResult<ChannelBusiness>>('/business/channel/list', params)
}

export function getTransactionListApi(params: TransactionQueryParams) {
  return get<PageResult<Transaction>>('/business/transaction/list', params)
}

export function getTransactionDetailApi(id: number) {
  return get<Transaction>(`/business/transaction/${id}`)
}

export function getProductListApi(params: ProductQueryParams) {
  return get<PageResult<Product>>('/business/product/list', params)
}

export function getProductDetailApi(id: number) {
  return get<Product>(`/business/product/${id}`)
}

export function createProductApi(data: Partial<Product>) {
  return post<Product>('/business/product', data)
}

export function updateProductApi(data: Partial<Product>) {
  return put<Product>(`/business/product/${data.id}`, data)
}

export function deleteProductApi(id: number) {
  return del<void>(`/business/product/${id}`)
}

export interface Customer {
  id: string
  customerNo: string
  customerName: string
  idCardNo?: string
  idType?: number
  customerType?: number
  customerLevel?: number
  mobile?: string
  address?: string
  riskLevel?: number
  riskTags?: string
  status: number
  orgId?: string
  orgName?: string
  openDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomerForm {
  id?: string
  customerName: string
  idCardNo?: string
  idType?: number
  customerType?: number
  customerLevel?: number
  mobile?: string
  address?: string
  riskLevel?: number
  status: number
  orgId?: string
}

export interface CustomerQueryParams extends PageParams {
  customerNo?: string
  customerName?: string
  customerType?: number
  customerLevel?: number
  riskLevel?: number
  status?: number
  orgId?: string
}

export interface ViolationRecord {
  id: string
  violationNo: string
  customerId?: string
  customerNo?: string
  customerName?: string
  bizId?: string
  bizNo?: string
  bizType?: string
  violationType?: number
  violationLevel?: number
  description?: string
  ruleRef?: string
  status: number
  discovererId?: string
  discovererName?: string
  discovererOrgId?: string
  discovererOrgName?: string
  handlerId?: string
  handlerName?: string
  discoverTime?: string
  handleTime?: string
  rectification?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface ViolationRecordForm {
  customerNo?: string
  bizNo?: string
  bizType?: string
  violationType: number
  violationLevel: number
  description?: string
  ruleRef?: string
  discovererId?: string
  discovererOrgId?: string
}

export interface ViolationHandleBody {
  status?: number
  rectification?: string
  remark?: string
}

export interface ViolationQueryParams extends PageParams {
  violationNo?: string
  customerNo?: string
  customerName?: string
  bizNo?: string
  bizType?: string
  violationType?: number
  violationLevel?: number
  status?: number
  discovererOrgId?: string
}

export interface TransactionForm {
  id?: string
  channelCode?: string
  channelTerminal?: string
  type: number
  businessLine?: string
  amount: number
  currency?: string
  customerId?: string
  customerNo?: string
  payerAccount?: string
  payerName?: string
  payeeAccount?: string
  payeeName?: string
  payeeBankCode?: string
  productId?: string
  orgId?: string
  remark?: string
}

export interface BatchTransactionBody {
  remark?: string
}

export function createTransactionApi(data: TransactionForm) {
  return post<void>('/business/transaction', data)
}

export function updateTransactionApi(data: TransactionForm) {
  return put<void>(`/business/transaction/${data.id}`, data)
}

export function cancelTransactionApi(id: string) {
  return post<void>(`/business/transaction/${id}/cancel`)
}

export function freezeTransactionApi(id: string, remark?: string) {
  return post<void>(`/business/transaction/${id}/freeze`, { remark })
}

export function reverseTransactionApi(id: string, remark?: string) {
  return post<void>(`/business/transaction/${id}/reverse`, { remark })
}

export function batchTransactionApi(ids: string[], operation: 'cancel' | 'freeze' | 'reverse', remark?: string) {
  return post<void>('/business/transaction/batch', { ids, operation, remark })
}

export function getCustomerListApi(params: CustomerQueryParams) {
  return get<PageResult<Customer>>('/business/customer/list', params)
}

export function createCustomerApi(data: CustomerForm) {
  return post<Customer>('/business/customer', data)
}

export function updateCustomerApi(data: CustomerForm) {
  return put<Customer>(`/business/customer/${data.id}`, data)
}

export function deleteCustomerApi(id: string) {
  return del<void>(`/business/customer/${id}`)
}

export function getViolationListApi(params: ViolationQueryParams) {
  return get<PageResult<ViolationRecord>>('/business/violation/list', params)
}

export function handleViolationApi(id: string, body: ViolationHandleBody) {
  return put<void>(`/business/violation/${id}/handle`, body)
}

export function createViolationApi(body: ViolationRecordForm) {
  return post<ViolationRecord>('/business/violation', body)
}

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

export const IndustryTypeOptions: Array<{ label: string; value: string }> = [
  { label: '农、林、牧、渔业', value: 'agriculture' },
  { label: '采矿业', value: 'mining' },
  { label: '制造业', value: 'manufacturing' },
  { label: '电力、热力、燃气及水生产和供应业', value: 'energy' },
  { label: '建筑业', value: 'construction' },
  { label: '批发和零售业', value: 'wholesale_retail' },
  { label: '交通运输、仓储和邮政业', value: 'transportation' },
  { label: '住宿和餐饮业', value: 'accommodation_catering' },
  { label: '信息传输、软件和信息技术服务业', value: 'it' },
  { label: '金融业', value: 'finance' },
  { label: '房地产业', value: 'real_estate' },
  { label: '租赁和商务服务业', value: 'leasing_business' },
  { label: '科学研究和技术服务业', value: 'research' },
  { label: '水利、环境和公共设施管理业', value: 'environment' },
  { label: '居民服务、修理和其他服务业', value: 'services' },
  { label: '教育', value: 'education' },
  { label: '卫生和社会工作', value: 'healthcare' },
  { label: '文化、体育和娱乐业', value: 'culture_sports' },
  { label: '公共管理、社会保障和社会组织', value: 'public_management' }
]

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
  industryType?: string
  startTime?: string
  endTime?: string
}

export interface CorporateBatchImportItem {
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

export interface CorporateBatchImportResultItem {
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

export interface CorporateBatchReviewItem {
  id: string
  operation: 'approve' | 'reject' | 'pause' | 'resume' | 'isolate' | 'deisolate'
  reason?: string
}

export interface CorporateBatchReviewRequest {
  items: CorporateBatchReviewItem[]
}

export interface CorporateBatchReviewResult {
  successCount: number
  failCount: number
  details: Array<{
    id: string
    success: boolean
    message?: string
  }>
}

export interface CorporateTraceCheckRequest {
  creditCode: string
  enterpriseName?: string
  legalIdCardNo?: string
  agentIdCardNo?: string
}

export interface CorporateTraceCheckResponse {
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
    closeDate?: string
    abnormalReason?: string
  }>
  isDishonest: boolean
  isAbnormal: boolean
  legalVerified: boolean
  agentVerified: boolean
  riskPrompts: string[]
  allowed: boolean
  blockReason?: string
}

export function getCorporateOpeningListApi(params: CorporateOpeningQueryParams) {
  return get<PageResult<CorporateOpening>>('/business/corporate/opening/list', params)
}

export function getCorporateOpeningDetailApi(id: string) {
  return get<CorporateOpening>(`/business/corporate/opening/${id}`)
}

export function refreshCorporateOpeningApi(id: string) {
  return post<CorporateOpening>(`/business/corporate/opening/${id}/refresh`)
}

export function batchImportCorporateOpeningApi(data: { items: CorporateBatchImportItem[] }) {
  return post<CorporateBatchImportResultItem[]>('/business/corporate/opening/batch/import', data)
}

export function batchReviewCorporateOpeningApi(data: CorporateBatchReviewRequest) {
  return post<CorporateBatchReviewResult>('/business/corporate/opening/batch/review', data)
}

export function traceCheckCorporateOpeningApi(data: CorporateTraceCheckRequest) {
  return post<CorporateTraceCheckResponse>('/business/corporate/opening/trace', data)
}
