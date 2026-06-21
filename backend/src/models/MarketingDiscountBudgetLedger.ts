import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_discount_budget_ledger',
  timestamps: false,
})
export class MarketingDiscountBudgetLedger extends Model<MarketingDiscountBudgetLedger> {
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
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '台账类型：1-预算划拨 2-优惠消耗 3-预算退回 4-预算调整',
  })
  ledger_type!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
    comment: '变动金额（正数增加，负数减少）',
  })
  amount!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0.00,
    comment: '变动前余额',
  })
  balance_before?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0.00,
    comment: '变动后余额',
  })
  balance_after?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '关联订单ID',
  })
  order_id?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '关联用户ID',
  })
  user_id?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '操作人名称',
  })
  operator_name?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '备注',
  })
  remark?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
