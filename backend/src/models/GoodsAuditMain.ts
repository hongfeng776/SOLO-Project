import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'goods_audit_mains',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uk_audit_no',
      fields: ['audit_no'],
      unique: true,
    },
    {
      name: 'idx_goods_id',
      fields: ['goods_id'],
    },
    {
      name: 'idx_merchant',
      fields: ['merchant_id'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_risk',
      fields: ['risk_level'],
    },
    {
      name: 'idx_submit_at',
      fields: ['submit_at'],
    },
    {
      name: 'idx_timeout',
      fields: ['timeout_flag'],
    },
  ],
})
export class GoodsAuditMain extends Model<GoodsAuditMain> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商品ID',
  })
  goods_id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    comment: '审核单号(AUD+yyyyMMdd+4位序号)',
  })
  audit_no!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '商家ID',
  })
  merchant_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '风险等级：1低风险 2中风险 3高风险',
  })
  risk_level?: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    comment: '商家信用分(审核时快照)',
  })
  merchant_credit_score?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '审核状态：0待初审 1初审通过待复审 2初审驳回 3复审通过 4复审驳回 5补充材料中 6审核冻结 7已撤回',
  })
  status?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '初审人',
  })
  initial_reviewer_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '初审结果：1通过 2驳回 3转人工',
  })
  initial_result?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '初审备注',
  })
  initial_remark?: string;

  @Column({
    type: DataType.DATE,
    comment: '初审时间',
  })
  initial_reviewed_at?: Date;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '复审人',
  })
  final_reviewer_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '复审结果：1通过 2驳回',
  })
  final_result?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '复审备注(驳回原因)',
  })
  final_remark?: string;

  @Column({
    type: DataType.DATE,
    comment: '复审时间',
  })
  final_reviewed_at?: Date;

  @Column({
    type: DataType.JSON,
    comment: '驳回原因明细[{field,reason,suggestion}]',
  })
  reject_reasons_json?: object;

  @Column({
    type: DataType.DATE,
    comment: '补充材料截止时间',
  })
  supplement_deadline?: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    comment: '补充次数',
  })
  supplement_count?: number;

  @Column({
    type: DataType.DATE,
    comment: '提交时间',
  })
  submit_at?: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 48,
    comment: '审核时效(小时)',
  })
  timeout_hours?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '超时标记：0未超时 1已超时',
  })
  timeout_flag?: number;

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
