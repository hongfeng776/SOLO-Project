import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum LinkNodeVerificationStatus {
  PENDING = 0,
  VERIFIED = 1,
  SUSPICIOUS = 2,
  FAKE = 3,
}

@Table({
  tableName: 'logistics_link_node_extensions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'idx_track_id', fields: ['track_id'] },
    { name: 'idx_shipment_id', fields: ['shipment_id'] },
    { name: 'idx_logistics_no', fields: ['logistics_no'] },
    { name: 'idx_node_hash', fields: ['node_hash'], unique: true },
    { name: 'idx_verification_status', fields: ['verification_status'] },
    { name: 'idx_operator_id', fields: ['operator_id'] },
    { name: 'idx_node_time', fields: ['node_time'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class LogisticsLinkNodeExtension extends Model<LogisticsLinkNodeExtension> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '关联轨迹ID' })
  track_id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '发货记录ID' })
  shipment_id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false, comment: '物流单号' })
  logistics_no!: string;

  @Column({ type: DataType.STRING(64), allowNull: false, unique: true, comment: '节点哈希值（用于重复检测）' })
  node_hash!: string;

  @Column({ type: DataType.DATE, allowNull: false, comment: '节点发生时间' })
  node_time!: Date;

  @Column({ type: DataType.STRING(50), comment: '节点所在省份' })
  province?: string;

  @Column({ type: DataType.STRING(50), comment: '节点所在城市' })
  city?: string;

  @Column({ type: DataType.STRING(50), comment: '节点所在区县' })
  district?: string;

  @Column({ type: DataType.STRING(200), comment: '节点详细地址' })
  address?: string;

  @Column({ type: DataType.DECIMAL(10, 6), comment: '纬度' })
  latitude?: number;

  @Column({ type: DataType.DECIMAL(10, 6), comment: '经度' })
  longitude?: number;

  @Column({ type: DataType.STRING(100), comment: '快递员/操作员姓名' })
  operator_name?: string;

  @Column({ type: DataType.STRING(20), comment: '操作员联系电话' })
  operator_phone?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作员ID（系统内）' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作员工号' })
  operator_employee_id?: string;

  @Column({ type: DataType.STRING(100), comment: '所属网点名称' })
  branch_name?: string;

  @Column({ type: DataType.STRING(32), comment: '所属网点编码' })
  branch_code?: string;

  @Column({ type: DataType.STRING(50), comment: '扫描设备编号' })
  device_id?: string;

  @Column({ type: DataType.STRING(50), comment: '扫描设备类型' })
  device_type?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '核验状态：0-待核验 1-已核验 2-存疑 3-虚假',
  })
  verification_status!: number;

  @Column({ type: DataType.STRING(200), comment: '核验说明' })
  verification_remark?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '核验人ID' })
  verified_by?: number;

  @Column({ type: DataType.STRING(50), comment: '核验人名称' })
  verified_by_name?: string;

  @Column({ type: DataType.DATE, comment: '核验时间' })
  verified_at?: Date;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '是否为补录节点' })
  is_backfilled?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '是否为异常节点' })
  is_abnormal?: boolean;

  @Column({ type: DataType.STRING(50), comment: '异常类型' })
  abnormal_type?: string;

  @Column({ type: DataType.STRING(200), comment: '异常描述' })
  abnormal_desc?: string;

  @Column({ type: DataType.JSON, comment: '扩展字段（JSON格式）' })
  extra?: any;

  @Column({ type: DataType.STRING(500), comment: '备注' })
  remark?: string;

  @Column({ type: DataType.STRING(50), comment: '数据来源：system/api/manual' })
  source?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
