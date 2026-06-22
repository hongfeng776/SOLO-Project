import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum OutboundStatus {
  PENDING = 0,
  CONFIRMED = 1,
  COMPLETED = 2,
  REJECTED = 3,
  CANCELLED = 4,
}

export enum OutboundType {
  ORDER = 1,
  TRANSFER = 2,
  SAMPLE = 3,
  DAMAGE = 4,
}

@Table({
  tableName: 'warehouse_outbound_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'uk_outbound_no', fields: ['outbound_no'], unique: true },
    { name: 'idx_goods_id', fields: ['goods_id'] },
    { name: 'idx_batch_no', fields: ['batch_no'] },
    { name: 'idx_warehouse_location', fields: ['warehouse_location'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_type', fields: ['type'] },
    { name: 'idx_order_id', fields: ['order_id'] },
    { name: 'idx_operator_id', fields: ['operator_id'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class WarehouseOutboundRecord extends Model<WarehouseOutboundRecord> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, unique: true, comment: '出库单号' })
  outbound_no!: string;

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

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '出库类型：1-订单出库 2-调拨出库 3-样品出库 4-损耗出库',
  })
  type!: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, comment: '出库数量' })
  quantity!: number;

  @Column({ type: DataType.STRING(50), allowNull: false, comment: '仓储位置' })
  warehouse_location!: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '关联订单ID' })
  order_id?: number;

  @Column({ type: DataType.STRING(32), comment: '关联订单号' })
  order_no?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '调拨目标仓位置' })
  transfer_target_location?: number;

  @Column({ type: DataType.STRING(50), comment: '调拨目标仓' })
  transfer_target_name?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '状态：0-待确认 1-已确认 2-已完成 3-已拒绝 4-已取消',
  })
  status!: number;

  @Column({ type: DataType.JSON, comment: '前置校验结果（JSON格式）' })
  validation_result?: any;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '是否超量出库拦截' })
  is_over_quantity_intercepted?: boolean;

  @Column({ type: DataType.STRING(200), comment: '拦截原因' })
  intercept_reason?: string;

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
