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
import { Customer } from './Customer';
import { Organization } from './Organization';
import { User } from './User';

@Table({
  tableName: 'biz_account',
  comment: '银行账户表'
})
export class Account extends Model<Account> {
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
    comment: '账户号（系统自动生成，6222开头）'
  })
  account_no!: string;

  @ForeignKey(() => Customer)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '关联客户ID'
  })
  customer_id!: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '客户编号'
  })
  customer_no!: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '账户类型 1一类账户(普通) 2二类账户 3三类账户'
  })
  account_type!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '账户别名/昵称'
  })
  alias?: string;

  @Column({
    type: DataType.STRING(3),
    allowNull: false,
    defaultValue: 'CNY',
    comment: '币种 CNY人民币 USD美元 HKD港币等'
  })
  currency!: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '账户余额'
  })
  balance!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '可用余额（扣除冻结部分）'
  })
  available_balance!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '冻结金额'
  })
  frozen_amount!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 200000,
    comment: '单日累计限额（一类：20万/二类：1万/三类：2000）'
  })
  daily_limit!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 50000,
    comment: '单笔限额（一类：5万/二类：5000/三类：1000）'
  })
  single_limit!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 10,
    comment: '年费标准（元/年）'
  })
  annual_fee!: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '开户用途 salary工资 business经营 investment投资 consumption消费 other其他'
  })
  open_purpose?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '功能权限（逗号分隔，如 transfer,deposit,withdraw,payment,online_banking）'
  })
  function_permissions?: string;

  @ForeignKey(() => Organization)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '开户机构ID'
  })
  open_org_id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '开户操作员ID'
  })
  open_operator_id?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '账户状态 0已注销 1正常 2冻结 3挂失 4休眠'
  })
  status!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '开户时间'
  })
  open_date?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '销户时间'
  })
  close_date?: Date;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '关联开户申请ID'
  })
  opening_id?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => User, 'open_operator_id')
  operator?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: Account) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
