import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum LinkMatchStatus {
  PENDING = 0,
  MATCHED = 1,
  NO_PROVIDER = 2,
  ADDRESS_REMOTE = 3,
  PRODUCT_FORBIDDEN = 4,
  TIMEOUT_UNMET = 5,
}

export enum MatchStepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Table({
  tableName: 'logistics_link_match_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'uk_match_no', fields: ['match_no'], unique: true },
    { name: 'idx_order_id', fields: ['order_id'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_created_by', fields: ['created_by'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class LogisticsLinkMatchRecord extends Model<LogisticsLinkMatchRecord> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, unique: true, comment: '匹配单号' })
  match_no!: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '订单ID' })
  order_id!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, comment: '订单号' })
  order_no!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '匹配状态：0-待匹配 1-匹配成功 2-无可用服务商 3-地址偏远 4-商品禁运 5-时效不满足',
  })
  status!: number;

  @Column({ type: DataType.STRING(500), comment: '拦截原因' })
  block_reason?: string;

  @Column({ type: DataType.TEXT, comment: '匹配步骤详情（JSON格式，含加载进度）' })
  match_steps?: string;

  @Column({ type: DataType.JSON, comment: '收货地址信息快照' })
  address_info?: any;

  @Column({ type: DataType.JSON, comment: '商品信息快照' })
  product_info?: any;

  @Column({ type: DataType.JSON, comment: '时效要求信息' })
  timeliness_requirement?: any;

  @Column({ type: DataType.JSON, comment: '匹配成功的服务商列表' })
  matched_providers?: any;

  @Column({ type: DataType.JSON, comment: '备选方案（当匹配失败时的建议）' })
  alternative_solutions?: any;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '最终选择的服务商ID' })
  selected_provider_id?: number;

  @Column({ type: DataType.STRING(100), comment: '最终选择的服务商名称' })
  selected_provider_name?: string;

  @Column({ type: DataType.INTEGER, comment: '匹配耗时（毫秒）' })
  cost_time_ms?: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '创建人ID' })
  created_by?: number;

  @Column({ type: DataType.STRING(50), comment: '创建人名称' })
  created_by_name?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
