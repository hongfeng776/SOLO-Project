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
import { Transaction } from './Transaction';
import { ViolationRecord } from './ViolationRecord';
import { Organization } from './Organization';

@Table({
  tableName: 'biz_customer',
  comment: '客户信息表'
})
export class Customer extends Model<Customer> {
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
    comment: '客户编号'
  })
  customer_no!: string;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '客户名称'
  })
  customer_name?: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '证件号码'
  })
  id_card_no?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '证件类型 1身份证 2护照 3军官证 4营业执照'
  })
  id_type?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '客户类型 1个人 2企业'
  })
  customer_type?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '客户等级 1普通 2银卡 3金卡 4白金 5钻石'
  })
  customer_level?: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '手机号'
  })
  mobile?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '联系地址'
  })
  address?: string;

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
    comment: '风险标签 逗号分隔'
  })
  risk_tags?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态 0冻结 1正常 2销户'
  })
  status!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '开户时间'
  })
  open_date?: Date;

  @HasMany(() => Transaction, { foreignKey: 'customer_id', constraints: false })
  transactions?: Transaction[];

  @HasMany(() => ViolationRecord, { foreignKey: 'customer_id', constraints: false })
  violation_records?: ViolationRecord[];

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '客户归属机构ID'
  })
  org_id?: string;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: Customer) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
