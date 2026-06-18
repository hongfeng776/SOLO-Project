import { BaseEntity, PaginationParams } from './common';

export type PaymentChannel = 1 | 2 | 3 | 4;
export type PaymentScene = 1 | 2 | 3 | 4 | 5;
export type PaymentStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type MerchantStatus = 0 | 1 | 2 | 3;
export type DeviceBindStatus = 0 | 1 | 2;
export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const PaymentChannelText: Record<number, string> = {
  1: '扫码支付',
  2: '快捷支付',
  3: '网关支付',
  4: '代扣支付'
};

export const PaymentSceneText: Record<number, string> = {
  1: '消费',
  2: '充值',
  3: '转账',
  4: '缴费',
  5: '理财'
};

export const PaymentStatusText: Record<number, string> = {
  0: '待支付',
  1: '支付中',
  2: '支付成功',
  3: '支付失败',
  4: '已退款',
  5: '已关闭',
  6: '已撤销'
};

export const MerchantStatusText: Record<number, string> = {
  0: '未审核',
  1: '正常运营',
  2: '暂停结算',
  3: '已封禁'
};

export const DeviceBindStatusText: Record<number, string> = {
  0: '未绑定',
  1: '已绑定',
  2: '已解绑'
};

export const RiskLevelText: Record<number, string> = {
  0: '无风险',
  1: '低风险',
  2: '中低风险',
  3: '中风险',
  4: '中高风险',
  5: '高风险'
};

export const PaymentStatusColor: Record<number, string> = {
  0: 'info',
  1: 'primary',
  2: 'success',
  3: 'danger',
  4: 'warning',
  5: 'info',
  6: 'warning'
};

export interface ChannelFeeConfig {
  min_fee: number;
  max_fee: number;
  rate: number;
  daily_limit: number;
  single_limit: number;
}

export interface SmsVerifyRule {
  required: boolean;
  threshold_amount: number;
  code_length: 6 | 4;
  expire_minutes: number;
}

export interface ArchiveRule {
  archive_days: number;
  need_signature: boolean;
  need_receipt: boolean;
}

export interface OnlineLimitConfig {
  single_limit: number;
  daily_limit: number;
  monthly_limit: number;
  yearly_limit: number;
}

export interface ChannelRiskMatrixItem {
  risk_base_score: number;
  need_second_auth: boolean;
  need_device_bind: boolean;
}

export interface RiskInterceptRules {
  strange_device_frequency_count: number;
  strange_device_window_minutes: number;
  false_merchant_check_keywords: string[];
  duplicate_order_time_seconds: number;
  abnormal_location_check: boolean;
  tamper_check_fields: string[];
}

export interface PaymentConfig {
  channels: Array<{ value: PaymentChannel; label: string }>;
  payment_scenes: Array<{ value: PaymentScene; label: string }>;
  statuses: Array<{ value: PaymentStatus; label: string; type?: string }>;
  channel_fee_config: Record<PaymentChannel, ChannelFeeConfig>;
  sms_verify_rules: Record<PaymentChannel, SmsVerifyRule>;
  archive_rules: Record<PaymentScene, ArchiveRule>;
  online_limit_config: Record<PaymentChannel, OnlineLimitConfig>;
  risk_intercept_rules: RiskInterceptRules;
}

export interface DeviceCheckInfo {
  device_id?: string;
  device_fingerprint?: string;
  device_type?: string;
  device_brand?: string;
  device_model?: string;
  ip_address?: string;
  ua?: string;
  trust_level?: number;
  login_count?: number;
  last_login_time?: string;
  is_bio_enabled?: boolean;
  is_sms_enabled?: boolean;
}

export interface MerchantCheckInfo {
  merchant_id: string;
  merchant_name?: string;
  mcc?: string;
  risk_level?: RiskLevel;
  status?: MerchantStatus;
  daily_settlement_limit?: number;
  single_settlement_limit?: number;
  t0_settlement_enabled?: boolean;
  blacklist_tags?: string;
}

export interface ChannelOpenInfo {
  channel_code: PaymentChannel;
  is_opened: boolean;
  open_date?: string;
  daily_limit_remaining: number;
  single_limit_remaining: number;
  monthly_limit_remaining?: number;
}

export interface PasswordVerifyResult {
  passed: boolean;
  tries_left: number;
  locked_until?: string;
  need_captcha: boolean;
}

export interface PaymentPreCheckRequest {
  payer_account_no: string;
  pay_channel: PaymentChannel;
  pay_scene: PaymentScene;
  merchant_id: string;
  merchant_name?: string;
  amount: number;
  subject?: string;
  device_info?: DeviceCheckInfo;
  sms_code?: string;
  trade_password_hash?: string;
}

export interface ChannelLimitRemaining {
  single_limit: number;
  daily_limit: number;
  monthly_limit: number;
  daily_used_amount: number;
  monthly_used_amount: number;
  daily_remaining: number;
  monthly_remaining: number;
  within_single_limit: boolean;
  within_daily_limit: boolean;
  within_monthly_limit: boolean;
}

export interface FeeCalcResult {
  fee: number;
  fee_calc_desc: string;
  min_fee: number;
  max_fee: number;
  rate: number;
  actual_pay_amount: number;
}

export interface SmsInfo {
  required: boolean;
  verified: boolean;
  expire_seconds_remaining?: number;
  code_length: 6 | 4;
}

export interface AntiFraudInfo {
  anti_fraud_score: number;
  risk_level: RiskLevel;
  risk_tags: string[];
  block_reasons: string[];
  need_review: boolean;
}

export interface PaymentPreCheckResult {
  passed: boolean;
  blocked: boolean;
  block_reason?: string;
  block_field?: string;
  warnings: string[];
  channel_opened: boolean;
  device_bound: boolean;
  password_valid: boolean;
  merchant_valid: boolean;
  amount_valid: boolean;
  limit_ok: boolean;
  sms_valid: boolean;
  second_auth_needed: boolean;
  channel_limits: ChannelLimitRemaining;
  fee_calc: FeeCalcResult;
  sms_info: SmsInfo;
  anti_fraud_info: AntiFraudInfo;
}

export interface OnlinePayment extends BaseEntity {
  payment_no: string;
  order_no: string;
  out_trade_no?: string;
  payer_account_id?: string;
  payer_account_no: string;
  payer_account_name?: string;
  payer_customer_id?: string;
  payer_ip_address?: string;
  payer_device_id?: string;
  pay_channel: PaymentChannel;
  pay_scene: PaymentScene;
  merchant_id: string;
  merchant_name?: string;
  merchant_mcc?: string;
  amount: number;
  currency: string;
  fee: number;
  fee_calc_desc?: string;
  discount_amount: number;
  actual_pay_amount: number;
  subject?: string;
  body?: string;
  notify_url?: string;
  return_url?: string;
  transaction_ip?: string;
  device_id?: string;
  device_fingerprint?: string;
  device_type?: string;
  user_agent?: string;
  sms_code?: string;
  sms_expire_time?: Date;
  sms_verified: number;
  second_auth_method?: string;
  second_auth_passed: number;
  transaction_token?: string;
  anti_fraud_score?: number;
  risk_level?: RiskLevel;
  risk_tags?: string;
  need_review: number;
  review_reason?: string;
  reviewer_id?: string;
  review_time?: Date;
  operator_id?: string;
  org_id?: string;
  status: PaymentStatus;
  fail_reason?: string;
  refund_amount?: number;
  refund_time?: Date;
  close_reason?: string;
  close_time?: Date;
  pay_time?: Date;
  settlement_time?: Date;
  archive_status: number;
  archive_time?: Date;
  original_balance?: number;
  new_balance?: number;
  request_id?: string;
  remark?: string;
}

export interface PaymentVO extends OnlinePayment {
  pay_channel_text?: string;
  pay_scene_text?: string;
  status_text?: string;
  risk_level_text?: string;
  merchant_status_text?: string;
  device_bind_status_text?: string;
  amount_formatted?: string;
  fee_formatted?: string;
  actual_pay_amount_formatted?: string;
  discount_amount_formatted?: string;
  refund_amount_formatted?: string;
  org_name?: string;
  operator_name?: string;
  reviewer_name?: string;
  is_risk_warning?: boolean;
  progress_tip?: string;
  progress_percent?: number;
}

export interface PaymentQueryParams extends PaginationParams {
  keyword?: string;
  payment_no?: string;
  order_no?: string;
  out_trade_no?: string;
  payer_account_no?: string;
  payer_customer_id?: string;
  merchant_id?: string;
  merchant_name?: string;
  pay_channel?: PaymentChannel;
  pay_scene?: PaymentScene;
  status?: PaymentStatus;
  risk_level?: RiskLevel;
  need_review?: boolean;
  transaction_ip?: string;
  device_id?: string;
  start_time?: string;
  end_time?: string;
  pay_start_time?: string;
  pay_end_time?: string;
  min_amount?: number;
  max_amount?: number;
  org_id?: string;
  operator_id?: string;
  reviewer_id?: string;
}

export interface CreatePaymentRequest {
  payer_account_no: string;
  pay_channel: PaymentChannel;
  pay_scene: PaymentScene;
  merchant_id: string;
  merchant_name?: string;
  amount: number;
  currency?: string;
  subject?: string;
  body?: string;
  notify_url?: string;
  return_url?: string;
  order_no?: string;
  device_info?: DeviceCheckInfo;
  sms_code?: string;
  trade_password_hash?: string;
  second_auth_method?: string;
  second_auth_passed?: boolean;
  request_id?: string;
  remark?: string;
}

export interface ReviewPaymentRequest {
  payment_no: string;
  approved: boolean;
  review_reason?: string;
}

export interface BatchQueryResultItem {
  id: string;
  payment_no: string;
  order_no: string;
  payer_account_no: string;
  payer_account_name?: string;
  merchant_id: string;
  merchant_name?: string;
  pay_channel: PaymentChannel;
  pay_channel_text?: string;
  pay_scene: PaymentScene;
  pay_scene_text?: string;
  amount: number;
  amount_formatted?: string;
  fee: number;
  actual_pay_amount: number;
  status: PaymentStatus;
  status_text?: string;
  risk_level?: RiskLevel;
  risk_level_text?: string;
  created_at?: Date;
  pay_time?: Date;
}

export interface BatchProcessRequest {
  payment_ids: string[];
  operation: 'confirm' | 'mark_abnormal' | 'retry' | 'refund' | 'close';
  reason?: string;
  operator_id: string;
}

export interface BatchProcessResultItem {
  id: string;
  payment_no?: string;
  success: boolean;
  error_message?: string;
  operation_detail?: string;
}

export interface BatchProcessResult {
  success_count: number;
  fail_count: number;
  detail: BatchProcessResultItem[];
}

export interface PaymentTraceRequest {
  payment_no?: string;
  order_no?: string;
}

export interface AccountSnapshot {
  account_no: string;
  account_name?: string;
  account_type?: string;
  balance?: number;
  status?: number;
  frozen_amount?: number;
}

export interface MerchantSnapshot {
  merchant_id: string;
  merchant_name?: string;
  merchant_no?: string;
  mcc?: string;
  status?: MerchantStatus;
  risk_level?: RiskLevel;
}

export interface DeviceTraceCheck {
  device_id?: string;
  device_fingerprint?: string;
  device_type?: string;
  device_brand?: string;
  device_model?: string;
  ip_address?: string;
  location?: string;
  ua?: string;
  login_history_count: number;
  is_trusted_device: boolean;
  abnormal_points: string[];
}

export interface IpTraceCheck {
  ip: string;
  province?: string;
  city?: string;
  isp?: string;
  proxy_type: '正常' | 'VPN' | '代理' | 'IDC机房';
  risk_score: number;
  blacklist_hit: boolean;
  blacklist_reason?: string;
}

export interface SceneConsistencyCheck {
  amount_consistent: boolean;
  amount_diff?: string;
  merchant_consistent: boolean;
  merchant_diff?: string;
  timestamp_consistent: boolean;
  timestamp_diff?: string;
  device_consistent: boolean;
  device_diff?: string;
  signature_valid: boolean;
  data_tamper_fields: string[];
}

export interface DuplicateOrderCheck {
  is_duplicate: boolean;
  duplicate_within_seconds: number;
  same_order_count: number;
  same_amount_same_merchant_count: number;
  duplicate_payment_nos: string[];
}

export interface FalseMerchantCheck {
  has_risk: boolean;
  keywords_hitted: string[];
  mcc_abnormal: boolean;
  merchant_status_issue: boolean;
  audit_violations: string[];
}

export interface FinalRiskAssessment {
  risk_level: RiskLevel;
  score: number;
  risk_tags: string[];
  intercept_suggestion: 'allow' | 'block' | 'review';
  warning_reasons: string[];
}

export interface PaymentTraceResult {
  payment: PaymentVO;
  account_snapshot: AccountSnapshot;
  merchant_snapshot: MerchantSnapshot;
  device_trace: DeviceTraceCheck;
  ip_trace: IpTraceCheck;
  scene_consistency: SceneConsistencyCheck;
  duplicate_order: DuplicateOrderCheck;
  false_merchant: FalseMerchantCheck;
  final_assessment: FinalRiskAssessment;
}

export interface Merchant extends BaseEntity {
  merchant_no: string;
  merchant_name: string;
  short_name?: string;
  merchant_type?: number;
  legal_person_name?: string;
  legal_person_id_card?: string;
  business_license_no?: string;
  credit_code?: string;
  mcc?: string;
  business_scope?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  registered_address?: string;
  business_address?: string;
  settlement_account_no?: string;
  settlement_account_name?: string;
  settlement_bank_name?: string;
  wechat_merchant_id?: string;
  alipay_merchant_id?: string;
  unionpay_merchant_id?: string;
  appid?: string;
  secret_key_stored_hint?: string;
  cert_expire_date?: Date;
  daily_settlement_limit?: number;
  single_settlement_limit?: number;
  fee_rate_wechat?: number;
  fee_rate_alipay?: number;
  fee_rate_unionpay?: number;
  t0_settlement_enabled: number;
  t0_settlement_fee?: number;
  status: MerchantStatus;
  audit_user_id?: string;
  audit_remark?: string;
  audit_time?: Date;
  risk_level?: RiskLevel;
  blacklist_tags?: string;
  org_id?: string;
  operator_id?: string;
  expire_date?: Date;
  remark?: string;
}

export interface MerchantVO extends Merchant {
  status_text?: string;
  risk_level_text?: string;
  merchant_type_text?: string;
  org_name?: string;
  operator_name?: string;
  audit_user_name?: string;
  daily_settlement_limit_formatted?: string;
  single_settlement_limit_formatted?: string;
  is_cert_expiring?: boolean;
  cert_expire_days_left?: number;
}

export interface DeviceBinding extends BaseEntity {
  device_id: string;
  device_fingerprint?: string;
  device_name?: string;
  device_type?: string;
  device_brand?: string;
  device_model?: string;
  os_version?: string;
  app_version?: string;
  imei_md5?: string;
  mac_md5?: string;
  imsi_md5?: string;
  customer_id?: string;
  customer_name?: string;
  account_no?: string;
  bind_status: DeviceBindStatus;
  bind_time?: Date;
  unbind_time?: Date;
  unbind_reason?: string;
  last_login_ip?: string;
  last_login_location?: string;
  last_login_time?: Date;
  login_count: number;
  trust_level?: number;
  is_bio_enabled: number;
  is_sms_enabled: number;
  sms_phone?: string;
  risk_tags?: string;
  remark?: string;
}

export interface DeviceBindingVO extends DeviceBinding {
  bind_status_text?: string;
  trust_level_text?: string;
  is_trusted?: boolean;
  days_since_last_login?: number;
  is_abnormal?: boolean;
}
