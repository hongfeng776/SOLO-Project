import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum InventoryCountStatus {
  PENDING = 0,
  COUNTING = 1,
  COMPLETED = 2,
  CONFIRMED = 3,
  CANCELLED = 4,
}

export enum InventoryType {
  NORMAL = 1,
  LOSS = 2,
  ABNORMAL = 3,
}

@Table({
  tableName: 'warehouse_inventory_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'uk_inventory_no', fields: ['inventory_no'], unique: true },
    { name: 'idx_goods_id', fields: ['goods_id'] },
    { name: 'idx_batch_no', fields: ['batch_no'] },
    { name: 'idx_warehouse_location', fields: ['warehouse_location'] },
    { name: 'idx_inventory_type', fields: ['inventory_type'] },
    { name: 'idx_count_status', fields: ['count_status'] },
    { name: 'idx_operator_id', fields: ['operator_id'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class WarehouseInventoryRecord extends Model<WarehouseInventoryRecord> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, unique: true, comment: '库存编号' })
  inventory_no!: string;

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

  @Column({ type: DataType.STRING(50), allowNull: false, comment: '仓储位置' })
  warehouse_location!: string;

  @Column({ type: DataType.STRING(50), comment: '库区' })
  warehouse_zone?: string;

  @Column({ type: DataType.STRING(50), comment: '货架号' })
  shelf_no?: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '系统库存数量' })
  system_quantity!: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: '实际盘点数量' })
  actual_quantity!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0, comment: '差异数量（实际-系统）' })
  diff_quantity?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '库存类型：1-正常库存 2-损耗库存 3-异常库存',
  })
  inventory_type!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '盘点状态：0-待盘点 1-盘点中 2-已完成 3-已确认 4-已取消',
  })
  count_status!: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '是否已同步前台库存' })
  is_synced_front?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '是否已同步商家台账' })
  is_synced_merchant?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '是否已同步物流备货' })
  is_synced_logistics?: boolean;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '正常库存数量' })
  normal_quantity?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '损耗库存数量' })
  loss_quantity?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '异常库存数量' })
  abnormal_quantity?: number;

  @Column({ type: DataType.STRING(200), comment: '损耗原因' })
  loss_reason?: string;

  @Column({ type: DataType.STRING(200), comment: '异常原因' })
  abnormal_reason?: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '低库存预警阈值' })
  low_stock_threshold?: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '是否触发低库存预警' })
  is_low_stock_alert?: boolean;

  @Column({ type: DataType.DECIMAL(10, 2), comment: '库存单价' })
  unit_price?: number;

  @Column({ type: DataType.DECIMAL(14, 2), comment: '库存金额' })
  total_amount?: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '最后盘点人ID' })
  last_count_operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '最后盘点人名称' })
  last_count_operator_name?: string;

  @Column({ type: DataType.DATE, comment: '最后盘点时间' })
  last_count_time?: Date;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '最后修正人ID' })
  last_correct_operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '最后修正人名称' })
  last_correct_operator_name?: string;

  @Column({ type: DataType.DATE, comment: '最后修正时间' })
  last_correct_time?: Date;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人员ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人员名称' })
  operator_name?: string;

  @Column({ type: DataType.STRING(500), comment: '备注' })
  remark?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
