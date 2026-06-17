import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'goods_snapshots',
  timestamps: false,
  indexes: [
    {
      name: 'idx_snapshot_no',
      fields: ['snapshot_no'],
      unique: true,
    },
    {
      name: 'idx_order_id',
      fields: ['order_id'],
    },
    {
      name: 'idx_goods_id',
      fields: ['goods_id'],
    },
    {
      name: 'idx_merchant_id',
      fields: ['merchant_id'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class GoodsSnapshot extends Model<GoodsSnapshot> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '快照编号',
  })
  snapshot_no!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '订单ID',
  })
  order_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商品ID',
  })
  goods_id!: number;

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
    comment: '当时库存',
  })
  stock?: number;

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
    type: DataType.STRING(255),
    comment: '规格信息',
  })
  spec_info?: string;

  @Column({
    type: DataType.JSON,
    comment: '完整快照数据',
  })
  snapshot_data?: object;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    comment: '创建时间',
  })
  created_at!: Date;
}
