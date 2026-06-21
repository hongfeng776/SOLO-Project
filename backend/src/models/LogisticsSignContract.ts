import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum SignContractType {
  INITIAL = 'initial',
  RENEWAL = 'renewal',
  SUPPLEMENTARY = 'supplementary',
  CHANGE = 'change',
  TERMINATION = 'termination',
}

export enum ContractStatus {
  DRAFT = 0,
  PENDING_SIGNATURE = 1,
  EFFECTIVE = 2,
  EXPIRED = 3,
  TERMINATED = 4,
}

@Table({
  tableName: 'logistics_sign_contracts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_provider_id',
      fields: ['provider_id'],
    },
    {
      name: 'idx_contract_no',
      fields: ['contract_no'],
      unique: true,
    },
    {
      name: 'idx_contract_type',
      fields: ['contract_type'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_effective_date',
      fields: ['effective_date'],
    },
  ],
})
export class LogisticsSignContract extends Model<LogisticsSignContract> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    unique: true,
    comment: '签约单号',
  })
  contract_no!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '物流服务商ID',
  })
  provider_id!: number;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    comment: '合同名称',
  })
  contract_name!: string;

  @Column({
    type: DataType.STRING(50),
    defaultValue: 'initial',
    comment: '签约类型：initial-初次签约 renewal-续签 supplementary-补充协议 change-合同变更 termination-终止协议',
  })
  contract_type?: string;

  @Column({
    type: DataType.STRING(200),
    comment: '合同文件URL',
  })
  contract_file_url?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '甲方签约代表（平台）',
  })
  party_a_signatory?: string;

  @Column({
    type: DataType.DATE,
    comment: '甲方签约日期',
  })
  party_a_sign_date?: Date;

  @Column({
    type: DataType.STRING(100),
    comment: '乙方签约代表（物流商）',
  })
  party_b_signatory?: string;

  @Column({
    type: DataType.DATE,
    comment: '乙方签约日期',
  })
  party_b_sign_date?: Date;

  @Column({
    type: DataType.DATE,
    comment: '合同生效日期',
  })
  effective_date?: Date;

  @Column({
    type: DataType.DATE,
    comment: '合同到期日期',
  })
  expiry_date?: Date;

  @Column({
    type: DataType.DECIMAL(14, 2),
    comment: '合同金额（元）',
  })
  contract_amount?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    comment: '服务SLA等级：1-基础 2-标准 3-优质 4-尊享',
  })
  sla_level?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '赔付上限（元/单）',
  })
  compensation_limit?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '签约状态：0-草稿 1-待签约 2-已生效 3-已过期 4-已终止',
  })
  status?: number;

  @Column({
    type: DataType.TEXT,
    comment: '合同条款摘要',
  })
  contract_summary?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '终止原因',
  })
  termination_reason?: string;

  @Column({
    type: DataType.DATE,
    comment: '实际终止日期',
  })
  actual_termination_date?: Date;

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
    comment: '审核人ID',
  })
  approved_by?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '审核人名称',
  })
  approved_by_name?: string;

  @Column({
    type: DataType.DATE,
    comment: '审核通过时间',
  })
  approved_at?: Date;

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
