import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  HasMany
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from './Transaction';

@Table({
  tableName: 'biz_product',
  comment: '产品表'
})
export class Product extends Model<Product> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '产品名称'
  })
  name!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '产品代码'
  })
  code!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '产品分类'
  })
  category?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '产品类型'
  })
  type?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '产品描述'
  })
  description?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 3,
    comment: '风险等级 1低 2中低 3中 4中高 5高'
  })
  risk_level?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '起购金额'
  })
  min_amount?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '最高金额'
  })
  max_amount?: number;

  @Column({
    type: DataType.DECIMAL(10, 6),
    allowNull: true,
    defaultValue: 0,
    comment: '年化利率(%)'
  })
  interest_rate?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '期限(天)'
  })
  term_days?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '排序'
  })
  sort?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态 0下架 1上架'
  })
  status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '存款类型 1普通存款 2大额存单 3智能存款'
  })
  deposit_type?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '贷款类型 1个人消费贷 2经营贷 3房贷 4车贷'
  })
  loan_type?: number;

  @HasMany(() => Transaction, { foreignKey: 'product_id' })
  transactions?: Transaction[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: Product) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}