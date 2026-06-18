import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  ForeignKey,
  BelongsTo,
  Index
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './Organization';
import { User } from './User';
import { Customer } from './Customer';
import { Account } from './Account';

export type PaymentChannel = 1 | 2 | 3 | 4;
export type PaymentScene = 1 | 2 | 3 | 4 | 5;
export type PaymentStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type MerchantStatus = 0 | 1 | 2 | 3;
export type DeviceBindStatus = 0 | 1 | 2;
export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const PaymentChannelText: Record<number, string> = {
  1: '扫码支付', 2: '快捷支付', 3: '网关支付', 4: '代扣支付'
};
export const PaymentSceneText: Record<number, string> = {
  1: '消费', 2: '充值', 3: '转账', 4: '缴费', 5: '理财'
};
export const PaymentStatusText: Record<number, string> = {
  0: '待支付', 1: '支付中', 2: '支付成功', 3: '支付失败', 4: '已退款', 5: '已关闭', 6: '已撤销'
};
export const MerchantStatusText: Record<number, string> = {
  0: '未审核', 1: '正常运营', 2: '暂停结算', 3: '已封禁'
};
export const DeviceBindStatusText: Record<number, string> = {
  0: '未绑定', 1: '已绑定', 2: '已解绑'
};
export const RiskLevelText: Record<number, string> = {
  0: '无风险', 1: '低风险', 2: '中低风险', 3: '中风险', 4: '中高风险', 5: '高风险'
};

export interface ChannelFeeConfig { min_fee:number; max_fee:number; rate:number; daily_limit:number; single_limit:number; }
export interface SmsVerifyRule { required:boolean; threshold_amount:number; code_length:6|4; expire_minutes:number; }
export interface ArchiveRule { archive_days:number; need_signature:boolean; need_receipt:boolean; }
export interface OnlineLimitConfig { single_limit:number; daily_limit:number; monthly_limit:number; yearly_limit:number; }
export interface ChannelRiskMatrixItem { risk_base_score:number; need_second_auth:boolean; need_device_bind:boolean; }

export const CHANNEL_FEE_CONFIG: Record<PaymentChannel, ChannelFeeConfig> = {
  1: { min_fee:0, max_fee:20, rate:0.0038, daily_limit:200000, single_limit:50000 },
  2: { min_fee:0, max_fee:50, rate:0.005, daily_limit:100000, single_limit:20000 },
  3: { min_fee:0, max_fee:100, rate:0.006, daily_limit:2000000, single_limit:500000 },
  4: { min_fee:0, max_fee:30, rate:0.002, daily_limit:500000, single_limit:100000 }
};

export const SMS_VERIFY_RULES: Record<PaymentChannel, SmsVerifyRule> = {
  1: { required:false, threshold_amount:10000, code_length:6, expire_minutes:5 },
  2: { required:true, threshold_amount:500, code_length:6, expire_minutes:5 },
  3: { required:true, threshold_amount:0, code_length:6, expire_minutes:10 },
  4: { required:false, threshold_amount:0, code_length:4, expire_minutes:3 }
};

export const ARCHIVE_RULES: Record<PaymentScene, ArchiveRule> = {
  1: { archive_days:2555, need_signature:true, need_receipt:true },
  2: { archive_days:1095, need_signature:false, need_receipt:false },
  3: { archive_days:1095, need_signature:false, need_receipt:true },
  4: { archive_days:1095, need_signature:false, need_receipt:true },
  5: { archive_days:3650, need_signature:true, need_receipt:true }
};

export const ONLINE_LIMIT_CONFIG: Record<PaymentChannel, OnlineLimitConfig> = {
  1: { single_limit:50000, daily_limit:200000, monthly_limit:5000000, yearly_limit:50000000 },
  2: { single_limit:20000, daily_limit:100000, monthly_limit:2000000, yearly_limit:20000000 },
  3: { single_limit:500000, daily_limit:2000000, monthly_limit:50000000, yearly_limit:500000000 },
  4: { single_limit:100000, daily_limit:500000, monthly_limit:10000000, yearly_limit:100000000 }
};

export const RISK_INTERCEPT_RULES = {
  strange_device_frequency_count: 10,
  strange_device_window_minutes: 30,
  false_merchant_check_keywords: ['test','demo','免费','刷'],
  duplicate_order_time_seconds: 60,
  abnormal_location_check: true,
  tamper_check_fields: ['amount','merchant_id','payer_account_no','pay_channel']
};

export const CHANNEL_RISK_MATRIX: Record<PaymentChannel, Record<PaymentScene, ChannelRiskMatrixItem>> = {
  1: {
    1: { risk_base_score:20, need_second_auth:false, need_device_bind:false },
    2: { risk_base_score:15, need_second_auth:false, need_device_bind:false },
    3: { risk_base_score:40, need_second_auth:true, need_device_bind:false },
    4: { risk_base_score:25, need_second_auth:false, need_device_bind:false },
    5: { risk_base_score:50, need_second_auth:true, need_device_bind:true }
  },
  2: {
    1: { risk_base_score:30, need_second_auth:false, need_device_bind:true },
    2: { risk_base_score:25, need_second_auth:false, need_device_bind:true },
    3: { risk_base_score:55, need_second_auth:true, need_device_bind:true },
    4: { risk_base_score:35, need_second_auth:false, need_device_bind:true },
    5: { risk_base_score:60, need_second_auth:true, need_device_bind:true }
  },
  3: {
    1: { risk_base_score:50, need_second_auth:true, need_device_bind:true },
    2: { risk_base_score:40, need_second_auth:true, need_device_bind:true },
    3: { risk_base_score:70, need_second_auth:true, need_device_bind:true },
    4: { risk_base_score:55, need_second_auth:true, need_device_bind:true },
    5: { risk_base_score:75, need_second_auth:true, need_device_bind:true }
  },
  4: {
    1: { risk_base_score:60, need_second_auth:true, need_device_bind:true },
    2: { risk_base_score:55, need_second_auth:true, need_device_bind:true },
    3: { risk_base_score:80, need_second_auth:true, need_device_bind:true },
    4: { risk_base_score:65, need_second_auth:true, need_device_bind:true },
    5: { risk_base_score:85, need_second_auth:true, need_device_bind:true }
  }
};

function uid() { return uuidv4().replace(/-/g, ''); }
function genNo(prefix:string, len:number=4) {
  const n = new Date();
  const t = n.getFullYear()
    + String(n.getMonth()+1).padStart(2,'0')
    + String(n.getDate()).padStart(2,'0')
    + String(n.getHours()).padStart(2,'0')
    + String(n.getMinutes()).padStart(2,'0')
    + String(n.getSeconds()).padStart(2,'0');
  return prefix + t + Math.floor(Math.pow(10,len-1)+Math.random()*9*Math.pow(10,len-1)).toString();
}

@Table({ tableName:'biz_online_payment', comment:'线上支付流水表' })
export class OnlinePayment extends Model<OnlinePayment> {
  @PrimaryKey
  @Column({ type:DataType.STRING(36), allowNull:false, comment:'主键ID' })
  id!: string;

  @Index
  @Column({ type:DataType.STRING(64), allowNull:false, unique:true, comment:'支付流水号' })
  payment_no!: string;

  @Index
  @Column({ type:DataType.STRING(64), allowNull:false, comment:'业务订单号' })
  order_no!: string;

  @Column({ type:DataType.STRING(128), allowNull:true, comment:'第三方交易单号' })
  out_trade_no?: string;

  @ForeignKey(()=>Account)
  @Index
  @Column({ type:DataType.STRING(36), allowNull:true, comment:'付款人账户ID' })
  payer_account_id?: string;

  @Index
  @Column({ type:DataType.STRING(32), allowNull:false, comment:'付款人账户号' })
  payer_account_no!: string;

  @Column({ type:DataType.STRING(128), allowNull:true, comment:'付款人账户户名' })
  payer_account_name?: string;

  @ForeignKey(()=>Customer)
  @Column({ type:DataType.STRING(36), allowNull:true, comment:'付款人客户ID' })
  payer_customer_id?: string;

  @Column({ type:DataType.STRING(64), allowNull:true, comment:'付款人IP地址' })
  payer_ip_address?: string;

  @Column({ type:DataType.STRING(64), allowNull:true, comment:'付款人设备ID' })
  payer_device_id?: string;

  @Index
  @Column({ type:DataType.TINYINT, allowNull:false, comment:'支付渠道 1扫码 2快捷 3网关 4代扣' })
  pay_channel!: PaymentChannel;

  @Column({ type:DataType.TINYINT, allowNull:false, comment:'支付场景 1消费 2充值 3转账 4缴费 5理财' })
  pay_scene!: PaymentScene;

  @ForeignKey(()=>Merchant)
  @Index
  @Column({ type:DataType.STRING(36), allowNull:false, comment:'商户ID' })
  merchant_id!: string;

  @Column({ type:DataType.STRING(128), allowNull:true, comment:'商户名称' })
  merchant_name?: string;

  @Column({ type:DataType.STRING(8), allowNull:true, comment:'商户类别码MCC' })
  merchant_mcc?: string;

  @Column({ type:DataType.DECIMAL(18,2), allowNull:false, defaultValue:0, comment:'订单金额' })
  amount!: number;

  @Column({ type:DataType.STRING(16), allowNull:false, defaultValue:'CNY', comment:'币种' })
  currency!: string;

  @Column({ type:DataType.DECIMAL(18,2), allowNull:false, defaultValue:0, comment:'手续费' })
  fee!: number;

  @Column({ type:DataType.STRING(128), allowNull:true, comment:'手续费计算说明' })
  fee_calc_desc?: string;

  @Column({ type:DataType.DECIMAL(18,2), allowNull:false, defaultValue:0, comment:'优惠金额' })
  discount_amount!: number;

  @Column({ type:DataType.DECIMAL(18,2), allowNull:false, defaultValue:0, comment:'实际支付金额' })
  actual_pay_amount!: number;

  @Column({ type:DataType.STRING(128), allowNull:true, comment:'订单标题' })
  subject?: string;

  @Column({ type:DataType.STRING(500), allowNull:true, comment:'商品描述' })
  body?: string;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'异步通知地址' })
  notify_url?: string;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'同步跳转地址' })
  return_url?: string;

  @Index
  @Column({ type:DataType.STRING(64), allowNull:true, comment:'交易IP地址' })
  transaction_ip?: string;

  @Index
  @Column({ type:DataType.STRING(64), allowNull:true, comment:'设备ID' })
  device_id?: string;

  @Column({ type:DataType.STRING(128), allowNull:true, comment:'设备指纹' })
  device_fingerprint?: string;

  @Column({ type:DataType.STRING(32), allowNull:true, comment:'设备类型 ios/android/web/h5' })
  device_type?: string;

  @Column({ type:DataType.STRING(512), allowNull:true, comment:'浏览器UA' })
  user_agent?: string;

  @Column({ type:DataType.STRING(16), allowNull:true, comment:'短信验证码' })
  sms_code?: string;

  @Column({ type:DataType.DATE, allowNull:true, comment:'短信验证码过期时间' })
  sms_expire_time?: Date;

  @Column({ type:DataType.TINYINT, allowNull:false, defaultValue:0, comment:'短信已验证 0否1是' })
  sms_verified!: number;

  @Column({ type:DataType.STRING(32), allowNull:true, comment:'二次认证方式 sms/face/biometric/none' })
  second_auth_method?: string;

  @Column({ type:DataType.TINYINT, allowNull:false, defaultValue:0, comment:'二次认证通过 0否1是' })
  second_auth_passed!: number;

  @Column({ type:DataType.STRING(128), allowNull:true, comment:'交易令牌' })
  transaction_token?: string;

  @Column({ type:DataType.INTEGER, allowNull:true, defaultValue:0, comment:'反欺诈评分0-100' })
  anti_fraud_score?: number;

  @Column({ type:DataType.TINYINT, allowNull:true, defaultValue:0, comment:'风险等级 0无1低2中低3中4中高5高' })
  risk_level?: RiskLevel;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'风险标签逗号分隔' })
  risk_tags?: string;

  @Column({ type:DataType.TINYINT, allowNull:false, defaultValue:0, comment:'需人工审核 0否1是' })
  need_review!: number;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'审核原因' })
  review_reason?: string;

  @ForeignKey(()=>User)
  @Column({ type:DataType.STRING(36), allowNull:true, comment:'审核人ID' })
  reviewer_id?: string;

  @Column({ type:DataType.DATE, allowNull:true, comment:'审核时间' })
  review_time?: Date;

  @ForeignKey(()=>User)
  @Column({ type:DataType.STRING(36), allowNull:true, comment:'操作人ID' })
  operator_id?: string;

  @ForeignKey(()=>Organization)
  @Column({ type:DataType.STRING(36), allowNull:true, comment:'所属机构ID' })
  org_id?: string;

  @Index
  @Column({ type:DataType.TINYINT, allowNull:false, defaultValue:0, comment:'支付状态 0待1中2成3败4退5关6撤' })
  status!: PaymentStatus;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'支付失败原因' })
  fail_reason?: string;

  @Column({ type:DataType.DECIMAL(18,2), allowNull:true, defaultValue:0, comment:'已退款金额' })
  refund_amount?: number;

  @Column({ type:DataType.DATE, allowNull:true, comment:'退款时间' })
  refund_time?: Date;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'关闭原因' })
  close_reason?: string;

  @Column({ type:DataType.DATE, allowNull:true, comment:'关闭时间' })
  close_time?: Date;

  @Column({ type:DataType.DATE, allowNull:true, comment:'支付完成时间' })
  pay_time?: Date;

  @Column({ type:DataType.DATE, allowNull:true, comment:'结算时间' })
  settlement_time?: Date;

  @Column({ type:DataType.TINYINT, allowNull:false, defaultValue:0, comment:'归档状态 0待1已' })
  archive_status!: number;

  @Column({ type:DataType.DATE, allowNull:true, comment:'归档时间' })
  archive_time?: Date;

  @Column({ type:DataType.DECIMAL(18,2), allowNull:true, comment:'支付前余额' })
  original_balance?: number;

  @Column({ type:DataType.DECIMAL(18,2), allowNull:true, comment:'支付后余额' })
  new_balance?: number;

  @Column({ type:DataType.STRING(64), allowNull:true, comment:'请求唯一ID幂等' })
  request_id?: string;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'备注' })
  remark?: string;

  @BelongsTo(()=>Account,'payer_account_id') payer_account?: Account;
  @BelongsTo(()=>Customer,'payer_customer_id') payer_customer?: Customer;
  @BelongsTo(()=>Merchant,'merchant_id') merchant?: Merchant;
  @BelongsTo(()=>Organization) organization?: Organization;
  @BelongsTo(()=>User,'operator_id') operator?: User;
  @BelongsTo(()=>User,'reviewer_id') reviewer?: User;

  @BeforeValidate @BeforeCreate
  static generateId(i:OnlinePayment) {
    if(!i.id) i.id = uid();
    if(!i.payment_no) i.payment_no = genNo('ONP');
    if(i.status===undefined || i.status===null) i.status = 0;
  }
}

@Table({ tableName:'biz_merchant', comment:'商户信息表' })
export class Merchant extends Model<Merchant> {
  @PrimaryKey
  @Column({ type:DataType.STRING(36), allowNull:false, comment:'主键ID' })
  id!: string;

  @Index
  @Column({ type:DataType.STRING(32), allowNull:false, unique:true, comment:'商户编号' })
  merchant_no!: string;

  @Index
  @Column({ type:DataType.STRING(128), allowNull:false, comment:'商户名称' })
  merchant_name!: string;

  @Column({ type:DataType.STRING(64), allowNull:true, comment:'商户简称' })
  short_name?: string;

  @Column({ type:DataType.TINYINT, allowNull:true, comment:'商户类型 1个体2企业3事业' })
  merchant_type?: number;

  @Column({ type:DataType.STRING(64), allowNull:true, comment:'法人姓名' })
  legal_person_name?: string;

  @Column({ type:DataType.STRING(32), allowNull:true, comment:'法人身份证号' })
  legal_person_id_card?: string;

  @Column({ type:DataType.STRING(64), allowNull:true, comment:'营业执照号' })
  business_license_no?: string;

  @Column({ type:DataType.STRING(32), allowNull:true, comment:'统一社会信用代码' })
  credit_code?: string;

  @Index
  @Column({ type:DataType.STRING(8), allowNull:true, comment:'MCC4位' })
  mcc?: string;

  @Column({ type:DataType.STRING(1000), allowNull:true, comment:'经营范围' })
  business_scope?: string;

  @Column({ type:DataType.STRING(64), allowNull:true, comment:'联系人姓名' })
  contact_name?: string;

  @Column({ type:DataType.STRING(32), allowNull:true, comment:'联系电话' })
  contact_phone?: string;

  @Column({ type:DataType.STRING(128), allowNull:true, comment:'联系邮箱' })
  contact_email?: string;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'注册地址' })
  registered_address?: string;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'经营地址' })
  business_address?: string;

  @Column({ type:DataType.STRING(32), allowNull:true, comment:'结算账户号' })
  settlement_account_no?: string;

  @Column({ type:DataType.STRING(128), allowNull:true, comment:'结算账户户名' })
  settlement_account_name?: string;

  @Column({ type:DataType.STRING(128), allowNull:true, comment:'结算开户行' })
  settlement_bank_name?: string;

  @Column({ type:DataType.STRING(64), allowNull:true, comment:'微信商户号' })
  wechat_merchant_id?: string;

  @Column({ type:DataType.STRING(64), allowNull:true, comment:'支付宝商户号' })
  alipay_merchant_id?: string;

  @Column({ type:DataType.STRING(64), allowNull:true, comment:'银联商户号' })
  unionpay_merchant_id?: string;

  @Column({ type:DataType.STRING(64), allowNull:true, comment:'应用ID' })
  appid?: string;

  @Column({ type:DataType.STRING(128), allowNull:true, comment:'密钥存储提示' })
  secret_key_stored_hint?: string;

  @Column({ type:DataType.DATE, allowNull:true, comment:'证书到期日期' })
  cert_expire_date?: Date;

  @Column({ type:DataType.DECIMAL(18,2), allowNull:true, defaultValue:0, comment:'日结算限额' })
  daily_settlement_limit?: number;

  @Column({ type:DataType.DECIMAL(18,2), allowNull:true, defaultValue:0, comment:'单笔结算限额' })
  single_settlement_limit?: number;

  @Column({ type:DataType.DECIMAL(10,6), allowNull:true, defaultValue:0, comment:'微信手续费率' })
  fee_rate_wechat?: number;

  @Column({ type:DataType.DECIMAL(10,6), allowNull:true, defaultValue:0, comment:'支付宝手续费率' })
  fee_rate_alipay?: number;

  @Column({ type:DataType.DECIMAL(10,6), allowNull:true, defaultValue:0, comment:'银联手续费率' })
  fee_rate_unionpay?: number;

  @Column({ type:DataType.TINYINT, allowNull:false, defaultValue:0, comment:'T0结算 0否1是' })
  t0_settlement_enabled!: number;

  @Column({ type:DataType.DECIMAL(18,2), allowNull:true, defaultValue:0, comment:'T0结算手续费' })
  t0_settlement_fee?: number;

  @Index
  @Column({ type:DataType.TINYINT, allowNull:false, defaultValue:0, comment:'商户状态 0未审1正常2停结3封禁' })
  status!: MerchantStatus;

  @ForeignKey(()=>User)
  @Column({ type:DataType.STRING(36), allowNull:true, comment:'审核人ID' })
  audit_user_id?: string;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'审核备注' })
  audit_remark?: string;

  @Column({ type:DataType.DATE, allowNull:true, comment:'审核时间' })
  audit_time?: Date;

  @Column({ type:DataType.TINYINT, allowNull:true, defaultValue:0, comment:'风险等级' })
  risk_level?: RiskLevel;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'黑名单标签逗号分隔' })
  blacklist_tags?: string;

  @ForeignKey(()=>Organization)
  @Index
  @Column({ type:DataType.STRING(36), allowNull:true, comment:'所属机构ID' })
  org_id?: string;

  @ForeignKey(()=>User)
  @Column({ type:DataType.STRING(36), allowNull:true, comment:'操作人ID' })
  operator_id?: string;

  @Column({ type:DataType.DATE, allowNull:true, comment:'到期日期' })
  expire_date?: Date;

  @Column({ type:DataType.STRING(256), allowNull:true, comment:'备注' })
  remark?: string;

  @BelongsTo(()=>Organization) organization?: Organization;
  @BelongsTo(()=>User,'operator_id') operator?: User;

  @BeforeValidate @BeforeCreate
  static generateId(instance: Merchant) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}