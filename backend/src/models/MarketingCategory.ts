import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_categories',
  timestamps: false,
})
export class MarketingCategory extends Model<MarketingCategory> {
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
    comment: '分类ID',
  })
  category_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '分类名称',
  })
  category_name!: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;
}
