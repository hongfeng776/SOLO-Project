import { get, post } from '@utils/request'
import type { PageParams, PageResult } from '@types'

export type ChannelType = 1 | 2 | 3 | 4 | 5 | 6
export type PaymentStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type PayScene = 1 | 2 | 3 | 4 | 5 | 6
export type DeviceType = 1 | 2 | 3 | 4 | 5
export type VerifyMethod = 1 | 2 | 3 | 4 | 5
export type MerchantType = 1 | 2 | 3 | 4
export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5

export type OnlinePaymentVO = {
  id: string
  payment_no: string
  channel_type: ChannelType
  channel_type_text?: string
  pay_scene: PayScene
  pay_scene_text?: string
  merchant_no: string
  merchant_name?: string
  merchant_type: MerchantType
  merchant_type_text?: string
  amount: number
  amount_formatted?: string
  currency: string
  fee: number
  fee_formatted?: string
  status: PaymentStatus
  status_text?: string
  risk_level: RiskLevel
  risk_level_text?: string
  risk_tags?: string
  is_risk_warning?: boolean
  device_type?: DeviceType
  device_type_text?: string
  device_id?: string
  device_id_masked?: string
  verify_method?: VerifyMethod
  verify_method_text?: string
  payer_ip?: string
  payer_ip_masked?: string
  payer_account_no?: string
  payer_account_name?: string
  payee_account_no?: string
  payee_account_name?: string
  order_no?: string
  order_subject?: string
  order_desc?: string
  request_id?: string
  notify_url?: string
  return_url?: string
  expire_time?: string
  pay_time?: string
  success_time?: string
  close_time?: string
  close_reason?: string
  refund_time?: string
  refund_amount?: number
  org_id?: string
  org_name?: string
  operator_id?: string
  operator_name?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export type OnlinePaymentPreCheckResult = {
  passed: boolean
  blocked: boolean
  block_reason?: string
  block_field?: string
  warnings: string[]
  merchant_valid: boolean
  merchant_status: number
  merchant_status_text: string
  merchant_not_frozen: boolean
  device_valid: boolean
  device_status: number
  device_status_text: string
  amount_valid: boolean
  balance_sufficient: boolean
  available_balance: number
  fee_calc: {
    fee: number
    fee_calc_desc: string
    min_fee: number
    max_fee: number
    rate: number
  }
  need_review: boolean
  review_reason?: string
  suggested_audit_level: number
  risk_check: {
    risk_level: RiskLevel
    risk_tags: string[]
    risk_details: Array<{
      risk_type: string
      risk_level: RiskLevel
      description: string
    }>
  }
}

export type OnlinePaymentQueryParams = PageParams & {
  keyword?: string
  payment_no?: string
  merchant_no?: string
  merchant_name?: string
  channel_type?: ChannelType
  pay_scene?: PayScene
  status?: PaymentStatus
  risk_level?: RiskLevel
  device_type?: DeviceType
  verify_method?: VerifyMethod
  merchant_type?: MerchantType
  order_no?: string
  payer_account_no?: string
  payee_account_no?: string
  org_id?: string
  operator_id?: string
  start_time?: string
  end_time?: string
  min_amount?: number
  max_amount?: number
  is_risk_warning?: boolean
}

export type CreateOnlinePaymentRequest = {
  channel_type: ChannelType
  pay_scene: PayScene
  merchant_no: string
  amount: number
  currency?: string
  order_no: string
  order_subject: string
  order_desc?: string
  payer_account_no?: string
  payer_account_name?: string
  payee_account_no?: string
  payee_account_name?: string
  device_id?: string
  device_type?: DeviceType
  verify_method?: VerifyMethod
  payer_ip?: string
  notify_url?: string
  return_url?: string
  expire_minutes?: number
  request_id?: string
  remark?: string
}

export type OnlinePaymentBatchProcessRequest = {
  batch_type: number
  batch_name: string
  payment_ids: string[]
  reason?: string
}

export type OnlinePaymentBatchProcessResult = {
  batch_id: string
  batch_no: string
  total_count: number
  success_count: number
  fail_count: number
  pending_count: number
  details: Array<{
    payment_id: string
    payment_no: string
    success: boolean
    error?: string
    warning?: string
  }>
}

export type OnlinePaymentTraceResult = {
  query_params: {
    payment_no?: string
    merchant_no?: string
    device_id?: string
    payer_ip?: string
    start_time?: string
    end_time?: string
  }
  total_count: number
  total_amount: number
  total_fee: number
  records: OnlinePaymentVO[]
  merchant_check: MerchantCheckResult
  device_check: DeviceCheckResult
  abnormal_transaction_check: AbnormalTransactionCheck
  tamper_proof_check: TamperProofCheck
  risk_warnings: Array<{
    risk_type: string
    risk_level: RiskLevel
    description: string
    related_payment_nos: string[]
  }>
  validation_passed: boolean
}

export type MerchantCheckResult = {
  has_risk: boolean
  merchant_no: string
  merchant_name: string
  merchant_status: number
  abnormal_count: number
  abnormal_amount: number
  recent_transactions: Array<{
    payment_no: string
    amount: number
    create_time: string
    status: PaymentStatus
  }>
}

export type DeviceCheckResult = {
  has_risk: boolean
  device_id: string
  device_type: DeviceType
  bind_time: string
  bind_merchant_count: number
  abnormal_transaction_count: number
  recent_transactions: Array<{
    payment_no: string
    amount: number
    create_time: string
    is_abnormal: boolean
  }>
}

export type AbnormalTransactionCheck = {
  has_risk: boolean
  abnormal_count: number
  abnormal_types: string[]
  details: Array<{
    payment_no: string
    amount: number
    create_time: string
    abnormal_type: string
    abnormal_desc: string
  }>
}

export type TamperProofCheck = {
  is_secure: boolean
  signature_valid: boolean
  data_integrity_valid: boolean
  tamper_details: Array<{
    field_name: string
    original_value: string
    current_value: string
    tamper_time: string
  }>
  security_score: number
}

export const CHANNEL_TYPE_OPTIONS = [
  { value: 1, label: '支付宝', icon: 'alipay' },
  { value: 2, label: '微信支付', icon: 'wechat' },
  { value: 3, label: '银联支付', icon: 'unionpay' },
  { value: 4, label: '快捷支付', icon: 'quick' },
  { value: 5, label: '网银支付', icon: 'ebank' },
  { value: 6, label: '数字人民币', icon: 'dcpi' }
]

export const PAYMENT_STATUS_OPTIONS = [
  { value: 0, label: '待支付', type: 'info' },
  { value: 1, label: '支付中', type: 'primary' },
  { value: 2, label: '支付成功', type: 'success' },
  { value: 3, label: '支付失败', type: 'danger' },
  { value: 4, label: '已关闭', type: 'info' },
  { value: 5, label: '已退款', type: 'warning' },
  { value: 6, label: '已撤销', type: 'info' }
]

export const PAY_SCENE_OPTIONS = [
  { value: 1, label: '扫码支付' },
  { value: 2, label: 'H5支付' },
  { value: 3, label: '小程序支付' },
  { value: 4, label: 'APP支付' },
  { value: 5, label: 'PC网页支付' },
  { value: 6, label: '刷脸支付' }
]

export const DEVICE_TYPE_OPTIONS = [
  { value: 1, label: 'POS终端' },
  { value: 2, label: '扫码枪' },
  { value: 3, label: '智能终端' },
  { value: 4, label: '移动设备' },
  { value: 5, label: '虚拟设备' }
]

export const VERIFY_METHOD_OPTIONS = [
  { value: 1, label: '密码验证' },
  { value: 2, label: '指纹验证' },
  { value: 3, label: '人脸验证' },
  { value: 4, label: '短信验证' },
  { value: 5, label: '免密支付' }
]

export const MERCHANT_TYPE_OPTIONS = [
  { value: 1, label: '个体工商户' },
  { value: 2, label: '企业商户' },
  { value: 3, label: '政府机构' },
  { value: 4, label: '事业单位' }
]

export const RISK_LEVEL_OPTIONS = [
  { value: 0, label: '无风险', type: 'success' },
  { value: 1, label: '低风险', type: 'success' },
  { value: 2, label: '中低风险', type: 'info' },
  { value: 3, label: '中风险', type: 'warning' },
  { value: 4, label: '中高风险', type: 'warning' },
  { value: 5, label: '高风险', type: 'danger' }
]

export function formatCurrency(amount: number, digits = 2): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '-'
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
}

export function maskIpAddress(ip: string): string {
  if (!ip) return '-'
  const parts = ip.split('.')
  if (parts.length !== 4) return ip
  return `${parts[0]}.${parts[1]}.*.*`
}

export function maskDeviceId(id: string): string {
  if (!id) return '-'
  if (id.length <= 8) return id
  const prefix = id.slice(0, 4)
  const suffix = id.slice(-4)
  return `${prefix}****${suffix}`
}

export function getOnlinePaymentConfigApi() {
  return get('/business/online-payment/config')
}

export function preCheckOnlinePaymentApi(data: CreateOnlinePaymentRequest) {
  return post<OnlinePaymentPreCheckResult>('/business/online-payment/precheck', data)
}

export function getOnlinePaymentListApi(params: OnlinePaymentQueryParams) {
  return get<PageResult<OnlinePaymentVO>>('/business/online-payment/list', params)
}

export function getOnlinePaymentDetailApi(id: string) {
  return get<OnlinePaymentVO>(`/business/online-payment/${id}`)
}

export function createOnlinePaymentApi(data: CreateOnlinePaymentRequest) {
  return post<OnlinePaymentVO>('/business/online-payment', data)
}

export function confirmPaymentApi(id: string, data: { verify_method?: VerifyMethod; verify_code?: string }) {
  return post<OnlinePaymentVO>(`/business/online-payment/${id}/confirm`, data)
}

export function refundPaymentApi(id: string, data: { refund_amount: number; refund_reason?: string }) {
  return post<OnlinePaymentVO>(`/business/online-payment/${id}/refund`, data)
}

export function closePaymentApi(id: string, reason: string) {
  return post<OnlinePaymentVO>(`/business/online-payment/${id}/close', { reason })
}

export function batchProcessApi(data: OnlinePaymentBatchProcessRequest) {
  return post<OnlinePaymentBatchProcessResult>('/business/online-payment/batch', data)
}

export function traceOnlinePaymentApi(data: {
  payment_no?: string
  merchant_no?: string
  device_id?: string
  payer_ip?: string
  start_time?: string
  end_time?: string
}) {
  return post<OnlinePaymentTraceResult>('/business/online-payment/trace', data)
}

export function getMerchantInfoApi(merchantNo: string) {
  return get<{
    merchant_no: string
    merchant_name: string
    merchant_type: MerchantType
    status: number
    status_text: string
    balance: number
    frozen_balance: number
    available_balance: number
  }>(`/business/online-payment/merchant/${merchantNo}`)
}

export function getDeviceBindingListApi(params: PageParams & {
  keyword?: string
  merchant_no?: string
  device_type?: DeviceType
  status?: number
}) {
  return get<PageResult<{
    id: string
    device_id: string
    device_name?: string
    device_type: DeviceType
    device_type_text?: string
    merchant_no: string
    merchant_name?: string
    bind_time: string
    status: number
    status_text?: string
    last_active_time?: string
  }>>('/business/online-payment/device/list', params)
}
