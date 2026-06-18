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
import { User } from './User';
import { Transaction } from './Transaction';

@Table({
  tableName: 'biz_loan_repayment',
  comment: '贷款还款记录表',
  timestamps: true
})
export class LoanRepayment extends Model<LoanRepayment> {
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
    comment: '还款流水号'
  })
  repayment_no!: string;

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
    comment: '还款类型 1按期还款 2提前还款 3逾期还款 4分期还款'
  })
  repayment_type!: number;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '还款渠道 active主动还款 auto_withhold自动代扣 offline线下还款 transfer转账还款'
  })
  repayment_channel!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '当期期数'
  })
  period_no?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '总期数'
  })
  total_periods?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    comment: '还款金额'
  })
  amount!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '本金'
  })
  principal!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '利息'
  })
  interest!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '违约金/罚息'
  })
  penalty!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '手续费'
  })
  fee!: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '状态 0待处理 1处理中 2还款成功 3还款失败 4已撤销'
  })
  status!: number;

  @ForeignKey(() => Account)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '扣款账户ID'
  })
  account_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '扣款账户号'
  })
  account_no?: string;

  @ForeignKey(() => Transaction)
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '关联交易流水号'
  })
  transaction_no?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '还款时间'
  })
  repay_time?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '操作人ID'
  })
  operator_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作人姓名'
  })
  operator_name?: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '还款前账户余额'
  })
  before_balance?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '还款后账户余额'
  })
  after_balance?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '还款后剩余本金'
  })
  remaining_principal?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '还款后剩余期数'
  })
  remaining_periods?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '账单是否匹配 0不匹配 1匹配'
  })
  bill_matched!: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '账单匹配结果说明'
  })
  bill_match_result?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '异常标记 0正常 1异常'
  })
  abnormal_flag!: number;

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
    comment: '是否需要人工复核 0否 1是'
  })
  need_review!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '复核状态 0待复核 1复核通过 2复核驳回'
  })
  review_status?: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '失败原因'
  })
  fail_reason?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '资金流向描述'
  })
  fund_flow?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作IP地址'
  })
  ip_address?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '请求参数快照'
  })
  request_snapshot?: string;

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

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: LoanRepayment) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
    if (!instance.repayment_no) {
      const now = new Date();
      const timestamp = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      instance.repayment_no = `HK${timestamp}${random}`;
    }
  }
}
