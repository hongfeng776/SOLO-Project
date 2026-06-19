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

// ========== 个人客户档案建档管控 ==========

export interface PreCheckFieldError {
  field: string
  message: string
  code?: string
}

export interface PreCheckResult {
  passed: boolean
  blocked: boolean
  id_verify_status: number
  face_verify_status: number
  mobile_verify_status: number
  police_verify_status: number
  info_completeness: number
  missing_fields: string[]
  errors: PreCheckFieldError[]
  warnings: string[]
  block_reason?: string
}

export interface LevelJudgeResult {
  customer_level: number
  customer_level_text: string
  customer_tags: string[]
  service_permissions: string[]
  judge_factors: {
    total_assets: number
    monthly_transaction_count: number
    retention_days: number
  }
  judge_rules: string[]
}

export interface CustomerProfile {
  id: string
  profile_no: string
  org_id?: string
  org_name?: string
  customer_name: string
  id_card_no: string
  id_type?: number
  id_type_text?: string
  gender?: string
  gender_text?: string
  birth_date?: string
  nation?: string
  mobile: string
  email?: string
  registered_address: string
  residential_address: string
  occupation?: string
  employer?: string
  position?: string
  education?: string
  marital_status?: string
  total_assets?: number
  monthly_transaction_count?: number
  retention_days?: number
  customer_level: number
  customer_level_text?: string
  customer_tags?: string
  customer_tag_list?: string[]
  service_permissions?: string
  service_permission_list?: string[]
  id_verify_status: number
  id_verify_status_text?: string
  face_verify_status: number
  face_verify_status_text?: string
  mobile_verify_status: number
  mobile_verify_status_text?: string
  police_verify_status: number
  police_verify_status_text?: string
  police_verify_reason?: string
  info_completeness: number
  missing_fields?: string
  missing_field_list?: string[]
  need_complete: number
  is_abnormal: number
  abnormal_reason?: string
  status: number
  status_text?: string
  related_customer_id?: string
  creator_id?: string
  creator_name?: string
  profile_time?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomerProfileForm {
  id?: string
  org_id?: string
  customer_name: string
  id_card_no: string
  id_type?: number
  gender?: string
  birth_date?: string
  nation?: string
  mobile: string
  email?: string
  registered_address: string
  residential_address: string
  occupation?: string
  employer?: string
  position?: string
  education?: string
  marital_status?: string
  total_assets?: number
  monthly_transaction_count?: number
  retention_days?: number
  related_customer_id?: string
  change_remark?: string
  skip_precheck?: boolean
}

export interface CustomerProfileQueryParams extends PageParams {
  keyword?: string
  profile_no?: string
  customer_name?: string
  id_card_no?: string
  mobile?: string
  customer_level?: number
  status?: number
  need_complete?: number
  is_abnormal?: number
  org_id?: string
  start_time?: string
  end_time?: string
}

export interface CustomerProfileLog {
  id: string
  profile_id: string
  profile_no?: string
  change_type: string
  change_type_name?: string
  before_content?: string
  after_content?: string
  change_remark?: string
  operator_id?: string
  operator_name?: string
  operator_org_id?: string
  operator_org_name?: string
  operate_time?: string
  reviewer_id?: string
  reviewer_name?: string
  review_time?: string
  status: number
}

export interface CustomerProfileTraceRecord {
  id: string
  profile_no: string
  customer_name: string
  id_card_no: string
  status: number
  status_text?: string
  customer_level: number
  customer_level_text?: string
  change_type?: string
  change_type_name?: string
  operate_time?: string
  operator_name?: string
  org_name?: string
  remark?: string
}

export interface CustomerProfileTraceRequest {
  id_card_no: string
  customer_name?: string
  mobile?: string
}

export interface CustomerProfileTraceResponse {
  id_card_no: string
  matched: boolean
  total_profiles: number
  total_active: number
  total_closed: number
  total_abnormal: number
  has_duplicate: boolean
  has_fake_info: boolean
  history_records: CustomerProfileTraceRecord[]
  change_logs: CustomerProfileLog[]
  risk_prompts: string[]
  allowed: boolean
  block_reason?: string
}

export interface BatchImportItem {
  row_index: number
  customer_name?: string
  id_card_no?: string
  id_type?: number
  gender?: string
  mobile?: string
  registered_address?: string
  residential_address?: string
  occupation?: string
  employer?: string
  total_assets?: number
  monthly_transaction_count?: number
  retention_days?: number
}

export interface BatchImportRequest {
  org_id?: string
  batch_name?: string
  file_name?: string
  file_url?: string
  items: BatchImportItem[]
}

export interface BatchImportResultItem {
  row_index: number
  profile_id?: string
  profile_no?: string
  customer_name?: string
  id_card_no?: string
  process_result: number
  process_result_text?: string
  process_message?: string
  errors?: PreCheckFieldError[]
  missing_fields?: string[]
  warnings?: string[]
  is_abnormal?: boolean
  abnormal_reason?: string
}

export interface BatchImportResponse {
  batch_id: string
  batch_no: string
  batch_name?: string
  total_count: number
  success_count: number
  fail_count: number
  need_complete_count: number
  abnormal_count: number
  status: number
  status_text?: string
  items: BatchImportResultItem[]
}

export interface BatchVO {
  id: string
  batch_no: string
  org_id?: string
  org_name?: string
  batch_name?: string
  total_count: number
  success_count: number
  fail_count: number
  need_complete_count: number
  abnormal_count: number
  file_url?: string
  file_name?: string
  status: number
  status_text?: string
  fail_reason?: string
  creator_id?: string
  creator_name?: string
  import_time?: string
  finish_time?: string
  createdAt?: string
}

export interface BatchItemVO {
  id: string
  batch_id: string
  row_index: number
  profile_id?: string
  customer_name?: string
  id_card_no?: string
  mobile?: string
  total_assets?: number
  process_result: number
  process_result_text?: string
  process_message?: string
  error_field_list?: PreCheckFieldError[]
  missing_field_list?: string[]
}

export interface BatchQueryParams extends PageParams {
  batch_no?: string
  batch_name?: string
  status?: number
  org_id?: string
  start_time?: string
  end_time?: string
}

export interface BatchItemQueryParams extends PageParams {
  batch_id: string
  process_result?: number
  keyword?: string
}

export interface ReviewAbnormalRequest {
  profile_id: string
  passed: boolean
  review_remark: string
}

export function preCheckCustomerProfileApi(data: CustomerProfileForm) {
  return post<PreCheckResult>('/business/customer-profile/precheck', data)
}

export function getCustomerProfileListApi(params: CustomerProfileQueryParams) {
  return get<PageResult<CustomerProfile>>('/business/customer-profile/list', params)
}

export function getCustomerProfileDetailApi(id: string) {
  return get<CustomerProfile>(`/business/customer-profile/${id}`)
}

export function createCustomerProfileApi(data: CustomerProfileForm) {
  return post<CustomerProfile>('/business/customer-profile', data)
}

export function updateCustomerProfileApi(data: CustomerProfileForm) {
  return put<CustomerProfile>(`/business/customer-profile/${data.id}`, data)
}

export function getCustomerProfileLogsApi(id: string) {
  return get<CustomerProfileLog[]>(`/business/customer-profile/${id}/logs`)
}

export function traceCustomerProfileApi(data: CustomerProfileTraceRequest) {
  return post<CustomerProfileTraceResponse>('/business/customer-profile/trace', data)
}

export function reviewAbnormalProfileApi(data: ReviewAbnormalRequest) {
  return post<CustomerProfile>('/business/customer-profile/review-abnormal', data)
}

export function batchImportCustomerProfileApi(data: BatchImportRequest) {
  return post<BatchImportResponse>('/business/customer-profile/batch/import', data)
}

export function getCustomerProfileBatchListApi(params: BatchQueryParams) {
  return get<PageResult<BatchVO>>('/business/customer-profile/batch/list', params)
}

export function getCustomerProfileBatchItemsApi(params: BatchItemQueryParams) {
  return get<PageResult<BatchItemVO>>('/business/customer-profile/batch/items', params)
}

// ========== 对公客户信息运维 ==========

export interface CorpPreCheckFieldError {
  field: string
  message: string
  code?: string
}

export interface CorpPreCheckResult {
  passed: boolean
  blocked: boolean
  filing_verify_status: number
  legal_verify_status: number
  qualification_verify_status: number
  info_completeness: number
  missing_fields: string[]
  errors: CorpPreCheckFieldError[]
  warnings: string[]
  block_reason?: string
}

export interface CorpTypeAdaptResult {
  customer_type: number
  customer_type_text: string
  credit_limit: number
  service_level: number
  service_level_text: string
  risk_level: number
  risk_level_text: string
  risk_tags: string[]
  service_permissions: string[]
  adapt_factors: {
    registered_capital: number
    business_years: number
    business_status: number
    industry_type: string
  }
  adapt_rules: string[]
}

export interface CorporateProfile {
  id: string
  profile_no: string
  org_id?: string
  org_name?: string
  enterprise_name: string
  credit_code: string
  enterprise_short_name?: string
  legal_representative: string
  legal_id_card_no: string
  legal_id_type?: number
  legal_id_type_text?: string
  legal_mobile?: string
  industry_type?: string
  industry_code?: string
  registered_capital?: number
  registered_address: string
  business_address?: string
  establish_date?: string
  business_years?: number
  business_status: number
  business_status_text?: string
  business_scope?: string
  license_no?: string
  license_valid_from?: string
  license_valid_to?: string
  license_permanent?: number
  customer_type: number
  customer_type_text?: string
  credit_limit?: number
  service_level: number
  service_level_text?: string
  risk_level: number
  risk_level_text?: string
  risk_tags?: string
  risk_tag_list?: string[]
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  filing_verify_status: number
  legal_verify_status: number
  qualification_verify_status: number
  is_dishonest: number
  dishonest_info?: string
  info_completeness: number
  missing_fields?: string
  missing_field_list?: string[]
  need_complete: number
  is_abnormal: number
  abnormal_reason?: string
  service_permissions?: string
  service_permission_list?: string[]
  status: number
  status_text?: string
  creator_id?: string
  creator_name?: string
  profile_time?: string
  created_at?: string
  updated_at?: string
}

export interface CorporateProfileForm {
  id?: string
  org_id?: string
  enterprise_name: string
  credit_code: string
  enterprise_short_name?: string
  legal_representative: string
  legal_id_card_no: string
  legal_id_type?: number
  legal_mobile?: string
  industry_type?: string
  industry_code?: string
  registered_capital?: number
  registered_address: string
  business_address?: string
  establish_date?: string
  business_years?: number
  business_status?: number
  business_scope?: string
  license_no?: string
  license_valid_from?: string
  license_valid_to?: string
  license_permanent?: number
  customer_type?: number
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  related_customer_id?: string
  skip_precheck?: boolean
  change_remark?: string
}

export interface CorporateProfileQueryParams extends PageParams {
  keyword?: string
  profile_no?: string
  enterprise_name?: string
  credit_code?: string
  customer_type?: number
  business_status?: number
  risk_level?: number
  status?: number
  need_complete?: number
  is_abnormal?: number
  is_dishonest?: number
  org_id?: string
  start_time?: string
  end_time?: string
}

export interface CorporateProfileLog {
  id: string
  profile_id: string
  profile_no?: string
  change_type: string
  change_type_name?: string
  before_content?: string
  after_content?: string
  change_remark?: string
  operator_id?: string
  operator_name?: string
  operator_org_id?: string
  operator_org_name?: string
  operate_time?: string
  reviewer_id?: string
  reviewer_name?: string
  review_time?: string
  status: number
}

export interface CorporateTraceRequest {
  credit_code: string
  enterprise_name?: string
}

export interface CorporateTraceRecord {
  id: string
  profile_no: string
  enterprise_name: string
  credit_code: string
  status: number
  status_text?: string
  customer_type: number
  customer_type_text?: string
  change_type?: string
  change_type_name?: string
  operate_time?: string
  operator_name?: string
  org_name?: string
  remark?: string
}

export interface CorporateTraceResponse {
  credit_code: string
  matched: boolean
  total_profiles: number
  total_active: number
  total_closed: number
  total_abnormal: number
  has_duplicate: boolean
  has_dishonest: boolean
  has_tampering: boolean
  history_records: CorporateTraceRecord[]
  change_logs: CorporateProfileLog[]
  risk_prompts: string[]
  allowed: boolean
  block_reason?: string
}

export interface CorpBatchUpdateItem {
  row_index: number
  credit_code?: string
  enterprise_name?: string
  business_status?: number
  industry_type?: string
  registered_capital?: number
  qualification_info?: string
  risk_level?: number
}

export interface CorpBatchUpdateRequest {
  org_id?: string
  batch_name?: string
  update_type: number
  file_name?: string
  file_url?: string
  items: CorpBatchUpdateItem[]
}

export interface CorpBatchUpdateResultItem {
  row_index: number
  profile_id?: string
  profile_no?: string
  enterprise_name?: string
  credit_code?: string
  process_result: number
  process_result_text?: string
  process_message?: string
  errors?: CorpPreCheckFieldError[]
  missing_fields?: string[]
  warnings?: string[]
  need_review?: boolean
  review_reason?: string
}

export interface CorpBatchUpdateResponse {
  batch_id: string
  batch_no: string
  batch_name?: string
  update_type: number
  total_count: number
  success_count: number
  fail_count: number
  need_complete_count: number
  review_count: number
  status: number
  status_text?: string
  items: CorpBatchUpdateResultItem[]
}

export interface CorpBatchQueryParams extends PageParams {
  batch_no?: string
  batch_name?: string
  update_type?: number
  status?: number
  org_id?: string
  start_time?: string
  end_time?: string
}

export interface CorpBatchVO {
  id: string
  batch_no: string
  org_id?: string
  org_name?: string
  batch_name?: string
  update_type: number
  update_type_text?: string
  total_count: number
  success_count: number
  fail_count: number
  need_complete_count: number
  review_count: number
  file_url?: string
  file_name?: string
  status: number
  status_text?: string
  fail_reason?: string
  creator_id?: string
  creator_name?: string
  import_time?: string
  finish_time?: string
  created_at?: string
}

export interface CorpBatchItemVO {
  id: string
  batch_id: string
  row_index: number
  profile_id?: string
  enterprise_name?: string
  credit_code?: string
  business_status?: number
  industry_type?: string
  registered_capital?: number
  risk_level?: number
  process_result: number
  process_result_text?: string
  process_message?: string
  error_field_list?: CorpPreCheckFieldError[]
  missing_field_list?: string[]
  created_at?: string
}

export interface CorpReviewAbnormalRequest {
  profile_id: string
  passed: boolean
  review_remark: string
}

export function preCheckCorporateProfileApi(data: CorporateProfileForm) {
  return post<CorpPreCheckResult>('/business/corporate-profile/precheck', data)
}

export function adaptCorporateTypeApi(data: { registered_capital: number; business_years: number; business_status: number; industry_type: string }) {
  return post<CorpTypeAdaptResult>('/business/corporate-profile/adapt-type', data)
}

export function getCorporateProfileListApi(params: CorporateProfileQueryParams) {
  return get<PageResult<CorporateProfile>>('/business/corporate-profile/list', params)
}

export function getCorporateProfileDetailApi(id: string) {
  return get<CorporateProfile>(`/business/corporate-profile/${id}`)
}

export function createCorporateProfileApi(data: CorporateProfileForm) {
  return post<CorporateProfile>('/business/corporate-profile', data)
}

export function updateCorporateProfileApi(id: string, data: CorporateProfileForm) {
  return put<CorporateProfile>(`/business/corporate-profile/${id}`, data)
}

export function getCorporateProfileLogsApi(id: string) {
  return get<CorporateProfileLog[]>(`/business/corporate-profile/${id}/logs`)
}

export function traceCorporateProfileApi(data: CorporateTraceRequest) {
  return post<CorporateTraceResponse>('/business/corporate-profile/trace', data)
}

export function reviewAbnormalCorporateApi(data: CorpReviewAbnormalRequest) {
  return post<CorporateProfile>('/business/corporate-profile/review-abnormal', data)
}

export function batchUpdateCorporateProfileApi(data: CorpBatchUpdateRequest) {
  return post<CorpBatchUpdateResponse>('/business/corporate-profile/batch/update', data)
}

export function getCorporateProfileBatchListApi(params: CorpBatchQueryParams) {
  return get<PageResult<CorpBatchVO>>('/business/corporate-profile/batch/list', params)
}

export function getCorporateProfileBatchItemsApi(params: { batch_id: string; page?: number; pageSize?: number; process_result?: number; keyword?: string }) {
  return get<PageResult<CorpBatchItemVO>>('/business/corporate-profile/batch/items', params)
}

// ========== 客户等级标签管理类型定义 ==========
export interface TagPreCheckFieldError {
  field: string
  message: string
  code?: string
}

export interface TagPreCheckResult {
  passed: boolean
  blocked: boolean
  asset_data_ready: boolean
  transaction_data_ready: boolean
  retention_data_ready: boolean
  risk_data_ready: boolean
  all_data_ready: boolean
  tag_compliance_valid: boolean
  tag_customer_group_match: boolean
  errors: TagPreCheckFieldError[]
  warnings: string[]
  block_reason?: string
}

export interface TagAdaptResult {
  tag_code: string
  tag_name: string
  tag_type: number
  customer_level: number
  customer_level_text: string
  service_permissions: string[]
  fee_discounts: { code: string; name: string; discount: number }[]
  marketing_rules: { code: string; name: string; description: string }[]
  adapt_factors: { asset_amount: number; transaction_count: number; retention_days: number; risk_level: number }
  adapt_rules: string[]
}

export interface CustomerTag {
  id: string
  customer_id: string
  customer_no?: string
  customer_name?: string
  customer_level: number
  customer_level_text?: string
  tag_code: string
  tag_name: string
  tag_type: number
  tag_type_text?: string
  tag_source: number
  tag_source_text?: string
  tag_status: number
  tag_status_text?: string
  effective_time?: string
  expire_time?: string
  service_permission_list?: string[]
  fee_discount_list?: { code: string; name: string; discount: number }[]
  marketing_rule_list?: { code: string; name: string; description: string }[]
  asset_data_status: number
  transaction_data_status: number
  retention_data_status: number
  risk_data_status: number
  all_data_ready: boolean
  asset_data_time?: string
  transaction_data_time?: string
  retention_data_time?: string
  risk_data_time?: string
  operator_id?: string
  operator_name?: string
  remark?: string
  created_at?: string
  updated_at?: string
}

export interface CustomerTagForm {
  customer_id: string
  tag_code: string
  tag_name: string
  tag_type?: number
  tag_source?: number
  effective_time?: string
  expire_time?: string
  remark?: string
  skip_precheck?: boolean
}

export interface CustomerTagQueryParams extends PageParams {
  keyword?: string
  customer_id?: string
  customer_no?: string
  customer_name?: string
  customer_level?: number
  tag_code?: string
  tag_type?: number
  tag_source?: number
  tag_status?: number
  data_ready?: number
  start_time?: string
  end_time?: string
}

export interface CustomerTagLog {
  id: string
  tag_id: string
  customer_id: string
  customer_no?: string
  customer_name?: string
  tag_code?: string
  tag_name?: string
  change_type: string
  change_type_name?: string
  before_content?: string
  after_content?: string
  change_remark?: string
  is_unauthorized: number
  is_violation: number
  block_reason?: string
  operator_id?: string
  operator_name?: string
  operator_org_id?: string
  operator_org_name?: string
  operate_time?: string
  reviewer_id?: string
  reviewer_name?: string
  review_time?: string
  status: number
  created_at?: string
  updated_at?: string
}

export interface TagTraceRequest {
  customer_id: string
  tag_code?: string
}

export interface TagTraceRecord {
  id: string
  tag_id: string
  customer_id: string
  customer_no?: string
  customer_name?: string
  tag_code: string
  tag_name: string
  tag_status: number
  tag_status_text?: string
  change_type?: string
  change_type_name?: string
  operate_time?: string
  operator_name?: string
  is_unauthorized: number
  is_violation: number
  block_reason?: string
}

export interface TagTraceResponse {
  customer_id: string
  customer_name?: string
  matched: boolean
  total_tags: number
  active_tags: number
  expired_tags: number
  removed_tags: number
  has_unauthorized: boolean
  has_violation: boolean
  has_tampering: boolean
  history_records: TagTraceRecord[]
  change_logs: CustomerTagLog[]
  risk_prompts: string[]
  allowed: boolean
  block_reason?: string
}

export interface TagBatchItem {
  row_index: number
  customer_id?: string
  customer_no?: string
  customer_name?: string
  current_level?: number
  current_tags?: string
}

export interface TagBatchRequest {
  org_id?: string
  batch_name?: string
  operation_type: number
  target_tag_code?: string
  target_tag_name?: string
  filter_level?: number
  filter_tag_code?: string
  items: TagBatchItem[]
}

export interface TagBatchResultItem {
  row_index: number
  customer_id?: string
  customer_no?: string
  customer_name?: string
  current_level?: number
  process_result: number
  process_result_text?: string
  process_message?: string
  block_reason?: string
}

export interface TagBatchResponse {
  batch_id: string
  batch_no: string
  batch_name?: string
  operation_type: number
  total_count: number
  success_count: number
  fail_count: number
  unauthorized_count: number
  violation_count: number
  status: number
  status_text?: string
  items: TagBatchResultItem[]
}

export interface TagBatchQueryParams extends PageParams {
  batch_no?: string
  batch_name?: string
  operation_type?: number
  status?: number
  org_id?: string
  start_time?: string
  end_time?: string
}

export interface TagBatchVO {
  id: string
  batch_no: string
  org_id?: string
  org_name?: string
  batch_name?: string
  operation_type: number
  operation_type_text?: string
  target_tag_code?: string
  target_tag_name?: string
  total_count: number
  success_count: number
  fail_count: number
  unauthorized_count: number
  violation_count: number
  status: number
  status_text?: string
  fail_reason?: string
  creator_id?: string
  creator_name?: string
  create_time?: string
  finish_time?: string
  created_at?: string
  updated_at?: string
}

export interface TagBatchItemVO {
  id: string
  batch_id: string
  row_index: number
  customer_id?: string
  customer_no?: string
  customer_name?: string
  current_level?: number
  current_tags?: string
  process_result: number
  process_result_text?: string
  process_message?: string
  block_reason?: string
  created_at?: string
  updated_at?: string
}

// ========== 客户等级标签管理API ==========
export function preCheckCustomerTagApi(data: CustomerTagForm) {
  return post<TagPreCheckResult>('/business/customer-tag/precheck', data)
}

export function adaptCustomerTagApi(data: { tag_code: string; asset_amount: number; transaction_count: number; retention_days: number; risk_level: number }) {
  return post<TagAdaptResult>('/business/customer-tag/adapt', data)
}

export function getCustomerTagListApi(params: CustomerTagQueryParams) {
  return get<PageResult<CustomerTag>>('/business/customer-tag/list', params)
}

export function getCustomerTagDetailApi(id: string) {
  return get<CustomerTag>(`/business/customer-tag/${id}`)
}

export function createCustomerTagApi(data: CustomerTagForm) {
  return post<CustomerTag>('/business/customer-tag', data)
}

export function updateCustomerTagApi(id: string, data: Partial<CustomerTagForm>) {
  return put<CustomerTag>(`/business/customer-tag/${id}`, data)
}

export function adjustCustomerTagApi(data: { customer_id: string; old_tag_code: string; new_tag_code: string; new_tag_name: string; tag_type?: number; change_remark?: string }) {
  return post<CustomerTag>('/business/customer-tag/adjust', data)
}

export function removeCustomerTagApi(id: string) {
  return del<CustomerTag>(`/business/customer-tag/${id}`)
}

export function getCustomerTagLogsApi(id: string) {
  return get<CustomerTagLog[]>(`/business/customer-tag/${id}/logs`)
}

export function traceCustomerTagApi(data: TagTraceRequest) {
  return post<TagTraceResponse>('/business/customer-tag/trace', data)
}

export function batchUpdateCustomerTagApi(data: TagBatchRequest) {
  return post<TagBatchResponse>('/business/customer-tag/batch', data)
}

export function getCustomerTagBatchListApi(params: TagBatchQueryParams) {
  return get<PageResult<TagBatchVO>>('/business/customer-tag/batch/list', params)
}

export function getCustomerTagBatchItemsApi(params: { batch_id: string; page?: number; pageSize?: number; process_result?: number; keyword?: string }) {
  return get<PageResult<TagBatchItemVO>>('/business/customer-tag/batch/items', params)
}
