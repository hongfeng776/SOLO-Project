import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class MarketingProduct extends Model<MarketingProduct> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '营销活动ID',
  })
  marketing_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商品ID',
  })
  goods_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '商品名称',
  })
  goods_name!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '商品分类ID',
  })
  category_id?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '商家ID',
  })
  merchant_id?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '商品原价',
  })
  original_price?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '活动价格',
  })
  activity_price?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    comment: '折扣上限',
  })
  discount_limit?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '活动库存',
  })
  stock?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '已售数量',
  })
  sold_count?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序',
  })
  sort_order?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-下架 1-上架',
  })
  status?: number;

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
