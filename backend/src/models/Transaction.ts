import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Product } from './Product';
import { Organization } from './Organization';
import { User } from './User';

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

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '交易流水号'
  })
  transaction_no!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '交易类型 1存款 2取款 3转账 4理财购买'
  })
  type!: number;

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

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '交易状态 0待处理 1处理中 2成功 3失败 4已冲正 5已撤销'
  })
  status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '审核状态 0待审核 1审核中 2审核通过 3审核拒绝'
  })
  audit_status!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

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

  @BelongsTo(() => Product)
  product?: Product;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BeforeCreate
  static generateId(instance: Transaction) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}