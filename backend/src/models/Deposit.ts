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
import { Product } from './Product';
import { Organization } from './Organization';
import { User } from './User';
import { Customer } from './Customer';
import { Account } from './Account';

@Table({
  tableName: 'biz_deposit',
  comment: '存款业务表'
})
export class Deposit extends Model<Deposit> {
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
    comment: '存款流水号'
  })
  deposit_no!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '账户号'
  })
  account_no!: string;

  @ForeignKey(() => Account)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '账户ID'
  })
  account_id!: string;

  @ForeignKey(() => Customer)
  @Index
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

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '存款类型 1普通存款 2大额存单 3智能存款'
  })
  deposit_type!: number;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '关联产品ID'
  })
  product_id?: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '存款金额'
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
    type: DataType.INTEGER,
    allowNull: true,
    comment: '存期(天) 0活期 301个月 903个月 1806个月 3651年 7302年 10953年 18255年'
  })
  term?: number;

  @Column({
    type: DataType.DECIMAL(10, 6),
    allowNull: false,
    defaultValue: 0,
    comment: '执行利率(%)'
  })
  interest_rate!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '计息方式 1按季结息 2按年结息 3到期一次性还本付息 4按月结息'
  })
  interest_method?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '预期利息'
  })
  calculated_interest?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '实际利息'
  })
  actual_interest?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '到期日期'
  })
  maturity_date?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '起息日期'
  })
  value_date!: Date;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '业务渠道 counter柜面 mobile手机银行 ebank网上银行 atm自助终端 smart智慧柜员机'
  })
  channel_code?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '渠道终端编号/设备号'
  })
  channel_terminal?: string;

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

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '存款状态 0待确认 1处理中 2已入账 3已撤销 4已到期 5已支取'
  })
  status!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '存款前账户余额'
  })
  original_balance?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '存款后账户余额'
  })
  new_balance?: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '请求唯一ID(幂等校验)'
  })
  request_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '关联交易流水号'
  })
  related_transaction_no?: string;

  @BelongsTo(() => Product)
  product?: Product;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => Account)
  account?: Account;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: Deposit) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
    if (!instance.value_date) {
      instance.value_date = new Date();
    }
  }
}
