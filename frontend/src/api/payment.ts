import { get, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export type PaymentChannel = 1 | 2 | 3 | 4
export type PaymentScene = 1 | 2 | 3 | 4 | 5
export type PaymentStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type MerchantStatus = 0 | 1 | 2 | 3
export type DeviceBindStatus = 0 | 1 | 2
export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5
export type BatchProcessOperation = 'confirm' | 'mark_abnormal' | 'retry' | 'refund' | 'close'

export const PAYMENT_CHANNEL_OPTIONS = [
  { label: '扫码支付', value: 1 },
  { label: '快捷支付', value: 2 },
  { label: '网关支付', value: 3 },
  { label: '代扣支付', value: 4 }
]

export const PAYMENT_SCENE_OPTIONS = [
  { label: '消费支付', value: 1 },
  { label: '账户充值', value: 2 },
  { label: '账户转账', value: 3 },
  { label: '水电缴费', value: 4 },
  { label: '理财购买', value: 5 }
]

export const PAYMENT_STATUS_OPTIONS = [
  { label: '待支付', value: 0, type: 'info' },
  { label: '支付中', value: 1, type: 'primary' },
  { label: '支付成功', value: 2, type: 'success' },
  { label: '支付失败', value: 3, type: 'danger' },
  { label: '已退款', value: 4, type: 'warning' },
  { label: '已关闭', value: 5, type: 'info' },
  { label: '已撤销', value: 6, type: 'warning' }
]

export const MERCHANT_STATUS_OPTIONS = [
  { label: '未审核', value: 0, type: 'warning' },
  { label: '正常', value: 1, type: 'success' },
  { label: '暂停', value: 2, type: 'warning' },
  { label: '封禁', value: 3, type: 'danger' }
]

export const DEVICE_BIND_STATUS_OPTIONS = [
  { label: '未绑定', value: 0, type: 'warning' },
  { label: '已绑定', value: 1, type: 'success' },
  { label: '已解绑', value: 2, type: 'info' }
]

export const RISK_LEVEL_OPTIONS = [
  { label: '无风险', value: 0, type: 'success' },
  { label: '低风险', value: 1, type: 'success' },
  { label: '中低风险', value: 2, type: 'info' },
  { label: '中风险', value: 3, type: 'warning' },
  { label: '中高风险', value: 4, type: 'warning' },
  { label: '高风险', value: 5, type: 'danger' }
]

export const BATCH_OPERATION_OPTIONS = [
  { label: '批量确认', value: 'confirm' },
  { label: '标记异常', value: 'mark_abnormal' },
  { label: '重试支付', value: 'retry' },
  { label: '批量退款', value: 'refund' },
  { label: '批量关闭', value: 'close' }
]

export const SUBJECT_OPTIONS = [
  { label: '超市购物', value: '超市购物' },
  { label: '餐厅消费', value: '餐厅消费' },
  { label: '加油服务', value: '加油服务' },
  { label: '水电缴费', value: '水电缴费' },
  { label: '手机充值', value: '手机充值' },
  { label: '理财购买', value: '理财购买' },
  { label: '基金申购', value: '基金申购' },
  { label: '信用卡还款', value: '信用卡还款' },
  { label: '游戏充值', value: '游戏充值' },
  { label: '酒店预订', value: '酒店预订' },
  { label: '机票出行', value: '机票出行' },
  { label: '网上转账', value: '网上转账' }
]

export const MCC_OPTIONS = [
  { label: '5411 - 超市', value: '5411' },
  { label: '5812 - 餐饮', value: '5812' },
  { label: '5541 - 加油站', value: '5541' },
  { label: '4814 - 电信服务', value: '4814' },
  { label: '4899 - 有线电视', value: '4899' },
  { label: '4900 - 水电煤气', value: '4900' },
  { label: '5999 - 综合零售', value: '5999' },
  { label: '5732 - 电子产品', value: '5732' },
  { label: '7011 - 酒店住宿', value: '7011' },
  { label: '4511 - 航空运输', value: '4511' }
]

export const SMS_VERIFY_THRESHOLD: Record<PaymentChannel, number> = {
  1: 10000,
  2: 500,
  3: 0,
  4: Infinity
}

export const SECOND_AUTH_TRUST_THRESHOLD = 3
export const RISK_SCORE_AUTO_PASS = 50
export const RISK_SCORE_NEED_REVIEW = 70
export const RISK_SCORE_AUTO_BLOCK = 70
export const DUPLICATE_ORDER_TIME_WINDOW = 60
export const MAX_RETRY_COUNT = 3

export const ONLINE_LIMIT_CONFIG: Record<PaymentChannel, {
  single_limit: number
  daily_limit: number
  monthly_limit: number
  yearly_limit: number
}> = {
  1: { single_limit: 50000, daily_limit: 200000, monthly_limit: 1000000, yearly_limit: 5000000 },
  2: { single_limit: 20000, daily_limit: 100000, monthly_limit: 500000, yearly_limit: 2000000 },
  3: { single_limit: 500000, daily_limit: 2000000, monthly_limit: 10000000, yearly_limit: 50000000 },
  4: { single_limit: 100000, daily_limit: 500000, monthly_limit: 2000000, yearly_limit: 10000000 }
}

export const CHANNEL_FEE_CONFIG: Record<PaymentChannel, {
  min_fee: number
  max_fee: number
  rate: number
}> = {
  1: { min_fee: 0, max_fee: 20, rate: 0.0038 },
  2: { min_fee: 0, max_fee: 50, rate: 0.005 },
  3: { min_fee: 0, max_fee: 100, rate: 0.006 },
  4: { min_fee: 0, max_fee: 30, rate: 0.002 }
}

export const SMS_VERIFY_RULES_CONFIG: Record<PaymentChannel, {
  required: boolean
  threshold_amount: number
  code_length: number
  expire_minutes: number
}> = {
  1: { required: false, threshold_amount: 10000, code_length: 6, expire_minutes: 5 },
  2: { required: true, threshold_amount: 500, code_length: 6, expire_minutes: 5 },
  3: { required: true, threshold_amount: 0, code_length: 6, expire_minutes: 10 },
  4: { required: false, threshold_amount: 50000, code_length: 4, expire_minutes: 30 }
}

export const ARCHIVE_RULES_CONFIG: Record<PaymentScene, {
  archive_days: number
  need_signature: boolean
  need_receipt: boolean
}> = {
  1: { archive_days: 365, need_signature: true, need_receipt: true },
  2: { archive_days: 180, need_signature: false, need_receipt: false },
  3: { archive_days: 365, need_signature: true, need_receipt: true },
  4: { archive_days: 730, need_signature: false, need_receipt: true },
  5: { archive_days: 1825, need_signature: true, need_receipt: true }
}

export const RISK_INTERCEPT_RULES = {
  strange_device_frequency_count: 5,
  strange_device_window_minutes: 30,
  false_merchant_check_keywords: ['非法', '赌博', '洗钱', '诈骗', '违规', '虚假'],
  duplicate_order_time_seconds: 60,
  abnormal_location_check: true,
  tamper_check_fields: ['amount', 'pay_channel', 'merchant_id', 'payer_account_no']
}

export interface FeeConfig {
  min_fee: number
  max_fee: number
  rate: number
}

export interface LimitConfig {
  single_limit: number
  daily_limit: number
  monthly_limit: number
  yearly_limit: number
}

export interface SmsVerifyRules {
  required: boolean
  threshold_amount: number
  code_length: number
  expire_minutes: number
}

export interface DeviceInfo {
  device_id: string
  device_fingerprint?: string
  device_type?: string
  device_model?: string
  os_type?: string
  os_version?: string
  app_version?: string
  ip_address: string
  user_agent?: string
  location?: string
  trust_level: number
  bind_status?: DeviceBindStatus
  last_login_time?: string
  first_bind_time?: string
}

export interface MerchantInfo {
  merchant_id: string
  merchant_name: string
  mcc?: string
  mcc_name?: string
  risk_level: RiskLevel
  status: MerchantStatus
  contact_phone?: string
  contact_email?: string
  business_license_no?: string
  settlement_bank?: string
  settlement_account?: string
  register_time?: string
}

export interface PaymentPreCheckRequest {
  payer_account_no: string
  pay_channel: PaymentChannel
  pay_scene: PaymentScene
  merchant: MerchantInfo
  amount: number
  subject: string
  body?: string
  device_info: DeviceInfo
  sms_code?: string
  trade_password_hash?: string
  request_id: string
}

export interface ChannelRemainingLimits {
  single_remaining: number
  daily_remaining: number
  monthly_remaining: number
  yearly_remaining: number
}

export interface FeeCalcResult {
  fee: number
  fee_calc_desc: string
  min_fee: number
  max_fee: number
  rate: number
}

export interface SmsInfo {
  required: boolean
  sent: boolean
  threshold_amount: number
  code_length: number
  expire_minutes: number
  verified: boolean
}

export interface AntiFraudInfo {
  risk_score: number
  risk_level: RiskLevel
  risk_tags: string[]
  need_review: boolean
  need_second_auth: boolean
  intercept_reason?: string
}

export interface PaymentPreCheckResult {
  passed: boolean
  blocked: boolean
  block_reason?: string
  block_field?: string
  warnings: string[]
  payer_account_valid: boolean
  payer_account_status: number
  payer_account_status_text: string
  payer_not_frozen: boolean
  payer_available_balance: number
  balance_sufficient: boolean
  merchant_valid: boolean
  merchant_status_normal: boolean
  amount_valid: boolean
  within_channel_limits: boolean
  need_sms_verify: boolean
  sms_verified: boolean
  need_trade_password: boolean
  trade_password_verified: boolean
  need_second_auth: boolean
  channel_limits: ChannelRemainingLimits
  fee_calc: FeeCalcResult
  sms_info: SmsInfo
  anti_fraud_info: AntiFraudInfo
}

export interface Payment {
  id: string
  payment_no: string
  order_no?: string
  request_id?: string
  pay_channel: PaymentChannel
  pay_scene: PaymentScene
  merchant_id: string
  merchant_name?: string
  merchant_mcc?: string
  payer_account_id?: string
  payer_account_no: string
  payer_account_name?: string
  payer_customer_id?: string
  payee_account_id?: string
  payee_account_no?: string
  payee_account_name?: string
  amount: number
  currency: string
  fee: number
  fee_calc_desc?: string
  actual_amount?: number
  subject: string
  body?: string
  device_id?: string
  device_fingerprint?: string
  ip_address?: string
  status: PaymentStatus
  status_reason?: string
  risk_level?: RiskLevel
  risk_score?: number
  risk_tags?: string
  is_risk: boolean
  need_review: boolean
  review_reason?: string
  reviewer_id?: string
  review_time?: string
  approved?: boolean
  sms_verified?: boolean
  trade_password_verified?: boolean
  second_auth_verified?: boolean
  original_payment_no?: string
  refund_amount?: number
  refund_time?: string
  refund_reason?: string
  close_reason?: string
  close_time?: string
  retry_count?: number
  last_retry_time?: string
  remark?: string
  org_id?: string
  operator_id?: string
  submit_time?: string
  pay_success_time?: string
  createdAt?: string
  updatedAt?: string
}

export interface PaymentVO extends Payment {
  pay_channel_text?: string
  pay_scene_text?: string
  status_text?: string
  merchant_status_text?: string
  device_bind_status_text?: string
  risk_level_text?: string
  amount_formatted?: string
  fee_formatted?: string
  actual_amount_formatted?: string
  payer_customer_name?: string
  merchant_status?: MerchantStatus
  device_bind_status?: DeviceBindStatus
  is_risk_warning?: boolean
  progress_percent?: number
}

export interface PaymentQueryParams extends PageParams {
  keyword?: string
  payment_no?: string
  order_no?: string
  request_id?: string
  payer_account_no?: string
  payer_customer_id?: string
  merchant_id?: string
  merchant_name?: string
  pay_channel?: PaymentChannel
  pay_scene?: PaymentScene
  status?: PaymentStatus
  risk_level?: RiskLevel
  is_risk?: boolean
  need_review?: boolean
  approved?: boolean
  org_id?: string
  operator_id?: string
  reviewer_id?: string
  start_time?: string
  end_time?: string
  min_amount?: number
  max_amount?: number
}

export interface CreatePaymentRequest {
  payer_account_no: string
  pay_channel: PaymentChannel
  pay_scene: PaymentScene
  merchant: MerchantInfo
  amount: number
  subject: string
  body?: string
  device_info: DeviceInfo
  sms_code?: string
  trade_password_hash?: string
  request_id: string
  remark?: string
}

export interface ReviewPaymentRequest {
  payment_no: string
  approved: boolean
  review_reason?: string
}

export interface RefundPaymentRequest {
  payment_no: string
  refund_amount: number
  reason: string
}

export interface BatchProcessRequest {
  payment_ids: string[]
  operation: BatchProcessOperation
  reason?: string
}

export interface BatchProcessResultItem {
  id: string
  success: boolean
  error_message?: string
  operation_detail?: string
}

export interface BatchProcessResult {
  success_count: number
  fail_count: number
  details: BatchProcessResultItem[]
}

export interface PaymentTraceRequest {
  payment_no?: string
  order_no?: string
}

export interface DeviceTraceCheck {
  has_risk: boolean
  is_strange_device: boolean
  device_trust_level: number
  need_second_auth: boolean
  bind_status: DeviceBindStatus
  frequency_count: number
  window_minutes: number
  related_payments: Array<{
    payment_no: string
    amount: number
    create_time: string
    device_id: string
  }>
}

export interface IpTraceCheck {
  has_risk: boolean
  is_abnormal_location: boolean
  ip_address: string
  ip_location: string
  historical_locations: string[]
  cross_region: boolean
  vpn_proxy_detected: boolean
  related_payments: Array<{
    payment_no: string
    amount: number
    create_time: string
    ip_address: string
    location: string
  }>
}

export interface SceneConsistencyCheck {
  has_risk: boolean
  consistent: boolean
  declared_scene: PaymentScene
  detected_scene_tags: string[]
  inconsistency_reason?: string
  merchant_mcc: string
  subject_match_score: number
}

export interface DuplicateOrderCheck {
  has_risk: boolean
  is_duplicate: boolean
  duplicate_count: number
  time_window_seconds: number
  duplicate_payments: Array<{
    payment_no: string
    amount: number
    create_time: string
    merchant_id: string
  }>
}

export interface FalseMerchantCheck {
  has_risk: boolean
  is_false_merchant: boolean
  matched_keywords: string[]
  risk_score: number
  merchant_id: string
  merchant_name: string
  check_details: Array<{
    field: string
    value: string
    matched: boolean
    keyword?: string
  }>
}

export interface FinalRiskAssessment {
  overall_risk_level: RiskLevel
  overall_risk_score: number
  high_risk_items: string[]
  medium_risk_items: string[]
  low_risk_items: string[]
  suggested_action: 'pass' | 'review' | 'block'
  intercept: boolean
  intercept_reason?: string
  need_manual_review: boolean
  review_priority?: 'high' | 'medium' | 'low'
}

export interface PaymentTraceResult {
  query_params: PaymentTraceRequest
  payment_info: PaymentVO
  device_check: DeviceTraceCheck
  ip_check: IpTraceCheck
  scene_check: SceneConsistencyCheck
  duplicate_check: DuplicateOrderCheck
  false_merchant_check: FalseMerchantCheck
  final_assessment: FinalRiskAssessment
}

export function getPaymentConfigApi() {
  return get<{
    payment_channels: typeof PAYMENT_CHANNEL_OPTIONS
    payment_scenes: typeof PAYMENT_SCENE_OPTIONS
    payment_statuses: typeof PAYMENT_STATUS_OPTIONS
    merchant_statuses: typeof MERCHANT_STATUS_OPTIONS
    device_bind_statuses: typeof DEVICE_BIND_STATUS_OPTIONS
    risk_levels: typeof RISK_LEVEL_OPTIONS
    batch_operations: typeof BATCH_OPERATION_OPTIONS
    subjects: typeof SUBJECT_OPTIONS
    mcc_codes: typeof MCC_OPTIONS
    sms_verify_threshold: typeof SMS_VERIFY_THRESHOLD
    second_auth_trust_threshold: typeof SECOND_AUTH_TRUST_THRESHOLD
    risk_score_auto_pass: typeof RISK_SCORE_AUTO_PASS
    risk_score_need_review: typeof RISK_SCORE_NEED_REVIEW
    risk_score_auto_block: typeof RISK_SCORE_AUTO_BLOCK
    duplicate_order_time_window: typeof DUPLICATE_ORDER_TIME_WINDOW
    max_retry_count: typeof MAX_RETRY_COUNT
    online_limit_config: typeof ONLINE_LIMIT_CONFIG
    channel_fee_config: typeof CHANNEL_FEE_CONFIG
    sms_verify_rules: typeof SMS_VERIFY_RULES_CONFIG
    archive_rules: typeof ARCHIVE_RULES_CONFIG
    risk_intercept_rules: typeof RISK_INTERCEPT_RULES
  }>('/business/payment/config')
}

export function preCheckPaymentApi(data: PaymentPreCheckRequest) {
  return post<PaymentPreCheckResult>('/business/payment/precheck', data)
}

export function getPaymentListApi(params: PaymentQueryParams) {
  return get<PageResult<PaymentVO>>('/business/payment/list', params)
}

export function getPaymentDetailApi(id: string) {
  return get<PaymentVO>(`/business/payment/${id}`)
}

export function createPaymentApi(data: CreatePaymentRequest) {
  return post<PaymentVO>('/business/payment', data)
}

export function reviewPaymentApi(id: string, data: ReviewPaymentRequest) {
  return post<PaymentVO>(`/business/payment/${id}/review`, data)
}

export function refundPaymentApi(id: string, data: RefundPaymentRequest) {
  return post<PaymentVO>(`/business/payment/${id}/refund`, data)
}

export function closePaymentApi(id: string, reason: string) {
  return post<PaymentVO>(`/business/payment/${id}/close`, { reason })
}

export function getPaymentBatchListApi(params: PaymentQueryParams) {
  return get<PageResult<PaymentVO>>('/business/payment/batch', params)
}

export function batchProcessPaymentApi(data: BatchProcessRequest) {
  return post<BatchProcessResult>('/business/payment/batch/process', data)
}

export function tracePaymentApi(data: PaymentTraceRequest) {
  return post<PaymentTraceResult>('/business/payment/trace', data)
}

export function retryPaymentApi(id: string) {
  return post<PaymentVO>(`/business/payment/${id}/retry`)
}

export function exportPaymentListApi(params: PaymentQueryParams) {
  return get<Blob>('/business/payment/export', params, { responseType: 'blob' })
}

export function formatCurrency(num: number | undefined | null, digits = 2): string {
  if (num === null || num === undefined || isNaN(num)) return '-'
  return '¥' + num.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
}

export function formatThousands(num: number | undefined | null): string {
  if (num === null || num === undefined || isNaN(num)) return '-'
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function calculateFee(amount: number, channel: PaymentChannel): {
  fee: number
  actual_pay: number
  calc_desc: string
} {
  const config = CHANNEL_FEE_CONFIG[channel]
  const rawFee = amount * config.rate
  let fee = rawFee
  if (rawFee < config.min_fee) {
    fee = config.min_fee
  } else if (rawFee > config.max_fee) {
    fee = config.max_fee
  }
  fee = Math.round(fee * 100) / 100
  const actual_pay = Math.round((amount + fee) * 100) / 100
  const channelText = PAYMENT_CHANNEL_OPTIONS.find(o => o.value === channel)?.label || ''
  const ratePercent = (config.rate * 100).toFixed(4)
  let calc_desc = `${channelText}手续费：${amount} × ${ratePercent}% = ${rawFee.toFixed(2)}`
  if (rawFee < config.min_fee) {
    calc_desc += `，低于最低手续费${config.min_fee}，按最低收取`
  } else if (rawFee > config.max_fee) {
    calc_desc += `，高于最高手续费${config.max_fee}，按最高收取`
  }
  calc_desc += `，实收${fee.toFixed(2)}元`
  return { fee, actual_pay, calc_desc }
}
