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

@Table({
  tableName: 'biz_opening_review_log',
  comment: '开户审核记录表'
})
export class OpeningReviewLog extends Model<OpeningReviewLog> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '开户类型 1=个人 2=对公'
  })
  opening_type!: number;

  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '开户申请ID'
  })
  opening_id!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '开户申请流水号'
  })
  opening_no!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '审核级别 1=初审 2=复审 3=终审'
  })
  review_level!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '审核人ID'
  })
  reviewer_id!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '审核人姓名'
  })
  reviewer_name!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '审核结果 1=通过 2=驳回 3=取消'
  })
  review_result!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '审核意见'
  })
  review_comment?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '驳回原因编码'
  })
  reject_reason?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '详细驳回说明'
  })
  reject_details?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '佐证材料URL（JSON数组）'
  })
  supporting_files?: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '预审金额'
  })
  pre_approved_amount?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '审核前风险等级'
  })
  risk_level_before?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '审核后风险等级'
  })
  risk_level_after?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 2,
    comment: '审核意见一致性 0=不通过 1=通过 2=待核'
  })
  consistency_check?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否有逻辑冲突 0=否 1=是'
  })
  conflict_flag!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '下一审核级别'
  })
  next_required_level?: number;

  @BelongsTo(() => User)
  reviewer?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: OpeningReviewLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
