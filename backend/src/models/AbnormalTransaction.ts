import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  Index,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Customer } from './Customer';
import { User } from './User';
import { Organization } from './Organization';
import { MonitorAlertBatch } from './MonitorAlertBatch';

@Table({
  tableName: 'abnormal_transaction',
  comment: '异常交易监控记录表'
})
export class AbnormalTransaction extends Model<AbnormalTransaction> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    comment: '预警编号'
  })
  alert_no!: string;

  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '交易ID'
  })
  transaction_id!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '交易编号'
  })
  transaction_no!: string;

  @Index
  @ForeignKey(() => Customer)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '客户ID'
  })
  customer_id!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '客户编号'
  })
  customer_no!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '客户名称'
  })
  customer_name?: string;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '账户ID'
  })
  account_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '账户编号'
  })
  account_no?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '触发规则详情(JSON)'
  })
  trigger_rules?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '预警类型 1高频交易 2异地交易 3大额异动 4夜间异常'
  })
  alert_type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '风险等级 1低风险 2中风险 3较高风险 4高风险'
  })
  risk_level!: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '风险标签(逗号分隔)'
  })
  risk_tags?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '处理状态 0待处理 1自动归档 2人工复核中 3已拦截 4已解除 5已确认异常'
  })
  status!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '交易金额'
  })
  transaction_amount!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '交易时间'
  })
  transaction_time?: Date;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '交易场景'
  })
  transaction_scene?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '设备信息(JSON)'
  })
  device_info?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '地域信息(JSON)'
  })
  location_info?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '频次信息(JSON)'
  })
  frequency_info?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '拦截状态 0未拦截 1已拦截 2已解除拦截'
  })
  intercept_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '预警通知状态 0未通知 1已通知'
  })
  alert_notify_status!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '预警通知时间'
  })
  alert_notify_time?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '处理人ID'
  })
  handler_id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '处理时间'
  })
  handle_time?: Date;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '处理结果'
  })
  handle_result?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '处理备注'
  })
  handle_remark?: string;

  @ForeignKey(() => MonitorAlertBatch)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '批量处理批次ID'
  })
  batch_id?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '机构ID'
  })
  org_id?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '历史预警次数'
  })
  previous_alerts_count!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否误判 0否 1是'
  })
  is_false_positive!: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '误判原因'
  })
  false_positive_reason?: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => User, 'handler_id')
  handler?: User;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => MonitorAlertBatch, 'batch_id')
  alertBatch?: MonitorAlertBatch;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: AbnormalTransaction) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
