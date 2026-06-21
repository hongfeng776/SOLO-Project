import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum FeeType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  ECONOMY = 'economy',
  COLD_CHAIN = 'cold_chain',
  OVERSIZED = 'oversized',
  COD = 'cod',
  INSURANCE = 'insurance',
  RETURN = 'return',
}

export enum WeightUnit {
  KG = 'kg',
  G = 'g',
}

@Table({
  tableName: 'logistics_fee_standards',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_provider_id',
      fields: ['provider_id'],
    },
    {
      name: 'idx_fee_type',
      fields: ['fee_type'],
    },
    {
      name: 'idx_from_province',
      fields: ['from_province'],
    },
    {
      name: 'idx_to_province',
      fields: ['to_province'],
    },
    {
      name: 'idx_effective_date',
      fields: ['effective_date'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
  ],
})
export class LogisticsFeeStandard extends Model<LogisticsFeeStandard> {
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
    comment: '资费类型：standard-standard快递 express-特快 economy-经济 cold_chain-冷链 oversized-大件 cod-代收款 insurance-保价 return-退件',
  })
  fee_type!: string;

  @Column({
    type: DataType.STRING(100),
    comment: '资费方案名称',
  })
  fee_name?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '起始省份',
  })
  from_province?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '起始城市（为空表示全省）',
  })
  from_city?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '目标省份',
  })
  to_province?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '目标城市（为空表示全省）',
  })
  to_city?: string;

  @Column({
    type: DataType.STRING(10),
    defaultValue: 'kg',
    comment: '计费重量单位：kg-千克 g-克',
  })
  weight_unit?: string;

  @Column({
    type: DataType.DECIMAL(10, 3),
    defaultValue: 1,
    comment: '首重重量',
  })
  first_weight?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '首重费用（元）',
  })
  first_weight_fee?: number;

  @Column({
    type: DataType.DECIMAL(10, 3),
    defaultValue: 1,
    comment: '续重重量步长',
  })
  additional_weight_step?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '续重费用（元/步长）',
  })
  additional_weight_fee?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '基础服务费（元/单）',
  })
  base_service_fee?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '最低收费（元）',
  })
  min_fee?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '最高收费（元），为空表示不封顶',
  })
  max_fee?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '体积重系数（长*宽*高/系数）',
  })
  volume_weight_ratio?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '标准时效（小时）',
  })
  standard_timeliness?: number;

  @Column({
    type: DataType.DATE,
    comment: '生效日期',
  })
  effective_date?: Date;

  @Column({
    type: DataType.DATE,
    comment: '失效日期（为空表示长期有效）',
  })
  expiry_date?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: '是否为默认资费方案',
  })
  is_default?: boolean;

  @Column({
    type: DataType.TEXT,
    comment: '资费规则说明',
  })
  rule_description?: string;

  @Column({
    type: DataType.STRING(500),
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
