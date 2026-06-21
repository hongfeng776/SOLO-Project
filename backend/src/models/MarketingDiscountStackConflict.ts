import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_discount_stack_conflicts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class MarketingDiscountStackConflict extends Model<MarketingDiscountStackConflict> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '当前规则ID',
  })
  rule_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '冲突规则ID',
  })
  conflict_rule_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '冲突类型：1-互斥规则 2-超限叠加 3-类目冲突 4-预算冲突',
  })
  conflict_type!: number;

  @Column({
    type: DataType.STRING(500),
    comment: '冲突详情',
  })
  conflict_detail?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '触发用户ID',
  })
  user_id?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '触发订单ID',
  })
  order_id?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 1,
    comment: '拦截次数',
  })
  intercept_count?: number;

  @Column({
    type: DataType.DATE,
    comment: '首次拦截时间',
  })
  first_intercept_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '最近拦截时间',
  })
  last_intercept_time?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-已处理 1-待处理',
  })
  status?: number;

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
