import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_admission_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class MarketingAdmissionRule extends Model<MarketingAdmissionRule> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '营销活动ID，为空则为全局规则',
  })
  marketing_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '活动类型，为空则为全局规则',
  })
  marketing_type?: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '规则名称',
  })
  rule_name!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '规则类型：compliance_rating-商品评级 stock-库存 violation-违规记录 merchant_credit-商家信用 category-类目匹配 price_range-价格区间',
  })
  rule_type!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '最低合规评级：1-A 2-B 3-C 4-D',
  })
  min_compliance_rating?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    comment: '最低库存数量',
  })
  min_stock?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '最大违规次数',
  })
  max_violation_count?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 60,
    comment: '最低商家信用分',
  })
  min_merchant_credit?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '最低店铺等级：1-新店 2-铜牌 3-银牌 4-金牌 5-钻石',
  })
  min_shop_level?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '允许的类目ID列表，逗号分隔',
  })
  category_ids?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '最低价格',
  })
  min_price?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '最高价格',
  })
  max_price?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '是否禁止跨类目报名：0-否 1-是',
  })
  block_cross_category?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status!: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序',
  })
  sort_order?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  updated_at!: Date;
}
