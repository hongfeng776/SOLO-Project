import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum InboundStatus {
  PENDING = 0,
  CONFIRMED = 1,
  COMPLETED = 2,
  REJECTED = 3,
  CANCELLED = 4,
}

export enum InboundType {
  PURCHASE = 1,
  RETURN = 2,
  TRANSFER = 3,
  SUPPLEMENT = 4,
}

@Table({
  tableName: 'warehouse_inbound_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'uk_inbound_no', fields: ['inbound_no'], unique: true },
    { name: 'idx_goods_id', fields: ['goods_id'] },
    { name: 'idx_batch_no', fields: ['batch_no'] },
    { name: 'idx_warehouse_location', fields: ['warehouse_location'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_type', fields: ['type'] },
    { name: 'idx_operator_id', fields: ['operator_id'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class WarehouseInboundRecord extends Model<WarehouseInboundRecord> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, unique: true, comment: '入库单号' })
  inbound_no!: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商品ID' })
  goods_id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false, comment: '商品编码' })
  goods_code!: string;

  @Column({ type: DataType.STRING(255), allowNull: false, comment: '商品名称' })
  goods_name!: string;

  @Column({ type: DataType.STRING(50), comment: '商品规格' })
  goods_spec?: string;

  @Column({ type: DataType.STRING(32), allowNull: false, comment: '批次号' })
  batch_no!: string;

  @Column({ type: DataType.DATE, comment: '生产日期' })
  production_date?: Date;

  @Column({ type: DataType.DATE, comment: '有效期至' })
  expiry_date?: Date;

  @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, defaultValue: 1, comment: '入库类型：1-采购入库 2-退货入库 3-调拨入库 4-补货入库' })
  type!: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, comment: '入库数量' })
  quantity!: number;

  @Column({ type: DataType.DECIMAL(10, 2), comment: '单位成本' })
  unit_cost?: number;

  @Column({ type: DataType.DECIMAL(12, 2), comment: '总成本' })
  total_cost?: number;

  @Column({ type: DataType.STRING(50), allowNull: false, comment: '仓储位置' })
  warehouse_location!: string;

  @Column({ type: DataType.STRING(50), comment: '库区' })
  warehouse_zone?: string;

  @Column({ type: DataType.STRING(50), comment: '货架号' })
  shelf_no?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '状态：0-待确认 1-已确认 2-已完成 3-已拒绝 4-已取消',
  })
  status!: number;

  @Column({ type: DataType.JSON, comment: '前置校验结果（JSON格式）' })
  validation_result?: any;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '是否已同步库存台账' })
  is_synced?: boolean;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人员ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人员名称' })
  operator_name?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '确认人ID' })
  confirmed_by?: number;

  @Column({ type: DataType.STRING(50), comment: '确认人名称' })
  confirmed_by_name?: string;

  @Column({ type: DataType.DATE, comment: '确认时间' })
  confirmed_at?: Date;

  @Column({ type: DataType.STRING(500), comment: '备注' })
  remark?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
