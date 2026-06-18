import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'merchants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Merchant extends Model<Merchant> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '商家名称',
  })
  name!: string;

  @Column({
    type: DataType.STRING(50),
    comment: '联系人',
  })
  contact?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '联系电话',
  })
  phone?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '地址',
  })
  address?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 100,
    comment: '商家信用分',
  })
  credit_score?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '待结算金额',
  })
  pending_settle_amount?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '累计已结算金额',
  })
  total_settle_amount?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '累计商品销量',
  })
  total_sales_count?: number;

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
