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
import { Product } from './Product';
import { Organization } from './Organization';
import { User } from './User';
import { Customer } from './Customer';

@Table({
  tableName: 'biz_transaction',
  comment: '交易记录表'
})
export class Transaction extends Model<Transaction> {
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
    comment: '交易流水号'
  })
  transaction_no!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '业务渠道 counter柜面 mobile手机银行 ebank网上银行 atm自助终端 phone电话银行 smart智慧柜员机 posPOS终端 wechat微信渠道 alipay支付宝渠道'
  })
  channel_code?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '渠道终端编号/设备号'
  })
  channel_terminal?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '交易类型 1存款 2取款 3转账 4理财购买 5贷款发放 6缴费支付 7结售汇 8信用卡还款'
  })
  type!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '业务线 retail零售 corporate对公 private私行 wealth财富'
  })
  business_line?: string;

  @Index
  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '交易金额'
  })
  amount!: number;

  @Column({
    type: DataType.STRING(16),
    allowNull: true,
    defaultValue: 'CNY',
    comment: '币种'
  })
  currency?: string;

  @Index
  @ForeignKey(() => Customer)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '客户ID'
  })
  customer_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '客户编号'
  })
  customer_no?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '付款账户'
  })
  payer_account?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '付款人姓名'
  })
  payer_name?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '收款账户'
  })
  payee_account?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '收款人姓名'
  })
  payee_name?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '收款行号/联行号'
  })
  payee_bank_code?: string;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '关联产品ID'
  })
  product_id?: string;

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

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '交易状态 0待处理 1处理中 2成功 3失败 4已冲正 5已撤销 6冻结 7退款中 8已退款'
  })
  status!: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '审核状态 0待审核 1一级审核中 2二级审核中 3三级审核中 10审核通过 11审核拒绝'
  })
  audit_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 0,
    comment: '风险等级 0无风险 1低 2中低 3中 4中高 5高'
  })
  risk_level?: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '风险标签 逗号分隔 异常金额/可疑账户/频繁交易/跨境交易/夜间交易'
  })
  risk_tags?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '当前流程节点'
  })
  current_node?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '下一流程节点'
  })
  next_node?: string;

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '交易时间'
  })
  transaction_time?: Date;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '手续费'
  })
  fee?: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '原交易流水号(用于冲正/退款)'
  })
  original_transaction_no?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '请求唯一ID(幂等校验)'
  })
  request_id?: string;

  @BelongsTo(() => Product)
  product?: Product;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @HasMany(() => Transaction, { foreignKey: 'original_transaction_no', sourceKey: 'transaction_no', constraints: false })
  related_transactions?: Transaction[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: Transaction) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
    if (!instance.transaction_time) {
      instance.transaction_time = new Date();
    }
  }
}