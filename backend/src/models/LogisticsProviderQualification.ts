import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum LogisticsQualificationType {
  BUSINESS_LICENSE = 'business_license',
  ROAD_TRANSPORT = 'road_transport',
  CUSTOMS_DECLARATION = 'customs_declaration',
  AIR_TRANSPORT = 'air_transport',
  RAIL_TRANSPORT = 'rail_transport',
  SEA_TRANSPORT = 'sea_transport',
  COLD_CHAIN = 'cold_chain',
  DANGEROUS_GOODS = 'dangerous_goods',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

export enum LogisticsQualificationStatus {
  PENDING = 0,
  VALID = 1,
  EXPIRED = 2,
  INVALID = 3,
  UNDER_REVIEW = 4,
}

@Table({
  tableName: 'logistics_provider_qualifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_provider_id',
      fields: ['provider_id'],
    },
    {
      name: 'idx_qualification_type',
      fields: ['qualification_type'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_expire_date',
      fields: ['expire_date'],
    },
    {
      name: 'uk_certificate_no',
      fields: ['certificate_no'],
      unique: true,
    },
  ],
})
export class LogisticsProviderQualification extends Model<LogisticsProviderQualification> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '物流服务商ID',
  })
  provider_id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '资质类型',
  })
  qualification_type!: string;

  @Column({
    type: DataType.STRING(100),
    comment: '资质类型名称',
  })
  qualification_name?: string;

  @Column({
    type: DataType.STRING(50),
    unique: true,
    comment: '资质证件编号',
  })
  certificate_no?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '证件持有人名称',
  })
  certificate_holder?: string;

  @Column({
    type: DataType.STRING(200),
    comment: '资质证件图片URL',
  })
  certificate_file_url?: string;

  @Column({
    type: DataType.DATE,
    comment: '资质生效日期',
  })
  valid_from?: Date;

  @Column({
    type: DataType.DATE,
    comment: '资质过期日期',
  })
  expire_date?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '资质状态：0-待审核 1-有效 2-已过期 3-无效 4-审核中',
  })
  status?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '审核意见',
  })
  audit_remark?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '审核人ID',
  })
  audited_by?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '审核人名称',
  })
  audited_by_name?: string;

  @Column({
    type: DataType.DATE,
    comment: '审核时间',
  })
  audited_at?: Date;

  @Column({
    type: DataType.TEXT,
    comment: '资质详细说明',
  })
  description?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '创建人ID',
  })
  created_by?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '创建人名称',
  })
  created_by_name?: string;

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
