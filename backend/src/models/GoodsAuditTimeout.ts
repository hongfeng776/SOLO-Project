import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'goods_audit_timeouts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_audit',
      fields: ['audit_id'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_deadline',
      fields: ['deadline'],
    },
  ],
})
export class GoodsAuditTimeout extends Model<GoodsAuditTimeout> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '审核主表ID',
  })
  audit_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商品ID',
  })
  goods_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '商家ID',
  })
  merchant_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '超时类型：1初审超时 2复审超时 3补充材料超时',
  })
  timeout_type!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '截止时间',
  })
  deadline!: Date;

  @Column({
    type: DataType.DATE,
    comment: '实际处理时间',
  })
  actual_time?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '状态：0未处理 1已处理 2已豁免',
  })
  status?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '处理人',
  })
  handler_id?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '处理备注',
  })
  handle_remark?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
