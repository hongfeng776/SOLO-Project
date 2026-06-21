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
import { Account } from './Account';
import { Customer } from './Customer';
import { Organization } from './Organization';
import { User } from './User';

export type ChannelType = 1 | 2 | 3 | 4 | 5 | 6;
export type PaymentStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type PayScene = 1 | 2 | 3 | 4 | 5 | 6;
export type DeviceType = 1 | 2 | 3 | 4 | 5;
export type VerifyMethod = 1 | 2 | 3 | 4 | 5;
export type MerchantType = 1 | 2 | 3;
export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type DeviceBindingStatus = 0 | 1 | 2;
export type MerchantStatus = 0 | 1 | 2;
export type MerchantLevel = 1 | 2 | 3 | 4 | 5;

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
  2: '支付成功',
  3: '支付失败',
  4: '已退款',
  5: '已关闭',
  6: '待确认'
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
  4: 'POS',
  5: '其他'
};

export const VerifyMethodText: Record<number, string> = {
  1: '交易密码',
  2: '短信验证码',
  3: '指纹',
  4: '人脸',
  5: 'U盾'
};

export const MerchantTypeText: Record<number, string> = {
  1: '普通商户',
  2: '特约商户',
  3: '黑名单商户'
};

export const DeviceBindingStatusText: Record<number, string> = {
  0: '已解绑',
  1: '已绑定',
  2: '已冻结'
};

export const MerchantStatusText: Record<number, string> = {
  0: '停用',
  1: '正常',
  2: '冻结'
};

export const RiskLevelText: Record<number, string> = {
  0: '无风险',
  1: '低风险',
  2: '中低风险',
  3: '中风险',
  4: '中高风险',
  5: '高风险'
};

export const SettleCycleText: Record<string, string> = {
  'T+0': '实时结算',
  'T+1': '次日结算',
  'T+3': '三日结算'
};

export interface PaymentLimitConfig {
  single_limit: number;
  daily_limit: number;
  monthly_limit: number;
}

export interface FeeConfig {
  min_fee: number;
  max_fee: number;
  rate: number;
  fixed_amount?: number;
}

export const ONLINE_PAY_LIMIT_CONFIG: Record<ChannelType, Record<PayScene, PaymentLimitConfig>> = {
  1: {
    1: { single_limit: 500000, daily_limit: 2000000, monthly_limit: 10000000 },
    2: { single_limit: 1000000, daily_limit: 5000000, monthly_limit: 20000000 },
    3: { single_limit: 100000, daily_limit: 500000, monthly_limit: 2000000 },
    4: { single_limit: 50000, daily_limit: 200000, monthly_limit: 1000000 },
    5: { single_limit: 2000000, daily_limit: 10000000, monthly_limit: 50000000 },
    6: { single_limit: 500000, daily_limit: 2000000, monthly_limit: 10000000 }
  },
  2: {
    1: { single_limit: 1000000, daily_limit: 5000000, monthly_limit: 20000000 },
    2: { single_limit: 2000000, daily_limit: 10000000, monthly_limit: 50000000 },
    3: { single_limit: 500000, daily_limit: 2000000, monthly_limit: 10000000 },
    4: { single_limit: 200000, daily_limit: 1000000, monthly_limit: 5000000 },
    5: { single_limit: 5000000, daily_limit: 20000000, monthly_limit: 100000000 },
    6: { single_limit: 1000000, daily_limit: 5000000, monthly_limit: 20000000 }
  },
  3: {
    1: { single_limit: 50000, daily_limit: 200000, monthly_limit: 1000000 },
    2: { single_limit: 100000, daily_limit: 500000, monthly_limit: 2000000 },
    3: { single_limit: 20000, daily_limit: 100000, monthly_limit: 500000 },
    4: { single_limit: 10000, daily_limit: 50000, monthly_limit: 200000 },
    5: { single_limit: 500000, daily_limit: 2000000, monthly_limit: 10000000 },
    6: { single_limit: 50000, daily_limit: 200000, monthly_limit: 1000000 }
  },
  4: {
    1: { single_limit: 20000, daily_limit: 100000, monthly_limit: 500000 },
    2: { single_limit: 50000, daily_limit: 200000, monthly_limit: 1000000 },
    3: { single_limit: 10000, daily_limit: 50000, monthly_limit: 200000 },
    4: { single_limit: 5000, daily_limit: 20000, monthly_limit: 100000 },
    5: { single_limit: 200000, daily_limit: 1000000, monthly_limit: 5000000 },
    6: { single_limit: 20000, daily_limit: 100000, monthly_limit: 500000 }
  },
  5: {
    1: { single_limit: 2000000, daily_limit: 10000000, monthly_limit: 50000000 },
    2: { single_limit: 5000000, daily_limit: 20000000, monthly_limit: 100000000 },
    3: { single_limit: 1000000, daily_limit: 5000000, monthly_limit: 20000000 },
    4: { single_limit: 500000, daily_limit: 2000000, monthly_limit: 10000000 },
    5: { single_limit: 10000000, daily_limit: 50000000, monthly_limit: 200000000 },
    6: { single_limit: 2000000, daily_limit: 10000000, monthly_limit: 50000000 }
  },
  6: {
    1: { single_limit: 100000, daily_limit: 500000, monthly_limit: 2000000 },
    2: { single_limit: 200000, daily_limit: 1000000, monthly_limit: 5000000 },
    3: { single_limit: 50000, daily_limit: 200000, monthly_limit: 1000000 },
    4: { single_limit: 20000, daily_limit: 100000, monthly_limit: 500000 },
    5: { single_limit: 500000, daily_limit: 2000000, monthly_limit: 10000000 },
    6: { single_limit: 100000, daily_limit: 500000, monthly_limit: 2000000 }
  }
};

export const ONLINE_FEE_CONFIG: Record<ChannelType, FeeConfig> = {
  1: { min_fee: 0, max_fee: 50, rate: 0.0005 },
  2: { min_fee: 1, max_fee: 100, rate: 0.001 },
  3: { min_fee: 0.1, max_fee: 20, rate: 0.003 },
  4: { min_fee: 0.5, max_fee: 30, rate: 0.002 },
  5: { min_fee: 2, max_fee: 200, rate: 0.0005 },
  6: { min_fee: 1, max_fee: 50, rate: 0.001 }
};

export const RISK_RULES = {
  HIGH_FREQUENCY_THRESHOLD: 10,
  HIGH_FREQUENCY_TIME_WINDOW_MINUTES: 30,
  DIFFERENT_CITY_DETECTION: true,
  DIFFERENT_CITY_RISK_LEVEL: 3,
  UNFAMILIAR_DEVICE_DETECTION: true,
  UNFAMILIAR_DEVICE_RISK_LEVEL: 2,
  LATE_NIGHT_TRANSACTION_START_HOUR: 22,
  LATE_NIGHT_TRANSACTION_END_HOUR: 6,
  LATE_NIGHT_TRANSACTION_AMOUNT_THRESHOLD: 50000,
  LATE_NIGHT_TRANSACTION_RISK_LEVEL: 2,
  SINGLE_TRANSACTION_HIGH_AMOUNT_THRESHOLD: 500000,
  SINGLE_TRANSACTION_HIGH_AMOUNT_RISK_LEVEL: 3,
  DAILY_TOTAL_AMOUNT_THRESHOLD: 2000000,
  DAILY_TOTAL_AMOUNT_RISK_LEVEL: 4,
  CROSS_BORDER_DETECTION: true,
  CROSS_BORDER_RISK_LEVEL: 4,
  NEW_DEVICE_BIND_GRACE_DAYS: 7,
  NEW_DEVICE_RISK_LEVEL: 2
};

export const SECOND_VERIFY_RULES = {
  ENABLE_SECOND_VERIFY: true,
  SINGLE_AMOUNT_THRESHOLD: 100000,
  DAILY_TOTAL_AMOUNT_THRESHOLD: 500000,
  HIGH_RISK_LEVEL_THRESHOLD: 3,
  UNFAMILIAR_DEVICE_VERIFY: true,
  DIFFERENT_CITY_VERIFY: true,
  LATE_NIGHT_VERIFY: true,
  NEW_DEVICE_VERIFY: true,
  VERIFY_METHOD_OPTIONS: [1, 2, 3, 4, 5],
  VERIFY_TIMEOUT_SECONDS: 300,
  MAX_VERIFY_ATTEMPTS: 3
};

@Table({
  tableName: 'biz_online_payment',
  comment: '线上支付订单表'
})
export class OnlinePayment extends Model<OnlinePayment> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '支付单号'
  })
  payment_no!: string;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '商户订单号'
  })
  order_no!: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '渠道类型 1手机银行 2网上银行 3扫码支付 4快捷支付 5网关支付 6代扣支付'
  })
  channel_type!: ChannelType;

  @ForeignKey(() => Account)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '付款账户ID'
  })
  payer_account_id?: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '付款账号'
  })
  payer_account_no?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '付款户名'
  })
  payer_account_name?: string;

  @ForeignKey(() => Account)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '收款账户ID'
  })
  payee_account_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '收款账号'
  })
  payee_account_no?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '收款户名'
  })
  payee_account_name?: string;

  @ForeignKey(() => Customer)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '客户ID'
  })
  customer_id?: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '商户号'
  })
  merchant_no?: string;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '商户ID'
  })
  merchant_id?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '商户名称'
  })
  merchant_name?: string;

  @ForeignKey(() => Organization)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '机构ID'
  })
  org_id?: string;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '关联结算流水ID'
  })
  settlement_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '结算流水号'
  })
  settlement_no?: string;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '支付金额'
  })
  amount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '手续费'
  })
  fee!: number;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '请求流水号'
  })
  request_id?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '支付状态 0待支付 1支付中 2支付成功 3支付失败 4已退款 5已关闭 6待确认'
  })
  status!: PaymentStatus;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '支付场景 1消费 2转账 3充值 4缴费 5理财 6还款'
  })
  pay_scene?: PayScene;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '设备ID'
  })
  device_id?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '设备类型 1手机 2平板 3电脑 4POS 5其他'
  })
  device_type?: DeviceType;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: 'IP地址'
  })
  ip_address?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '交易地点'
  })
  location?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '验证方式 1交易密码 2短信验证码 3指纹 4人脸 5U盾'
  })
  verify_method?: VerifyMethod;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 0,
    comment: '风险等级 0-5'
  })
  risk_level?: RiskLevel;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否需要二次核验'
  })
  need_second_verify!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '二次核验是否通过'
  })
  second_verify_passed!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '支付完成时间'
  })
  pay_time?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '操作员ID'
  })
  operator_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作员姓名'
  })
  operator_name?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '创建时间'
  })
  createdAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '更新时间'
  })
  updatedAt?: Date;

  @BelongsTo(() => Account, 'payer_account_id')
  payer_account?: Account;

  @BelongsTo(() => Account, 'payee_account_id')
  payee_account?: Account;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: OnlinePayment) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}

@Table({
  tableName: 'biz_device_binding',
  comment: '设备绑定表'
})
export class DeviceBinding extends Model<DeviceBinding> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '设备ID'
  })
  device_id!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '设备名称'
  })
  device_name?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '设备类型 1手机 2平板 3电脑'
  })
  device_type?: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '设备操作系统'
  })
  device_os?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: 'APP版本'
  })
  app_version?: string;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '用户ID'
  })
  user_id?: string;

  @ForeignKey(() => Customer)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '客户ID'
  })
  customer_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '绑定账号'
  })
  account_no?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '绑定时间'
  })
  bind_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '最后登录时间'
  })
  last_login_time?: Date;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '最后登录IP'
  })
  last_ip?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否授信设备'
  })
  is_trusted!: boolean;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态 0已解绑 1已绑定 2已冻结'
  })
  status!: DeviceBindingStatus;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: DeviceBinding) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}

@Table({
  tableName: 'biz_merchant_info',
  comment: '商户信息表'
})
export class MerchantInfo extends Model<MerchantInfo> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    comment: '商户号'
  })
  merchant_no!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '商户名称'
  })
  merchant_name!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '商户类型 1普通商户 2特约商户 3黑名单商户'
  })
  merchant_type!: MerchantType;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '商户等级 1-5'
  })
  merchant_level?: MerchantLevel;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '经营范围'
  })
  business_scope?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '联系人姓名'
  })
  contact_name?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '联系电话'
  })
  contact_phone?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '结算账号'
  })
  settle_account_no?: string;

  @Column({
    type: DataType.STRING(8),
    allowNull: true,
    comment: '结算周期 T+0/T+1/T+3'
  })
  settle_cycle?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 0,
    comment: '风险等级 0-5'
  })
  risk_level?: RiskLevel;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态 0停用 1正常 2冻结'
  })
  status!: MerchantStatus;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: MerchantInfo) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
