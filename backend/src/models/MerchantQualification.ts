import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'merchant_qualifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class MerchantQualification extends Model<MerchantQualification> {
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
    comment: '类目ID',
  })
  category_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '资质类型',
  })
  qualification_type!: string;

  @Column({
    type: DataType.STRING(255),
    comment: '证件编号',
  })
  certificate_no?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '证件文件URL',
  })
  file_url?: string;

  @Column({
    type: DataType.DATE,
    comment: '过期日期',
  })
  expire_date?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 2,
    comment: '状态：0-过期 1-有效 2-待审核',
  })
  status?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
