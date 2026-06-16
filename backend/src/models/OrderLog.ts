import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'order_logs',
  timestamps: false,
})
export class OrderLog extends Model<OrderLog> {
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
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '操作人类型：0-用户 1-管理员 2-系统',
  })
  operator_type!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '操作类型：create/pay/cancel/ship/receive/complete/refund等',
  })
  action!: string;

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
    type: DataType.STRING(500),
    comment: '备注说明',
  })
  remark?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;
}
