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
import { BlacklistRecord } from './BlacklistRecord';
import dayjs from 'dayjs';

@Table({
  tableName: 'biz_blacklist_batch',
  comment: '黑名单批量处理批次表',
  paranoid: true
})
export class BlacklistBatch extends Model<BlacklistBatch> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.STRING(64),
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

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '批次类型 1筛查录入 2批量录入 3批量移除 4批量延期 5批量等级变更'
  })
  batch_type!: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '状态 0待执行 1执行中 2已完成 3执行失败'
  })
  status!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总数量'
  })
  total_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '成功数量'
  })
  success_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '失败数量'
  })
  fail_count!: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '筛选条件'
  })
  filter_condition?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '黑名单等级筛选'
  })
  grade_filter?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '违规类型筛选'
  })
  violation_type_filter?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '目标等级'
  })
  target_grade?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '延长期限(天)'
  })
  extend_days?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: '处理原因'
  })
  handle_reason!: string;

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

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '创建人ID'
  })
  creator_id?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '归属机构ID'
  })
  org_id?: string;

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

  @HasMany(() => BlacklistRecord)
  blacklist_records?: BlacklistRecord[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: BlacklistBatch) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
