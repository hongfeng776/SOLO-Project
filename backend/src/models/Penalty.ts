import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'penalties',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Penalty extends Model<Penalty> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商家ID',
  })
  merchant_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '处罚类型：1-警告 2-降权 3-罚款 4-封店',
  })
  type!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '处罚金额',
  })
  amount?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: '违规原因',
  })
  reason!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-已解除 1-生效中',
  })
  status?: number;

  @Column({
    type: DataType.DATE,
    comment: '到期时间',
  })
  expire_time?: Date;

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
