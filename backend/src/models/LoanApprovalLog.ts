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
import { Loan } from './Loan';
import { User } from './User';

@Table({
  tableName: 'biz_loan_approval_log',
  comment: '贷款审批操作日志表',
  timestamps: true
})
export class LoanApprovalLog extends Model<LoanApprovalLog> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @ForeignKey(() => Loan)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '贷款申请ID'
  })
  loan_id!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '贷款编号'
  })
  loan_no!: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '审批级别 1-5'
  })
  approval_level!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '操作人ID'
  })
  operator_id!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '操作人姓名'
  })
  operator_name!: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '操作类型 enter进入 approvals审批 reject驳回 cancel取消 complete完成'
  })
  operation_type!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '操作时间'
  })
  operation_time!: Date;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '操作前状态'
  })
  from_status?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '操作后状态'
  })
  to_status?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '审批结果 1通过 2驳回 3取消'
  })
  approval_result?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '审批意见'
  })
  approval_opinion?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '驳回原因编码'
  })
  reject_reason?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: 'IP地址'
  })
  ip_address?: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: 'User Agent'
  })
  user_agent?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '审批前风险等级'
  })
  risk_level_before?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '审批后风险等级'
  })
  risk_level_after?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 2,
    comment: '审批意见一致性 0不通过 1通过 2待核'
  })
  consistency_check?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否越权审批 0否 1是'
  })
  unauthorized_flag!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否违规审批 0否 1是'
  })
  illegal_flag!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否有逻辑冲突 0否 1是'
  })
  conflict_flag!: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '冲突/违规原因说明'
  })
  violation_reason?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '请求参数快照（JSON）'
  })
  request_snapshot?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '扩展字段（JSON）'
  })
  ext_info?: string;

  @BelongsTo(() => Loan)
  loan?: Loan;

  @BelongsTo(() => User)
  operator?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: LoanApprovalLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
