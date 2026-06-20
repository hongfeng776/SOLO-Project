import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_merchant_qualifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class MarketingMerchantQualification extends Model<MarketingMerchantQualification> {
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
    comment: '商家ID',
  })
  merchant_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '商家名称',
  })
  merchant_name!: string;

  @Column({
    type: DataType.STRING(100),
    comment: '资质类型',
  })
  qualification_type?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '资质状态：0-不合格 1-合格',
  })
  qualification_status?: number;

  @Column({
    type: DataType.DATE,
    comment: '申请时间',
  })
  apply_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '审核时间',
  })
  audit_time?: Date;

  @Column({
    type: DataType.STRING(500),
    comment: '审核备注',
  })
  audit_remark?: string;

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
