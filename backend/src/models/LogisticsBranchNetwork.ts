import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum LogisticsBranchStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  TEMP_CLOSED = 2,
  PERMANENT_CLOSED = 3,
}

@Table({
  tableName: 'logistics_branch_networks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_provider_id',
      fields: ['provider_id'],
    },
    {
      name: 'idx_province',
      fields: ['province'],
    },
    {
      name: 'idx_city',
      fields: ['city'],
    },
    {
      name: 'idx_district',
      fields: ['district'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'uk_branch_code',
      fields: ['branch_code'],
      unique: true,
    },
  ],
})
export class LogisticsBranchNetwork extends Model<LogisticsBranchNetwork> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(32),
    unique: true,
    comment: '网点编码',
  })
  branch_code!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '物流服务商ID',
  })
  provider_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '网点名称',
  })
  branch_name!: string;

  @Column({
    type: DataType.STRING(50),
    comment: '网点类型：直营网点、加盟网点、转运中心、分拣中心、自提点',
  })
  branch_type?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '省份',
  })
  province?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '城市',
  })
  city?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '区县',
  })
  district?: string;

  @Column({
    type: DataType.STRING(200),
    comment: '详细地址',
  })
  address?: string;

  @Column({
    type: DataType.DECIMAL(10, 6),
    comment: '纬度',
  })
  latitude?: number;

  @Column({
    type: DataType.DECIMAL(10, 6),
    comment: '经度',
  })
  longitude?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '网点负责人',
  })
  manager_name?: string;

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
    type: DataType.STRING(20),
    comment: '营业时间',
  })
  business_hours?: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '日处理单量上限',
  })
  daily_capacity?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '覆盖半径（公里）',
  })
  coverage_radius?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-未启用 1-正常营业 2-临时关闭 3-永久关闭',
  })
  status?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '服务优先级（同一区域内）',
  })
  service_priority?: number;

  @Column({
    type: DataType.TEXT,
    comment: '服务范围说明',
  })
  service_scope?: string;

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
