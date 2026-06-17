import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'brands',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class Brand extends Model<Brand> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '品牌名称',
  })
  name!: string;

  @Column({
    type: DataType.STRING(500),
    comment: '品牌logo',
  })
  logo?: string;

  @Column({
    type: DataType.TEXT,
    comment: '品牌描述',
  })
  description?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
