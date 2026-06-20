import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_discount_thresholds',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class MarketingDiscountThreshold extends Model<MarketingDiscountThreshold> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '活动类型',
  })
  type!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '适用类目ID，NULL表示所有类目',
  })
  category_id?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    comment: '最大折扣率(%)',
  })
  max_discount_rate?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '最大减免金额',
  })
  max_discount_amount?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    comment: '最小折扣率(%)',
  })
  min_discount_rate?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  updated_at!: Date;
}
