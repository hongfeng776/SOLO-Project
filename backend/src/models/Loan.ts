import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  Index,
  HasMany,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Customer } from './Customer';
import { Product } from './Product';
import { Organization } from './Organization';
import { User } from './User';
import { Transaction } from './Transaction';
import { StatusChangeLog } from './StatusChangeLog';

@Table({
  tableName: 'biz_loan',
  comment: '贷款申请表',
  timestamps: true
})
export class Loan extends Model<Loan> {
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
    comment: '贷款编号'
  })
  loan_no!: string;

  @Index
  @ForeignKey(() => Customer)
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
    comment: '客户编号'
  })
  customer_no?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '客户名称'
  })
  customer_name?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '证件号码'
  })
  id_card_no?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '贷款类型 1个人消费贷 2经营贷 3房贷 4车贷'
  })
  loan_type!: number;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '产品ID'
  })
  product_id?: string;

  @Index
  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    comment: '贷款金额'
  })
  amount!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '贷款期限（月）'
  })
  term!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '贷款用途'
  })
  purpose!: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '贷款用途明细'
  })
  purpose_detail?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '还款方式 1等额本息 2等额本金 3先息后本 4到期一次还本付息'
  })
  repayment_method!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    comment: '年利率（%）'
  })
  interest_rate!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '总利息'
  })
  total_interest?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '月供'
  })
  monthly_payment?: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '状态 0待提交 1待预审 2预审通过 3预审拒绝 4待终审 5终审通过 6终审拒绝 7已放款 8已撤销'
  })
  status!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '申请时间'
  })
  apply_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '预审时间'
  })
  pre_approve_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '终审时间'
  })
  final_approve_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '放款时间'
  })
  disburse_time?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '撤销原因'
  })
  cancel_reason?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '撤销操作人ID'
  })
  cancel_operator_id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '撤销时间'
  })
  cancel_time?: Date;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '申请机构ID'
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
    comment: '预审人ID'
  })
  pre_reviewer_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '终审人ID'
  })
  final_reviewer_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '预审结果'
  })
  pre_approve_result?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '终审结果'
  })
  final_approve_result?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '预审意见'
  })
  pre_approve_opinion?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '终审意见'
  })
  final_approve_opinion?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '风险等级 0无风险 1低 2中低 3中 4中高 5高'
  })
  risk_level?: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '风险标签 逗号分隔'
  })
  risk_tags?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '信用评分'
  })
  credit_score?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    comment: '负债率（%）'
  })
  debt_ratio?: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    comment: '是否低资质客户'
  })
  is_low_quality?: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '抵押物信息（JSON）'
  })
  collateral_info?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '申请渠道'
  })
  apply_channel?: string;

  @ForeignKey(() => Transaction)
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '关联放款交易号'
  })
  disburse_transaction_no?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => Product)
  product?: Product;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BelongsTo(() => User, 'pre_reviewer_id')
  pre_reviewer?: User;

  @BelongsTo(() => User, 'final_reviewer_id')
  final_reviewer?: User;

  @HasMany(() => StatusChangeLog, { foreignKey: 'biz_id', constraints: false })
  status_change_logs?: StatusChangeLog[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: Loan) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
