import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum QualificationVerificationStatus {
  NOT_VERIFIED = 0,
  VERIFIED_PASS = 1,
  VERIFIED_FAIL = 2,
  VERIFIED_ABNORMAL = 3,
}

export const QUALIFICATION_VERIFICATION_STATUS_MAP: Record<number, string> = {
  [QualificationVerificationStatus.NOT_VERIFIED]: '未核验',
  [QualificationVerificationStatus.VERIFIED_PASS]: '核验通过',
  [QualificationVerificationStatus.VERIFIED_FAIL]: '核验不通过',
  [QualificationVerificationStatus.VERIFIED_ABNORMAL]: '核验异常',
};

export enum QualificationVerificationSource {
  SYSTEM = 'system',
  MANUAL = 'manual',
  INDUSTRY = 'industry',
}

export const QUALIFICATION_VERIFICATION_SOURCE_MAP: Record<string, string> = {
  [QualificationVerificationSource.SYSTEM]: '系统正则',
  [QualificationVerificationSource.MANUAL]: '人工核验',
  [QualificationVerificationSource.INDUSTRY]: '工商数据',
};

export enum QualificationStatus {
  EXPIRED = 0,
  VALID = 1,
  PENDING = 2,
}

export const QUALIFICATION_STATUS_MAP: Record<number, string> = {
  [QualificationStatus.EXPIRED]: '已过期',
  [QualificationStatus.VALID]: '有效',
  [QualificationStatus.PENDING]: '待审核',
};

export enum QualificationType {
  BUSINESS_LICENSE = 'business_license',
  LEGAL_ID_CARD = 'legal_id_card',
  INDUSTRY_QUALIFICATION = 'industry_qualification',
  BRAND_AUTHORIZATION = 'brand_authorization',
  FOOD_BUSINESS_LICENSE = 'food_business_license',
  FOOD_OPERATION_LICENSE = 'food_operation_license',
  OTHER = 'other',
}

export const QUALIFICATION_TYPE_MAP: Record<string, string> = {
  [QualificationType.BUSINESS_LICENSE]: '营业执照',
  [QualificationType.LEGAL_ID_CARD]: '法人身份证',
  [QualificationType.INDUSTRY_QUALIFICATION]: '行业资质证书',
  [QualificationType.BRAND_AUTHORIZATION]: '品牌授权书',
  [QualificationType.FOOD_BUSINESS_LICENSE]: '食品经营许可证',
  [QualificationType.FOOD_OPERATION_LICENSE]: '食品生产许可证',
  [QualificationType.OTHER]: '其他资质',
};

@Table({
  tableName: 'merchant_qualifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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
    defaultValue: 0,
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
    type: DataType.STRING(255),
    comment: '证件持有人',
  })
  certificate_holder?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '证件文件URL',
  })
  file_url?: string;

  @Column({
    type: DataType.DATEONLY,
    comment: '过期日期',
  })
  expire_date?: Date;

  @Column({
    type: DataType.DATEONLY,
    comment: '有效期起始',
  })
  valid_from?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 2,
    comment: '状态：0-过期 1-有效 2-待审核',
  })
  status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '核验状态：0-未核验 1-核验通过 2-核验不通过 3-核验异常',
  })
  verification_status?: number;

  @Column({
    type: DataType.STRING(50),
    defaultValue: 'system',
    comment: '核验来源：system-系统正则 manual-人工 industry-工商数据',
  })
  verification_source?: string;

  @Column({
    type: DataType.STRING(1000),
    comment: '核验备注',
  })
  verification_remark?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '缺失标记：0-否 1-是',
  })
  missing_flag?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '违规标记：0-否 1-是',
  })
  violation_flag?: number;

  @Column({
    type: DataType.STRING(1000),
    comment: '审核意见',
  })
  audit_opinion?: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '材料排序',
  })
  material_order?: number;

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
