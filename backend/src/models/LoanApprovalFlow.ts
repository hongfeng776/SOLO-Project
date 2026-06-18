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
  tableName: 'biz_loan_approval_flow',
  comment: '贷款审批流程表',
  timestamps: true
})
export class LoanApprovalFlow extends Model<LoanApprovalFlow> {
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
    comment: '当前审批级别 1-5'
  })
  current_level!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '总审批级别数'
  })
  total_levels!: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '审批状态 1审批中 2通过 3驳回 4取消'
  })
  status!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '审批人ID'
  })
  approver_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '审批人姓名'
  })
  approver_name?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '审批时间'
  })
  approve_time?: Date;

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
    comment: '审批通过金额'
  })
  approved_amount?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '审批通过期限（月）'
  })
  approved_term?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    comment: '审批通过利率（%）'
  })
  approved_rate?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '下一审级别'
  })
  next_level?: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    comment: '是否生成合同'
  })
  contract_generated?: boolean;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '合同编号'
  })
  contract_no?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '合同文件URL'
  })
  contract_url?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '合同生成时间'
  })
  contract_generated_at?: Date;

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
    comment: '是否有逻辑冲突 0否 1是'
  })
  conflict_flag!: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '冲突原因说明'
  })
  conflict_reason?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => Loan)
  loan?: Loan;

  @BelongsTo(() => User)
  approver?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: LoanApprovalFlow) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
