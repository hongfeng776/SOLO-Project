import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_discount_rule_logs',
  timestamps: false,
})
export class MarketingDiscountRuleLog extends Model<MarketingDiscountRuleLog> {
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
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '操作人类型：0-用户 1-管理员 2-系统',
  })
  operator_type!: number;

  @Column({
    type: DataType.STRING(50),
    comment: '操作人名称',
  })
  operator_name?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '操作类型：create/update/enable/disable/delete/threshold_adjust',
  })
  action_type!: string;

  @Column({
    type: DataType.STRING(100),
    comment: '变更字段名',
  })
  field_name?: string;

  @Column({
    type: DataType.TEXT,
    comment: '变更前值',
  })
  old_value?: string;

  @Column({
    type: DataType.TEXT,
    comment: '变更后值',
  })
  new_value?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '变更前状态',
  })
  old_status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '变更后状态',
  })
  new_status?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '备注说明',
  })
  remark?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
