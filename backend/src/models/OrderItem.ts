import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'order_items',
  timestamps: false,
})
export class OrderItem extends Model<OrderItem> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

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
    type: DataType.STRING(255),
    allowNull: false,
    comment: '商品名称（下单时快照）',
  })
  goods_name!: string;

  @Column({
    type: DataType.STRING(500),
    comment: '商品图片（下单时快照）',
  })
  goods_image?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '规格信息（下单时快照）',
  })
  spec_info?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '单价（下单时快照）',
  })
  price!: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '数量',
  })
  quantity!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '小计金额',
  })
  subtotal!: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;
}
