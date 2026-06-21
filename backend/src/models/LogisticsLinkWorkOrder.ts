import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum WorkOrderType {
  ABNORMAL = 1,
  VERIFY = 2,
  INTERCEPT = 3,
  MANUAL_SYNC = 4,
  COMPLAINT = 5,
}

export enum WorkOrderPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
}

export enum WorkOrderStatus {
  PENDING = 0,
  PROCESSING = 1,
  PENDING_USER_CONFIRM = 2,
  RESOLVED = 3,
  CLOSED = 4,
  ESCALATED = 5,
}

@Table({
  tableName: 'logistics_link_work_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'uk_work_order_no', fields: ['work_order_no'], unique: true },
    { name: 'idx_shipment_id', fields: ['shipment_id'] },
    { name: 'idx_order_id', fields: ['order_id'] },
    { name: 'idx_type', fields: ['type'] },
    { name: 'idx_priority', fields: ['priority'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_assigned_to', fields: ['assigned_to'] },
    { name: 'idx_created_by', fields: ['created_by'] },
    { name: 'idx_created_at', fields: ['created_at'] },
    { name: 'idx_sla_expire_at', fields: ['sla_expire_at'] },
  ],
})
export class LogisticsLinkWorkOrder extends Model<LogisticsLinkWorkOrder> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, unique: true, comment: '工单编号' })
  work_order_no!: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '发货记录ID' })
  shipment_id!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, comment: '发货单号' })
  shipment_no!: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '订单ID' })
  order_id!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, comment: '订单号' })
  order_no!: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '关联异常记录ID' })
  abnormal_log_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '工单类型：1-异常处理 2-物流核查 3-订单拦截 4-手动同步 5-用户投诉',
  })
  type!: number;

  @Column({ type: DataType.STRING(200), allowNull: false, comment: '工单标题' })
  title!: string;

  @Column({ type: DataType.TEXT, comment: '工单详细描述' })
  description?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 2,
    comment: '优先级：1-低 2-中 3-高 4-紧急',
  })
  priority!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '状态：0-待处理 1-处理中 2-待用户确认 3-已解决 4-已关闭 5-已升级',
  })
  status!: number;

  @Column({ type: DataType.STRING(200), comment: '处理结果' })
  resolution?: string;

  @Column({ type: DataType.DATE, comment: 'SLA到期时间' })
  sla_expire_at?: Date;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '指派人ID' })
  assigned_to?: number;

  @Column({ type: DataType.STRING(50), comment: '指派人名称' })
  assigned_to_name?: string;

  @Column({ type: DataType.DATE, comment: '指派时间' })
  assigned_at?: Date;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '处理人ID' })
  handled_by?: number;

  @Column({ type: DataType.STRING(50), comment: '处理人名称' })
  handled_by_name?: string;

  @Column({ type: DataType.DATE, comment: '开始处理时间' })
  started_at?: Date;

  @Column({ type: DataType.DATE, comment: '解决时间' })
  resolved_at?: Date;

  @Column({ type: DataType.TEXT, comment: '处理过程记录（JSON格式）' })
  process_records?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '创建人ID' })
  created_by?: number;

  @Column({ type: DataType.STRING(50), comment: '创建人名称' })
  created_by_name?: string;

  @Column({ type: DataType.STRING(50), comment: '创建来源：system/admin/user/api' })
  source?: string;

  @Column({ type: DataType.STRING(500), comment: '备注' })
  remark?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
