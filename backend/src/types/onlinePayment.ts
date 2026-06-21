import { BaseEntity, PaginationParams } from './common';

export type ChannelType = 1 | 2 | 3 | 4 | 5 | 6;
export type PaymentStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type PayScene = 1 | 2 | 3 | 4 | 5 | 6;
export type DeviceType = 1 | 2 | 3 | 4 | 5;
export type VerifyMethod = 1 | 2 | 3 | 4 | 5;
export type MerchantType = 1 | 2 | 3;
export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type BatchProcessType = 'confirm' | 'mark_abnormal' | 'close';

export const ChannelTypeText: Record<number, string> = {
  1: '手机银行',
  2: '网上银行',
  3: '扫码支付',
  4: '快捷支付',
  5: '网关支付',
  6: '代扣支付'
};

export const PaymentStatusText: Record<number, string> = {
  0: '待支付',
  1: '支付中',
  2: '已支付',
  3: '已失败',
  4: '已关闭',
  5: '已退款',
  6: '已撤销'
};

export const PaySceneText: Record<number, string> = {
  1: '消费',
  2: '转账',
  3: '充值',
  4: '缴费',
  5: '理财',
  6: '还款'
};

export const DeviceTypeText: Record<number, string> = {
  1: '手机',
  2: '平板',
  3: '电脑',
  4: '智能手表',
  5: '其他'
};

export const VerifyMethodText: Record<number, string> = {
  1: '短信验证码',
  2: '支付密码',
  3: '指纹识别',
  4: '面部识别',
  5: '数字证书'
};

export const MerchantTypeText: Record<number, string> = {
  1: '个人商户',
  2: '企业商户',
  3: '平台商户'
};

export const PaymentStatusColor: Record<number, string> = {
  0: 'info',
  1: 'warning',
  2: 'success',
  3: 'danger',
  4: 'info',
  5: 'warning',
  6: 'info'
};

export interface FeeConfig {
  min_fee: number;
  max_fee: number;
  rate: number;
  fixed_amount?: number;
}

export interface LimitConfig {
  single_limit: number;
  daily_limit: number;
  monthly_limit: number;
}

export interface OnlinePaymentConfig {
  channel_types: Array<{ value: ChannelType; label: string }>;
  pay_scenes: Array<{ value: PayScene; label: string }>;
  payment_statuses: Array<{ value: PaymentStatus; label: string; type?: string }>;
  device_types: Array<{ value: DeviceType; label: string }>;
  verify_methods: Array<{ value: VerifyMethod; label: string }>;
  merchant_types: Array<{ value: MerchantType; label: string }>;
  limit_config: Record<ChannelType, Record<PayScene, LimitConfig>>;
  fee_config: Record<ChannelType, Record<PayScene, FeeConfig>>;
  risk_rules: {
    max_failed_attempts: number;
    failed_attempt_window_minutes: number;
    large_amount_threshold: number;
    abnormal_ip_check: boolean;
    device_binding_required: boolean;
    second_verify_threshold: number;
    night_transaction_start_hour: number;
    night_transaction_end_hour: number;
    night_transaction_amount_threshold: number;
  };
}

export interface MerchantCheckResult {
  merchant_valid: boolean;
  merchant_status: number;
  merchant_status_text: string;
  merchant_type: MerchantType;
  merchant_name: string;
  allowed_scenes: PayScene[];
  allowed_channels: ChannelType[];
  daily_used_amount: number;
  daily_limit: number;
  within_merchant_limit: boolean;
  merchant_error?: string;
}

export interface DeviceCheckResult {
  device_bound: boolean;
  is_trusted: boolean;
  risk_score: number;
  warnings: string[];
  device_type?: DeviceType;
  device_info?: string;
  last_login_time?: string;
  bind_time?: string;
}

export interface LimitCheckResult {
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
  limit_error?: string;
}

export interface OnlinePaymentPreCheckRequest {
  payer_account_no: string;
  channel_type: ChannelType;
  pay_scene: PayScene;
  amount: number;
  merchant_no: string;
  device_id?: string;
  ip_address?: string;
  verify_code?: string;
}

export interface OnlinePaymentPreCheckResult {
  passed: boolean;
  blocked: boolean;
  block_reason?: string;
  block_field?: string;
  warnings: string[];
  need_second_verify: boolean;
  fee: number;
  fee_calc_desc: string;
  risk_level: RiskLevel;
  payer_account_valid: boolean;
  payer_account_status: number;
  payer_available_balance: number;
  balance_sufficient: boolean;
  merchant_check: MerchantCheckResult;
  device_check: DeviceCheckResult;
  limit_check: LimitCheckResult;
}

export interface OnlinePayment extends BaseEntity {
  payment_no: string;
  channel_type: ChannelType;
  pay_scene: PayScene;
  payer_account_id: string;
  payer_account_no: string;
  payer_account_name?: string;
  payer_customer_id?: string;
  merchant_no: string;
  merchant_name?: string;
  merchant_type?: MerchantType;
  amount: number;
  currency: string;
  fee: number;
  fee_calc_desc?: string;
  status: PaymentStatus;
  device_id?: string;
  device_type?: DeviceType;
  device_info?: string;
  ip_address?: string;
  ip_location?: string;
  verify_method?: VerifyMethod;
  verify_status?: number;
  risk_level?: RiskLevel;
  risk_tags?: string;
  abnormal_flag?: boolean;
  abnormal_reason?: string;
  close_reason?: string;
  refund_reason?: string;
  original_payment_no?: string;
  request_id?: string;
  org_id?: string;
  operator_id?: string;
  pay_time?: Date;
  close_time?: Date;
  refund_time?: Date;
  expire_time?: Date;
}

export interface OnlinePaymentVO extends OnlinePayment {
  channel_type_text?: string;
  pay_scene_text?: string;
  status_text?: string;
  device_type_text?: string;
  verify_method_text?: string;
  merchant_type_text?: string;
  risk_level_text?: string;
  org_name?: string;
  operator_name?: string;
  amount_formatted?: string;
  fee_formatted?: string;
  is_risk_warning?: boolean;
}

export interface OnlinePaymentQueryParams extends PaginationParams {
  keyword?: string;
  payment_no?: string;
  order_no?: string;
  payer_account_no?: string;
  merchant_no?: string;
  merchant_name?: string;
  channel_type?: ChannelType;
  pay_scene?: PayScene;
  status?: PaymentStatus;
  risk_level?: RiskLevel;
  device_id?: string;
  ip_address?: string;
  abnormal_flag?: boolean;
  org_id?: string;
  operator_id?: string;
  start_time?: string;
  end_time?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface CreateOnlinePaymentRequest {
  channel_type: ChannelType;
  pay_scene: PayScene;
  payer_account_no: string;
  merchant_no: string;
  amount: number;
  currency?: string;
  device_id?: string;
  device_type?: DeviceType;
  device_info?: string;
  ip_address?: string;
  verify_method?: VerifyMethod;
  verify_code?: string;
  remark?: string;
  request_id?: string;
}

export interface OnlinePaymentBatchProcessRequest {
  ids: string[];
  process_type: BatchProcessType;
  reason?: string;
}

export interface OnlinePaymentBatchProcessResultItem {
  id: string;
  payment_no?: string;
  success: boolean;
  error?: string;
}

export interface OnlinePaymentBatchProcessResult {
  success_count: number;
  fail_count: number;
  details: OnlinePaymentBatchProcessResultItem[];
}

export interface OnlinePaymentTraceRequest {
  payment_no: string;
}

export interface AbnormalTransactionCheck {
  has_risk: boolean;
  risk_type: string;
  risk_level: RiskLevel;
  description: string;
  evidence: string[];
}

export interface TamperProofCheck {
  is_valid: boolean;
  consistency_score: number;
  invalid_fields: string[];
  details: string;
}

export interface OnlinePaymentTraceResult {
  payment: OnlinePaymentVO;
  device_details: {
    device_id: string;
    device_type?: DeviceType;
    device_type_text?: string;
    device_info?: string;
    is_trusted: boolean;
    bind_time?: string;
    last_login_time?: string;
    risk_score: number;
  };
  ip_location: {
    ip_address: string;
    province?: string;
    city?: string;
    isp?: string;
    is_abnormal: boolean;
    abnormal_reason?: string;
  };
  risk_check: {
    overall_risk_level: RiskLevel;
    overall_risk_level_text?: string;
    checks: AbnormalTransactionCheck[];
    risk_tags: string[];
  };
  tamper_proof_check: TamperProofCheck;
}
