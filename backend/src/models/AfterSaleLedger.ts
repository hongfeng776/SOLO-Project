import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'after_sale_ledgers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uk_ledger_no',
      fields: ['ledger_no'],
      unique: true,
    },
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
      name: 'idx_user_id',
      fields: ['user_id'],
    },
    {
      name: 'idx_merchant_id',
      fields: ['merchant_id'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class AfterSaleLedger extends Model<AfterSaleLedger> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    comment: '台账编号',
  })
  ledger_no!: string;

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
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商家ID',
  })
  merchant_id!: number;

  @Column({
    type: DataType.STRING(100),
    comment: '商家名称',
  })
  merchant_name?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '售后类型',
  })
  after_sale_type!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '取消场景：0-非取消 1-主动取消 2-超时取消 3-违规取消',
  })
  cancel_scene?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '退款金额',
  })
  refund_amount?: number;

  @Column({
    type: DataType.TEXT,
    comment: '库存回退明细(JSON)',
  })
  stock_rollback_items?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '库存回退状态',
  })
  stock_rollback_status?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '商家结算扣减金额',
  })
  settle_deduct_amount?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '用户积分回退',
  })
  points_rollback?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '订单终态',
  })
  order_final_status?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '处理结果',
  })
  process_result?: string;

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
