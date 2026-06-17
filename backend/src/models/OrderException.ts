import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'order_exceptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_order_id',
      fields: ['order_id'],
    },
    {
      name: 'uk_order_no',
      fields: ['order_no'],
    },
    {
      name: 'idx_type',
      fields: ['type'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_handler',
      fields: ['handler_id'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
    {
      name: 'idx_handle_time',
      fields: ['handle_time'],
    },
  ],
})
export class OrderException extends Model<OrderException> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

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
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '异常类型：1-支付状态异常 2-库存不足 3-商家无权限 4-物流不支持 5-重复订单 6-金额异常 7-其他',
  })
  type!: number;

  @Column({
    type: DataType.TEXT,
    comment: '异常原因',
  })
  reason?: string;

  @Column({
    type: DataType.JSON,
    comment: '异常字段列表',
  })
  fields?: object;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '处理状态：0-待处理 1-处理中 2-已处理 3-已忽略',
  })
  status?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '处理人ID',
  })
  handler_id?: number;

  @Column({
    type: DataType.DATE,
    comment: '处理时间',
  })
  handle_time?: Date;

  @Column({
    type: DataType.TEXT,
    comment: '处理备注',
  })
  handle_remark?: string;

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
