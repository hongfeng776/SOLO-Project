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
  BelongsTo,
  HasMany
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User';
import { Organization } from './Organization';
import { AbnormalTransaction } from './AbnormalTransaction';

@Table({
  tableName: 'monitor_alert_batch',
  comment: '异常交易批量处理批次表'
})
export class MonitorAlertBatch extends Model<MonitorAlertBatch> {
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
    comment: '批次编号'
  })
  batch_no!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '批次名称'
  })
  batch_name!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '批次类型 1低风险批量确认 2高风险批量锁定 3自定义'
  })
  batch_type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '状态 0待执行 1执行中 2已完成 3部分失败 4执行失败'
  })
  status!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总记录数'
  })
  total_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '成功数'
  })
  success_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '失败数'
  })
  fail_count!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '筛选条件(JSON)'
  })
  filter_condition?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '风险等级筛选'
  })
  risk_level_filter?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '预警类型筛选'
  })
  alert_type_filter?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '处理动作 1确认归档 2锁定拦截 3解除拦截 4标记误判'
  })
  handle_action!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '创建人ID'
  })
  creator_id?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '创建机构ID'
  })
  org_id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '执行开始时间'
  })
  execute_start_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '执行结束时间'
  })
  execute_end_time?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '执行日志'
  })
  execute_log?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => User, 'creator_id')
  creator?: User;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @HasMany(() => AbnormalTransaction, { foreignKey: 'batch_id', constraints: false })
  alerts?: AbnormalTransaction[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: MonitorAlertBatch) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
