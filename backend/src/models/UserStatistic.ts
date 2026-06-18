import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'user_statistics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class UserStatistic extends Model<UserStatistic> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    unique: true,
    comment: '统计日期',
  })
  stat_date!: Date;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '用户总数',
  })
  total_users?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '新增用户数',
  })
  new_users?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '活跃用户数',
  })
  active_users?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '冻结用户数',
  })
  frozen_users?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '注销用户数',
  })
  cancel_users?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '风控预警用户数',
  })
  risk_users?: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    defaultValue: 0.00,
    comment: '总消费金额',
  })
  total_amount?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0.00,
    comment: '平均消费金额',
  })
  avg_user_amount?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '普通用户数',
  })
  level1_users?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '银卡用户数',
  })
  level2_users?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '金卡用户数',
  })
  level3_users?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '钻石用户数',
  })
  level4_users?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '至尊用户数',
  })
  level5_users?: number;

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
