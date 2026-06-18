import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum MerchantAuditStep {
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  RESUBMIT = 'resubmit',
  REVIEW = 'review',
}

export const MERCHANT_AUDIT_STEP_MAP: Record<string, string> = {
  [MerchantAuditStep.SUBMIT]: '提交',
  [MerchantAuditStep.APPROVE]: '通过',
  [MerchantAuditStep.REJECT]: '驳回',
  [MerchantAuditStep.RESUBMIT]: '补传',
  [MerchantAuditStep.REVIEW]: '复核',
};

export enum MerchantAuditOperationType {
  INITIAL = 'initial',
  RESUBMIT = 'resubmit',
  REVIEW = 'review',
}

@Table({
  tableName: 'merchant_audits',
  timestamps: false,
})
export class MerchantAudit extends Model<MerchantAudit> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商家ID',
  })
  merchant_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '审核人ID',
  })
  auditor_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '审核状态：0-待审核 1-审核通过 2-审核拒绝',
  })
  status?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '审核原因/意见',
  })
  reason?: string;

  @Column({
    type: DataType.STRING(50),
    defaultValue: 'submit',
    comment: '审核步骤：submit-提交 approve-通过 reject-驳回 resubmit-补传 review-复核',
  })
  audit_step?: string;

  @Column({
    type: DataType.JSON,
    comment: '缺失材料列表',
  })
  missing_materials?: any;

  @Column({
    type: DataType.JSON,
    comment: '违规点列表',
  })
  violation_points?: any;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否需要补传：0-否 1-是',
  })
  need_resubmit?: number;

  @Column({
    type: DataType.DATE,
    comment: '补传截止日期',
  })
  resubmit_deadline?: Date;

  @Column({
    type: DataType.STRING(50),
    defaultValue: 'initial',
    comment: '操作类型：initial-首次提交 resubmit-补传 review-复核',
  })
  operation_type?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;
}
