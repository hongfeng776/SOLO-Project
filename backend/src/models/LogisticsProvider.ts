import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

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
      name: 'idx_provider_name',
      fields: ['provider_name'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
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
    comment: '物流服务商编码',
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
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @Column({
    type: DataType.STRING(1000),
    comment: '备注',
  })
  remark?: string;

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
