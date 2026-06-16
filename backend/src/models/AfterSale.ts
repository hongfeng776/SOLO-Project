import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'after_sales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class AfterSale extends Model<AfterSale> {
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
    allowNull: false,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '售后类型：1-退款 2-退货退款 3-换货',
  })
  type?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '状态：0-待处理 1-处理中 2-已完成 3-已拒绝',
  })
  status?: number;

  @Column({
    type: DataType.TEXT,
    comment: '申请原因',
  })
  reason?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '退款金额',
  })
  amount?: number;

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
