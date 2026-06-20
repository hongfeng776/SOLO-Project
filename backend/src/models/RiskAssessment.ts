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
import { RiskAssessmentBatch } from './RiskAssessmentBatch';

@Table({
  tableName: 'risk_assessment',
  comment: '客户风险评定记录表'
})
export class RiskAssessment extends Model<RiskAssessment> {
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
    comment: '评定编号'
  })
  assessment_no!: string;

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
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '评定类型 1初评 2复评 3人工调整'
  })
  assessment_type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '风险等级 1低风险 2中风险 3较高风险 4高风险'
  })
  risk_level!: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '风险标签 逗号分隔'
  })
  risk_tags?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '综合评分'
  })
  total_score!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '指标评分详情(JSON格式)'
  })
  indicator_scores?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '征信评分'
  })
  credit_score?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    comment: '负债率(%)'
  })
  debt_ratio?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '涉诉次数'
  })
  lawsuit_count?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '近30天交易次数'
  })
  transaction_count_30d?: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '近30天交易金额'
  })
  transaction_amount_30d?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '开户天数'
  })
  account_open_days?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '数据同步状态 0未同步 1同步中 2同步完成 3同步失败'
  })
  data_sync_status!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '数据同步失败原因'
  })
  data_sync_error?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '状态 0待评定 1评定中 2已完成 3已驳回 4已取消'
  })
  status!: number;

  @ForeignKey(() => RiskAssessmentBatch)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '批量评定批次ID'
  })
  batch_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '评定人ID'
  })
  operator_id?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '评定机构ID'
  })
  org_id?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '评定说明'
  })
  remark?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 0,
    comment: '前次风险等级'
  })
  previous_risk_level?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否违规调低 0否 1是'
  })
  is_illegal_downgrade!: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '违规拦截原因'
  })
  block_reason?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '评定完成时间'
  })
  assessment_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '下次复评时间'
  })
  next_review_time?: Date;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => RiskAssessmentBatch)
  batch?: RiskAssessmentBatch;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: RiskAssessment) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
