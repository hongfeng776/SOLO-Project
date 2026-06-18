import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  Index,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Loan } from './Loan';
import { Customer } from './Customer';
import { Account } from './Account';

@Table({
  tableName: 'biz_loan_withhold',
  comment: '贷款批量代扣记录表',
  timestamps: true
})
export class LoanWithhold extends Model<LoanWithhold> {
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
    comment: '代扣批次号'
  })
  batch_no!: string;

  @Index
  @ForeignKey(() => Loan)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '贷款ID'
  })
  loan_id!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '贷款编号'
  })
  loan_no!: string;

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '客户ID'
  })
  customer_id!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '客户姓名'
  })
  customer_name!: string;

  @ForeignKey(() => Account)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '扣款账户ID'
  })
  account_id!: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '扣款账户号'
  })
  account_no!: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    comment: '应扣金额'
  })
  due_amount!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '实际扣款金额'
  })
  actual_amount?: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '应扣日期'
  })
  due_date!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '实际扣款时间'
  })
  actual_date?: Date;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '状态 0待代扣 1代扣中 2代扣成功 3代扣失败 4已取消'
  })
  status!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '期数'
  })
  period_no!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '总期数'
  })
  total_periods?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '还款优先级 1正常 5逾期优先'
  })
  repayment_priority!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否逾期 0否 1是'
  })
  is_overdue!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '逾期天数'
  })
  overdue_days?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '贷款类型'
  })
  loan_type?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '账户余额（代扣时快照）'
  })
  account_balance?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '代扣协议是否有效 0无效 1有效'
  })
  withhold_agreement_valid?: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '关联交易流水号'
  })
  transaction_no?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '失败原因'
  })
  fail_reason?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '异常类型'
  })
  abnormal_type?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '异常原因'
  })
  abnormal_reason?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '重试次数'
  })
  retry_count!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作IP'
  })
  ip_address?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => Loan)
  loan?: Loan;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => Account)
  account?: Account;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: LoanWithhold) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
