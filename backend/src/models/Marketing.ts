import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Marketing extends Model<Marketing> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '活动名称',
  })
  name!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '活动类型：1-折扣 2-满减 3-优惠券',
  })
  type?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '状态：0-未开始 1-进行中 2-已结束',
  })
  status?: number;

  @Column({
    type: DataType.DATE,
    comment: '开始时间',
  })
  start_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '结束时间',
  })
  end_time?: Date;

  @Column({
    type: DataType.DECIMAL(5, 2),
    comment: '折扣率/减免金额',
  })
  discount?: number;

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
