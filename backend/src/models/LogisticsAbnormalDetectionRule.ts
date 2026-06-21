import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum AbnormalDetectionType {
  STAGNANT = 'stagnant',
  MISROUTE = 'misroute',
  TIMEOUT = 'timeout',
  DELAYED_DELIVERY = 'delayed_delivery',
  REPEAT_TRACK = 'repeat_track',
  FAKE_TRACK = 'fake_track',
  NODE_MISSING = 'node_missing',
}

export enum AbnormalDetectionStatus {
  DISABLED = 0,
  ENABLED = 1,
}

export enum DetectionScene {
  IN_TRANSIT = 'in_transit',
  DELIVERING = 'delivering',
  SIGNED = 'signed',
  ALL = 'all',
}

@Table({
  tableName: 'logistics_abnormal_detection_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'uk_rule_code', fields: ['rule_code'], unique: true },
    { name: 'idx_detection_type', fields: ['detection_type'] },
    { name: 'idx_scene', fields: ['scene'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_priority', fields: ['priority'] },
  ],
})
export class LogisticsAbnormalDetectionRule extends Model<LogisticsAbnormalDetectionRule> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, unique: true, comment: '规则编码' })
  rule_code!: string;

  @Column({ type: DataType.STRING(100), allowNull: false, comment: '规则名称' })
  rule_name!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '检测类型：stagnant-物流停滞 misroute-错发 timeout-超时 delayed_delivery-派送延迟 repeat_track-重复节点 fake_track-虚假轨迹 node_missing-节点缺失',
  })
  detection_type!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'all',
    comment: '检测场景：in_transit-运输中 delivering-派送中 signed-已签收 all-全部',
  })
  scene!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status!: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 50,
    comment: '优先级，数值越大越先执行',
  })
  priority!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '触发告警等级：1-轻微 2-一般 3-严重',
  })
  alert_level!: number;

  @Column({
    type: DataType.JSON,
    comment: '检测参数配置（JSON格式）',
  })
  detection_params?: any;

  @Column({ type: DataType.STRING(500), comment: '检测规则描述' })
  description?: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '是否自动创建工单' })
  auto_create_work_order?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '是否自动通知用户' })
  auto_notify_user?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, comment: '是否自动同步订单状态' })
  auto_sync_order_status?: boolean;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 60, comment: 'SLA响应时限（分钟）' })
  sla_response_minutes?: number;

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
