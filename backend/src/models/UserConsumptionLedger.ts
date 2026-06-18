import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'user_consumption_ledgers',
  timestamps: false,
})
export class UserConsumptionLedger extends Model<UserConsumptionLedger> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '订单ID',
  })
  order_id?: number;

  @Column({
    type: DataType.STRING(32),
    comment: '订单号',
  })
  order_no?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '类型：1-消费 2-退款 3-充值 4-提现',
  })
  type!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
    comment: '金额',
  })
  amount!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0.00,
    comment: '变动前余额',
  })
  balance_before?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0.00,
    comment: '变动后余额',
  })
  balance_after?: number;

  @Column({
    type: DataType.STRING(255),
    comment: '备注',
  })
  remark?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
