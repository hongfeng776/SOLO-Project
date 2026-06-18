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
  HasMany,
  Index
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './Organization';
import { User } from './User';
import { Customer } from './Customer';
import { Account } from './Account';

export type TransferType = 1 | 2 | 3 | 4;
export type TransferMode = 1 | 2 | 3;
export type SettlementStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type AuditStatus = 0 | 1 | 2 | 3 | 10 | 11;
export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const TransferTypeText: Record<number, string> = {
  1: '同行转账',
  2: '跨行转账',
  3: '对公转账',
  4: '对私转账'
};

export const TransferModeText: Record<number, string> = {
  1: '普通转账',
  2: '加急转账',
  3: '实时转账'
};

export const SettlementStatusText: Record<number, string> = {
  0: '待提交',
  1: '待复核',
  2: '处理中',
  3: '已结算',
  4: '已撤销',
  5: '已失败',
  6: '已退回'
};

export const AuditStatusText: Record<number, string> = {
  0: '待审核',
  1: '一级审核中',
  2: '二级审核中',
  3: '三级审核中',
  10: '审核通过',
  11: '审核拒绝'
};

export const RiskLevelText: Record<number, string> = {
  0: '无风险',
  1: '低风险',
  2: '中低风险',
  3: '中风险',
  4: '中高风险',
  5: '高风险'
};

export interface FeeConfig {
  min_fee: number;
  max_fee: number;
  rate: number;
  fixed_amount?: number;
}

export const TRANSFER_FEE_CONFIG: Record<TransferType, Record<TransferMode, FeeConfig>> = {
  1: {
    1: { min_fee: 0, max_fee: 0, rate: 0 },
    2: { min_fee: 2, max_fee: 50, rate: 0.0005 },
    3: { min_fee: 5, max_fee: 100, rate: 0.001 }
  },
  2: {
    1: { min_fee: 2, max_fee: 50, rate: 0.0005 },
    2: { min_fee: 5, max_fee: 100, rate: 0.001 },
    3: { min_fee: 10, max_fee: 200, rate: 0.002 }
  },
  3: {
    1: { min_fee: 5, max_fee: 200, rate: 0.0005 },
    2: { min_fee: 10, max_fee: 300, rate: 0.001 },
    3: { min_fee: 20, max_fee: 500, rate: 0.002 }
  },
  4: {
    1: { min_fee: 0, max_fee: 50, rate: 0.0003 },
    2: { min_fee: 2, max_fee: 100, rate: 0.0005 },
    3: { min_fee: 5, max_fee: 200, rate: 0.001 }
  }
};

export const ARRIVAL_TIME_CONFIG: Record<TransferType, Record<TransferMode, string>> = {
  1: {
    1: '实时到账',
    2: '30分钟内到账',
    3: '秒级到账'
  },
  2: {
    1: '1-2个工作日',
    2: '2小时内到账',
    3: '实时到账'
  },
  3: {
    1: '1-3个工作日',
    2: '当日到账',
    3: '2小时内到账'
  },
  4: {
    1: '2小时内到账',
    2: '30分钟内到账',
    3: '实时到账'
  }
};

export const REVIEW_RULE_CONFIG = {
  SINGLE_AUTO_REVIEW_THRESHOLD: 50000,
  BATCH_SMALL_AMOUNT_THRESHOLD: 10000,
  BATCH_LARGE_AMOUNT_THRESHOLD: 500000,
  SINGLE_LEVEL_REVIEW_THRESHOLD: 200000,
  MULTI_LEVEL_REVIEW_THRESHOLD: 1000000
};

export const TRANSFER_LIMIT_CONFIG: Record<number, { single_limit: number; daily_limit: number; monthly_limit: number }> = {
  1: { single_limit: 5000000, daily_limit: 20000000, monthly_limit: 100000000 },
  2: { single_limit: 1000000, daily_limit: 5000000, monthly_limit: 50000000 },
  3: { single_limit: 200000, daily_limit: 1000000, monthly_limit: 10000000 }
};

export const PUBLIC_PRIVATE_RULES = {
  ALLOW_PUBLIC_TO_PRIVATE: true,
  ALLOW_PRIVATE_TO_PUBLIC: true,
  PUBLIC_TO_PRIVATE_DAILY_LIMIT: 500000,
  PRIVATE_TO_PUBLIC_DAILY_LIMIT: 10000000,
  REQUIRED_PURPOSE_FOR_PUBLIC_TO_PRIVATE: ['salary', 'bonus', 'refund', 'dividend', 'reimbursement'],
  REQUIRED_PURPOSE_FOR_PRIVATE_TO_PUBLIC: ['investment', 'payment', 'loan', 'donation']
};

export const RISK_DETECTION_RULES = {
  SAME_NAME_TRANSFER_COUNT_THRESHOLD: 5,
  SAME_NAME_TRANSFER_TIME_WINDOW_HOURS: 24,
  LARGE_AMOUNT_NO_PURPOSE_THRESHOLD: 500000,
  ABNORMAL_LOCATION_CHECK: true,
  NIGHT_TRANSACTION_START_HOUR: 22,
  NIGHT_TRANSACTION_END_HOUR: 6,
  NIGHT_TRANSACTION_AMOUNT_THRESHOLD: 100000
};

@Table({
  tableName: 'biz_settlement',
  comment: '支付结算流水表'
})
export class Settlement extends Model<Settlement> {
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
    comment: '结算流水号'
  })
  settlement_no!: string;

  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '关联批量转账ID'
  })
  batch_id?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '转账类型 1同行转账 2跨行转账 3对公转账 4对私转账'
  })
  transfer_type!: TransferType;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '转账模式 1普通转账 2加急转账 3实时转账'
  })
  transfer_mode!: TransferMode;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '业务渠道 counter柜面 mobile手机银行 ebank网上银行'
  })
  channel_code?: string;

  @ForeignKey(() => Account)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '转出账户ID'
  })
  payer_account_id!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '转出账户号'
  })
  payer_account_no!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '转出账户户名'
  })
  payer_account_name?: string;

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '转出客户ID'
  })
  payer_customer_id?: string;

  @Column({
    type: DataType.STRING(1),
    allowNull: true,
    comment: '转出账户类型 P公户 I私户'
  })
  payer_account_type?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '收款账户号'
  })
  payee_account_no!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '收款账户户名'
  })
  payee_account_name!: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '收款行号/联行号'
  })
  payee_bank_code?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '收款开户行名称'
  })
  payee_bank_name?: string;

  @Column({
    type: DataType.STRING(1),
    allowNull: true,
    comment: '收款账户类型 P公户 I私户'
  })
  payee_account_type?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '收款账户所在地'
  })
  payee_location?: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '转账金额'
  })
  amount!: number;

  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    defaultValue: 'CNY',
    comment: '币种'
  })
  currency!: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '手续费'
  })
  fee!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '手续费计算方式说明'
  })
  fee_calc_desc?: string;

  @Column({
    type: DataType.STRING(16),
    allowNull: true,
    comment: '到账时效'
  })
  arrival_time?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '转账用途'
  })
  purpose?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '附言/摘要'
  })
  remark?: string;

  @ForeignKey(() => Organization)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '经办机构ID'
  })
  org_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '经办人ID'
  })
  operator_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '复核人ID'
  })
  reviewer_id?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '结算状态 0待提交 1待复核 2处理中 3已结算 4已撤销 5已失败 6已退回'
  })
  status!: SettlementStatus;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '审核状态 0待审核 1一级审核中 2二级审核中 3三级审核中 10审核通过 11审核拒绝'
  })
  audit_status!: AuditStatus;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 0,
    comment: '风险等级 0无风险 1低 2中低 3中 4中高 5高'
  })
  risk_level?: RiskLevel;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '风险标签 逗号分隔'
  })
  risk_tags?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否需要人工复核'
  })
  need_review!: boolean;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '复核原因'
  })
  review_reason?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '撤销原因'
  })
  cancel_reason?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '原结算流水号（用于冲正）'
  })
  original_settlement_no?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '请求唯一ID（幂等校验）'
  })
  request_id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '提交时间'
  })
  submit_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '复核时间'
  })
  review_time?: Date;

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '结算完成时间'
  })
  settle_time?: Date;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '转出前余额'
  })
  original_balance?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '转出后余额'
  })
  new_balance?: number;

  @BelongsTo(() => Account, 'payer_account_id')
  payer_account?: Account;

  @BelongsTo(() => Customer, 'payer_customer_id')
  payer_customer?: Customer;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BelongsTo(() => User, 'reviewer_id')
  reviewer?: User;

  @HasMany(() => Settlement, { foreignKey: 'original_settlement_no', sourceKey: 'settlement_no', constraints: false })
  related_settlements?: Settlement[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: Settlement) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}

@Table({
  tableName: 'biz_settlement_batch',
  comment: '批量转账任务表'
})
export class SettlementBatch extends Model<SettlementBatch> {
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
    comment: '批次号'
  })
  batch_no!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '批次名称'
  })
  batch_name!: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '批量类型 1网点对公批量转账 2代发工资 3代发报销 4其他批量'
  })
  batch_type!: number;

  @ForeignKey(() => Account)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '批量转出账户ID'
  })
  payer_account_id!: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '批量转出账户号'
  })
  payer_account_no!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '批量转出账户户名'
  })
  payer_account_name?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总笔数'
  })
  total_count!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '总金额'
  })
  total_amount!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '手续费合计'
  })
  total_fee!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '成功笔数'
  })
  success_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '失败笔数'
  })
  fail_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '待处理笔数'
  })
  pending_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '处理中笔数'
  })
  processing_count!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '批次状态 0待提交 1待复核 2处理中 3部分完成 4全部完成 5已撤销 6已失败'
  })
  status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '审核状态 0待审核 10审核通过 11审核拒绝'
  })
  audit_status!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否需要人工复核'
  })
  need_review!: boolean;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '经办机构ID'
  })
  org_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '经办人ID'
  })
  operator_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '复核人ID'
  })
  reviewer_id?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '复核原因'
  })
  review_reason?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '批次备注'
  })
  remark?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '提交时间'
  })
  submit_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '完成时间'
  })
  complete_time?: Date;

  @BelongsTo(() => Account, 'payer_account_id')
  payer_account?: Account;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BelongsTo(() => User, 'reviewer_id')
  reviewer?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: SettlementBatch) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
