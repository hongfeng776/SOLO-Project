import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'after_sale_operation_logs',
  timestamps: false,
  indexes: [
    {
      name: 'idx_after_sale_id',
      fields: ['after_sale_id'],
    },
    {
      name: 'idx_after_sale_no',
      fields: ['after_sale_no'],
    },
    {
      name: 'idx_order_id',
      fields: ['order_id'],
    },
    {
      name: 'idx_action',
      fields: ['action'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class AfterSaleOperationLog extends Model<AfterSaleOperationLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '售后记录ID',
  })
  after_sale_id!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '售后单号',
  })
  after_sale_no!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '订单ID',
  })
  order_id!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '订单编号',
  })
  order_no!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '操作类型：apply/audit_pass/audit_reject/process/complete/cancel/close/stock_rollback/settle_deduct/points_rollback/terminate',
  })
  action!: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    comment: '操作描述',
  })
  action_desc!: string;

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
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '操作人姓名',
  })
  operator_name?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '操作人类型：0-用户 1-管理员 2-系统',
  })
  operator_type?: number;

  @Column({
    type: DataType.TEXT,
    comment: '操作详情(JSON)',
  })
  detail?: string;

  @Column({
    type: DataType.TEXT,
    comment: '资金变动(JSON: {refundAmount, settleDeductAmount, pointsRollback})',
  })
  fund_change?: string;

  @Column({
    type: DataType.TEXT,
    comment: '库存变动(JSON: [{goodsId, goodsName, quantity, beforeStock, afterStock}])',
  })
  stock_change?: string;

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
