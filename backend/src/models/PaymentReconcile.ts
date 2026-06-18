import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'payment_reconciles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uk_reconcile_no',
      fields: ['reconcile_no'],
      unique: true,
    },
    {
      name: 'idx_flow_id',
      fields: ['flow_id'],
    },
    {
      name: 'idx_flow_no',
      fields: ['flow_no'],
    },
    {
      name: 'idx_order_id',
      fields: ['order_id'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_reconcile_time',
      fields: ['reconcile_time'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class PaymentReconcile extends Model<PaymentReconcile> {
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
    comment: '对账单号',
  })
  reconcile_no!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '支付流水ID',
  })
  flow_id!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '支付流水号',
  })
  flow_no!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '订单ID',
  })
  order_id!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '订单号',
  })
  order_no!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '订单金额',
  })
  order_amount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '支付金额',
  })
  pay_amount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '差异金额',
  })
  diff_amount?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '对账状态：0-待对账 1-对账中 2-对账通过 3-对账异常',
  })
  status?: number;

  @Column({
    type: DataType.DATE,
    comment: '对账时间',
  })
  reconcile_time?: Date;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '对账人ID',
  })
  reconcile_by?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '对账人姓名',
  })
  reconcile_name?: string;

  @Column({
    type: DataType.STRING(1000),
    comment: '对账备注',
  })
  remark?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '异常说明',
  })
  exception_remark?: string;

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
