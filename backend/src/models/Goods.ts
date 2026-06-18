import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'goods',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_sku_code',
      fields: ['sku_code'],
      unique: true,
    },
    {
      name: 'idx_brand_category',
      fields: ['brand_id', 'category_id'],
    },
    {
      name: 'idx_merchant_status',
      fields: ['merchant_id', 'status'],
    },
    {
      name: 'idx_sort_weight',
      fields: ['sort_weight', 'top_flag'],
    },
    {
      name: 'idx_compliance_rating',
      fields: ['compliance_rating'],
    },
    {
      name: 'idx_sale_time',
      fields: ['sale_start_time', 'sale_end_time'],
    },
  ],
})
export class Goods extends Model<Goods> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '商品编码',
  })
  sku_code!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '商品名称',
  })
  name!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '分类ID',
  })
  category_id?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '品牌ID',
  })
  brand_id?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '售价',
  })
  price!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '原价',
  })
  original_price?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '库存',
  })
  stock?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '销量',
  })
  sales?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '销售数量',
  })
  sales_count?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '合规评级：1-A 2-B 3-C 4-D',
  })
  compliance_rating?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-下架 1-上架',
  })
  status?: number;

  @Column({
    type: DataType.STRING(255),
    comment: '封面图',
  })
  cover_image?: string;

  @Column({
    type: DataType.TEXT,
    comment: '商品描述',
  })
  description?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '商家ID',
  })
  merchant_id?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '置顶权重',
  })
  sort_weight?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否置顶：0-否 1-是',
  })
  top_flag?: number;

  @Column({
    type: DataType.DATE,
    comment: '售卖开始时间',
  })
  sale_start_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '售卖结束时间',
  })
  sale_end_time?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否在活动中：0-否 1-是',
  })
  in_activity?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
  })
  updated_at!: Date;
}
