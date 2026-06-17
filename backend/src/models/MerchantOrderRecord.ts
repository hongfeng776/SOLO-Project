import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'merchant_order_records',
  timestamps: false,
  indexes: [
    {
      name: 'idx_order_id',
      fields: ['order_id'],
    },
    {
      name: 'idx_merchant_id',
      fields: ['merchant_id'],
    },
    {
      name: 'idx_operator_id',
      fields: ['operator_id'],
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
export class MerchantOrderRecord extends Model<MerchantOrderRecord> {
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
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商家ID',
  })
  merchant_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '商家名称',
  })
  merchant_name!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '操作人ID',
  })
  operator_id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '操作人姓名',
  })
  operator_name!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '操作类型：1-接单 2-拒单 3-发货 4-取消',
  })
  action!: number;

  @Column({
    type: DataType.STRING(500),
    comment: '操作原因',
  })
  reason?: string;

  @Column({
    type: DataType.DATE,
    comment: '接单时间',
  })
  accept_time?: Date;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;
}
