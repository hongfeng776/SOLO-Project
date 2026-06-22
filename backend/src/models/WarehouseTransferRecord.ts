import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum TransferStatus {
  PENDING = 0,
  IN_TRANSIT = 1,
  COMPLETED = 2,
  REJECTED = 3,
  CANCELLED = 4,
}

@Table({
  tableName: 'warehouse_transfer_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'uk_transfer_no', fields: ['transfer_no'], unique: true },
    { name: 'idx_goods_id', fields: ['goods_id'] },
    { name: 'idx_batch_no', fields: ['batch_no'] },
    { name: 'idx_from_location', fields: ['from_location'] },
    { name: 'idx_to_location', fields: ['to_location'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_operator_id', fields: ['operator_id'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class WarehouseTransferRecord extends Model<WarehouseTransferRecord> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, unique: true, comment: '调拨单号' })
  transfer_no!: string;

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

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, comment: '调拨数量' })
  quantity!: number;

  @Column({ type: DataType.STRING(50), allowNull: false, comment: '调出仓储位置' })
  from_location!: string;

  @Column({ type: DataType.STRING(50), comment: '调出库区' })
  from_zone?: string;

  @Column({ type: DataType.STRING(50), allowNull: false, comment: '调入仓储位置' })
  to_location!: string;

  @Column({ type: DataType.STRING(50), comment: '调入库区' })
  to_zone?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '状态：0-待审核 1-调拨中 2-已完成 3-已拒绝 4-已取消',
  })
  status!: number;

  @Column({ type: DataType.STRING(200), comment: '调拨原因' })
  reason?: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '调出仓是否已扣减' })
  is_from_deducted?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '调入仓是否已增加' })
  is_to_added?: boolean;

  @Column({ type: DataType.DATE, comment: '预计到达时间' })
  expected_arrival_time?: Date;

  @Column({ type: DataType.DATE, comment: '实际到达时间' })
  actual_arrival_time?: Date;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人员ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人员名称' })
  operator_name?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '审核人ID' })
  reviewed_by?: number;

  @Column({ type: DataType.STRING(50), comment: '审核人名称' })
  reviewed_by_name?: string;

  @Column({ type: DataType.DATE, comment: '审核时间' })
  reviewed_at?: Date;

  @Column({ type: DataType.STRING(500), comment: '备注' })
  remark?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
