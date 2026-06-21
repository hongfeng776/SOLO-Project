import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum LogisticsProviderLevel {
  PLATINUM = 5,
  GOLD = 4,
  SILVER = 3,
  BRONZE = 2,
  ENTRY = 1,
}

export enum LogisticsProviderStatus {
  DISABLED = 0,
  ENABLED = 1,
  PENDING_REVIEW = 2,
  ARCHIVED = 3,
}

export enum CooperationStatus {
  NOT_COOPERATING = 0,
  COOPERATING = 1,
  COOPERATION_SUSPENDED = 2,
  COOPERATION_TERMINATED = 3,
}

@Table({
  tableName: 'logistics_providers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uk_provider_code',
      fields: ['provider_code'],
      unique: true,
    },
    {
      name: 'uk_credit_code',
      fields: ['credit_code'],
      unique: true,
    },
    {
      name: 'uk_business_license_no',
      fields: ['business_license_no'],
      unique: true,
    },
    {
      name: 'idx_provider_name',
      fields: ['provider_name'],
    },
    {
      name: 'idx_level',
      fields: ['level'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_cooperation_status',
      fields: ['cooperation_status'],
    },
    {
      name: 'idx_province',
      fields: ['service_province'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
    {
      name: 'idx_cooperation_effective_date',
      fields: ['cooperation_effective_date'],
    },
  ],
})
export class LogisticsProvider extends Model<LogisticsProvider> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    comment: '物流服务商编码（格式：WL+6位数字）',
  })
  provider_code!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '物流服务商名称',
  })
  provider_name!: string;

  @Column({
    type: DataType.STRING(200),
    comment: '物流服务商logo',
  })
  logo?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '服务商等级：1-入门级 2-青铜 3-白银 4-黄金 5-铂金',
  })
  level?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用 2-待审核 3-已归档',
  })
  status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '合作状态：0-未合作 1-合作中 2-合作暂停 3-合作终止',
  })
  cooperation_status?: number;

  @Column({
    type: DataType.DATE,
    comment: '合作生效日期',
  })
  cooperation_effective_date?: Date;

  @Column({
    type: DataType.DATE,
    comment: '合作终止日期',
  })
  cooperation_terminate_date?: Date;

  @Column({
    type: DataType.STRING(50),
    comment: '联系人',
  })
  contact_person?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '联系电话',
  })
  contact_phone?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '联系邮箱',
  })
  contact_email?: string;

  @Column({
    type: DataType.STRING(200),
    comment: '公司注册地址',
  })
  registered_address?: string;

  @Column({
    type: DataType.STRING(18),
    unique: true,
    comment: '统一社会信用代码',
  })
  credit_code?: string;

  @Column({
    type: DataType.STRING(15),
    unique: true,
    comment: '营业执照注册号',
  })
  business_license_no?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '企业法人姓名',
  })
  legal_person?: string;

  @Column({
    type: DataType.STRING(18),
    comment: '法人身份证号',
  })
  legal_id_card?: string;

  @Column({
    type: DataType.STRING(200),
    comment: '营业执照图片URL',
  })
  business_license_url?: string;

  @Column({
    type: DataType.DATE,
    comment: '营业执照有效期起',
  })
  license_valid_from?: Date;

  @Column({
    type: DataType.DATE,
    comment: '营业执照有效期止',
  })
  license_valid_to?: Date;

  @Column({
    type: DataType.STRING(200),
    comment: '道路运输经营许可证URL',
  })
  road_transport_license_url?: string;

  @Column({
    type: DataType.DATE,
    comment: '道路运输许可证有效期止',
  })
  road_transport_valid_to?: Date;

  @Column({
    type: DataType.STRING(50),
    comment: '服务覆盖省份（多个逗号分隔）',
  })
  service_province?: string;

  @Column({
    type: DataType.STRING(200),
    comment: '服务覆盖城市（多个逗号分隔）',
  })
  service_cities?: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '网点总数',
  })
  branch_count?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '跨省时效承诺（小时）',
  })
  cross_province_timeliness?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '省内时效承诺（小时）',
  })
  intra_province_timeliness?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '首重资费（元/kg）',
  })
  first_weight_fee?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '续重资费（元/kg）',
  })
  additional_weight_fee?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '基础服务费（元/单）',
  })
  base_service_fee?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 100,
    comment: '合作权限额度（日最大单量）',
  })
  daily_order_limit?: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: '是否支持COD货到付款',
  })
  support_cod?: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: '是否支持冷链运输',
  })
  support_cold_chain?: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: '是否支持大件运输',
  })
  support_oversized?: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    comment: '是否支持上门取件',
  })
  support_pickup?: boolean;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '匹配优先级（数字越大优先级越高）',
  })
  match_priority?: number;

  @Column({
    type: DataType.STRING(200),
    comment: '接口地址',
  })
  api_url?: string;

  @Column({
    type: DataType.STRING(100),
    comment: 'API密钥',
  })
  api_key?: string;

  @Column({
    type: DataType.STRING(100),
    comment: 'API密钥Secret',
  })
  api_secret?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '服务评分（0-5分）',
  })
  service_score?: number;

  @Column({
    type: DataType.DECIMAL(10, 4),
    comment: '准时率（0-1）',
  })
  on_time_rate?: number;

  @Column({
    type: DataType.DECIMAL(10, 4),
    comment: '破损率（0-1）',
  })
  damage_rate?: number;

  @Column({
    type: DataType.DECIMAL(10, 4),
    comment: '丢失率（0-1）',
  })
  loss_rate?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '合作累计单量',
  })
  total_orders?: number;

  @Column({
    type: DataType.DECIMAL(14, 2),
    defaultValue: 0,
    comment: '合作累计金额',
  })
  total_amount?: number;

  @Column({
    type: DataType.TEXT,
    comment: '资质详细介绍（超长内容）',
  })
  qualification_intro?: string;

  @Column({
    type: DataType.STRING(1000),
    comment: '备注',
  })
  remark?: string;

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

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '更新人ID',
  })
  updated_by?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '更新人名称',
  })
  updated_by_name?: string;

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
