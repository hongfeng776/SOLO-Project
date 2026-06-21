import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_discount_usage_records',
  timestamps: false,
})
export class MarketingDiscountUsageRecord extends Model<MarketingDiscountUsageRecord> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '优惠规则ID',
  })
  rule_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '营销活动ID',
  })
  marketing_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.STRING(100),
    comment: '用户名称',
  })
  user_name?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '关联订单ID',
  })
  order_id?: number;

  @Column({
    type: DataType.STRING(64),
    comment: '订单编号',
  })
  order_no?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '关联商品ID',
  })
  goods_id?: number;

  @Column({
    type: DataType.STRING(255),
    comment: '商品名称',
  })
  goods_name?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: '原始金额',
  })
  original_amount?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: '优惠金额',
  })
  discount_amount?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: '最终金额',
  })
  final_amount?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '叠加使用的规则ID列表',
  })
  stack_rule_ids?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '使用时间',
  })
  usage_time!: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-已取消 1-已使用 2-已退款',
  })
  status?: number;

  @Column({
    type: DataType.DATE,
    comment: '退款时间',
  })
  refund_time?: Date;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
