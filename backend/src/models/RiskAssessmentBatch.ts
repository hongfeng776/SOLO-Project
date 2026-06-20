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
import { RiskAssessment } from './RiskAssessment';

@Table({
  tableName: 'risk_assessment_batch',
  comment: '客户风险批量评定批次表'
})
export class RiskAssessmentBatch extends Model<RiskAssessmentBatch> {
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
    comment: '批次类型 1新增客户初评 2存量客户复评 3高风险客户复评 4自定义'
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
    comment: '总客户数'
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
    comment: '筛选条件(JSON格式)'
  })
  filter_condition?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '复评频次策略 0无 1按月 2按季 3按半年 4按年 5按活跃度 6按风险异动'
  })
  review_frequency_strategy!: number;

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

  @HasMany(() => RiskAssessment, { foreignKey: 'batch_id', constraints: false })
  assessments?: RiskAssessment[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: RiskAssessmentBatch) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
