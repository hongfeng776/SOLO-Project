import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class MarketingUser extends Model<MarketingUser> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '营销活动ID',
  })
  marketing_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '状态：0-未使用 1-已使用 2-已过期',
  })
  status?: number;

  @Column({
    type: DataType.DATE,
    comment: '使用时间',
  })
  used_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '过期时间',
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
