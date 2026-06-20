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
import { User } from './User';
import { AbnormalTransaction } from './AbnormalTransaction';
import { MonitorRule } from './MonitorRule';

@Table({
  tableName: 'monitor_trace_log',
  comment: '异常交易监控溯源日志表'
})
export class MonitorTraceLog extends Model<MonitorTraceLog> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @ForeignKey(() => AbnormalTransaction)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '异常交易记录ID'
  })
  alert_id!: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '预警编号'
  })
  alert_no?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '溯源类型 1规则触发 2人工处理 3批量处理 4拦截操作 5解除操作 6误判标记 7违规解除'
  })
  trace_type!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '操作人ID'
  })
  operator_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作人姓名'
  })
  operator_name?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '操作详情(JSON)'
  })
  operation_detail?: string;

  @ForeignKey(() => MonitorRule)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '关联规则ID'
  })
  rule_id?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '关联规则名称'
  })
  rule_name?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '操作前状态'
  })
  before_status?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '操作后状态'
  })
  after_status?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否合规 0违规 1合规'
  })
  is_compliant!: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '违规类型'
  })
  violation_type?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => AbnormalTransaction, 'alert_id')
  alert?: AbnormalTransaction;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BelongsTo(() => MonitorRule, 'rule_id')
  rule?: MonitorRule;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: MonitorTraceLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
