import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'brand_authorizations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class BrandAuthorization extends Model<BrandAuthorization> {
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
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '品牌ID',
  })
  brand_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '类目ID',
  })
  category_id!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '授权开始日期',
  })
  start_date!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '授权结束日期',
  })
  end_date!: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 2,
    comment: '状态：0-失效 1-有效 2-待审核',
  })
  status?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
