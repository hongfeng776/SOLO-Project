import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'fund_settlements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uk_settle_no',
      fields: ['settle_no'],
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
      name: 'idx_merchant_id',
      fields: ['merchant_id'],
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
      name: 'idx_settle_time',
      fields: ['settle_time'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class FundSettlement extends Model<FundSettlement> {
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
    comment: '结算单号',
  })
  settle_no!: string;

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
    comment: '商家ID',
  })
  merchant_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '商家名称',
  })
  merchant_name!: string;

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
    comment: '平台手续费',
  })
  platform_fee?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '结算金额',
  })
  settle_amount!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '结算状态：0-待结算 1-已结算 2-结算异常',
  })
  status?: number;

  @Column({
    type: DataType.DATE,
    comment: '结算时间',
  })
  settle_time?: Date;

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
    type: DataType.STRING(1000),
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
