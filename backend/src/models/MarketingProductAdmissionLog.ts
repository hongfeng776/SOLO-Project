import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_product_admission_logs',
  timestamps: false,
  createdAt: 'created_at',
})
export class MarketingProductAdmissionLog extends Model<MarketingProductAdmissionLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '活动商品ID',
  })
  marketing_product_id!: number;

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
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '操作人类型：1-系统 2-管理员 3-商家',
  })
  operator_type!: number;

  @Column({
    type: DataType.STRING(50),
    comment: '操作人姓名',
  })
  operator_name?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '操作动作：apply-报名 audit_pass-审核通过 audit_reject-审核驳回 offline-下架 online-上架 rule_match-规则匹配',
  })
  action!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '原准入状态',
  })
  old_status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '新准入状态',
  })
  new_status?: number;

  @Column({
    type: DataType.STRING(100),
    comment: '变更字段',
  })
  field_name?: string;

  @Column({
    type: DataType.TEXT,
    comment: '原值',
  })
  old_value?: string;

  @Column({
    type: DataType.TEXT,
    comment: '新值',
  })
  new_value?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '备注/原因',
  })
  remark?: string;

  @Column({
    type: DataType.JSON,
    comment: '规则匹配明细',
  })
  rule_match_detail?: any;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;
}
