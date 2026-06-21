import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_discount_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class MarketingDiscountRule extends Model<MarketingDiscountRule> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '所属营销活动ID',
  })
  marketing_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '规则名称',
  })
  rule_name!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '优惠类型：1-满减 2-折扣 3-优惠券',
  })
  discount_type!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: '最低消费金额',
  })
  min_amount?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '优惠值：满减金额或折扣率(%)',
  })
  discount_value?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '最大优惠金额',
  })
  max_discount_amount?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否可叠加：0-否 1-是',
  })
  stackable?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 1,
    comment: '叠加上限次数',
  })
  stack_limit?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '互斥规则ID列表，逗号分隔',
  })
  exclude_rule_ids?: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    comment: '最低用户等级',
  })
  user_level_min?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    comment: '最高用户等级',
  })
  user_level_max?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '适用类目ID，逗号分隔',
  })
  applicable_category_ids?: string;

  @Column({
    type: DataType.TEXT,
    comment: '适用商品ID，逗号分隔，为空表示全量',
  })
  applicable_goods_ids?: string;

  @Column({
    type: DataType.TEXT,
    comment: '排除商品ID，逗号分隔',
  })
  exclude_goods_ids?: string;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0.00,
    comment: '总预算金额',
  })
  budget_total?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0.00,
    comment: '已使用预算',
  })
  budget_used?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '总优惠配额(发放数量)',
  })
  quota_total?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '已使用配额',
  })
  quota_used?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 1,
    comment: '每人限用数量',
  })
  quota_per_user?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '生效状态：0-未生效 1-生效中 2-已失效 3-已禁用',
  })
  effective_status?: number;

  @Column({
    type: DataType.DATE,
    comment: '生效开始时间',
  })
  start_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '生效结束时间',
  })
  end_time?: Date;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序',
  })
  sort_order?: number;

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

  @UpdatedAt
  @Column({
    type: DataType.DATE,
  })
  updated_at!: Date;
}
