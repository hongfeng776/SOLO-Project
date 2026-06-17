import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'payment_flows',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uk_flow_no',
      fields: ['flow_no'],
      unique: true,
    },
    {
      name: 'idx_order_id',
      fields: ['order_id'],
    },
    {
      name: 'idx_order_no',
      fields: ['order_no'],
    },
    {
      name: 'idx_user_id',
      fields: ['user_id'],
    },
    {
      name: 'idx_pay_status',
      fields: ['pay_status'],
    },
    {
      name: 'idx_transaction_id',
      fields: ['transaction_id'],
    },
    {
      name: 'idx_pay_time',
      fields: ['pay_time'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class PaymentFlow extends Model<PaymentFlow> {
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
    comment: '流水号',
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
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '金额',
  })
  amount!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '支付方式：1-微信支付 2-支付宝 3-银行卡',
  })
  pay_type!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '支付状态：0-待支付 1-支付成功 2-支付失败 3-已退款',
  })
  pay_status?: number;

  @Column({
    type: DataType.STRING(64),
    comment: '第三方交易号',
  })
  transaction_id?: string;

  @Column({
    type: DataType.DATE,
    comment: '支付时间',
  })
  pay_time?: Date;

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
