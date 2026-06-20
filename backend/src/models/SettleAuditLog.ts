import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum AuditAction {
  SUBMIT_APPLY = 1,
  AUDIT_APPROVE = 2,
  AUDIT_REJECT = 3,
  INITIATE_TRANSFER = 4,
  CONFIRM_ARRIVE = 5,
  TRANSFER_RETRY = 6,
  CANCEL_APPLY = 7,
}

export const AUDIT_ACTION_MAP: Record<number, string> = {
  [AuditAction.SUBMIT_APPLY]: '提交申请',
  [AuditAction.AUDIT_APPROVE]: '审核通过',
  [AuditAction.AUDIT_REJECT]: '审核驳回',
  [AuditAction.INITIATE_TRANSFER]: '发起打款',
  [AuditAction.CONFIRM_ARRIVE]: '确认到账',
  [AuditAction.TRANSFER_RETRY]: '打款失败重试',
  [AuditAction.CANCEL_APPLY]: '取消申请',
};

@Table({
  tableName: 'settle_audit_logs',
  timestamps: false,
  indexes: [
    { name: 'idx_settle_apply_id', fields: ['settle_apply_id'] },
    { name: 'idx_merchant_id', fields: ['merchant_id'] },
    { name: 'idx_audit_action', fields: ['audit_action'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class SettleAuditLog extends Model<SettleAuditLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '结算申请单ID' })
  settle_apply_id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商家ID' })
  merchant_id!: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, comment: '操作：1-提交申请 2-审核通过 3-审核驳回 4-发起打款 5-确认到账 6-打款失败重试 7-取消申请' })
  audit_action!: number;

  @Column({ type: DataType.STRING(50), comment: '操作标签' })
  audit_action_label?: string;

  @Column({ type: DataType.TINYINT.UNSIGNED, comment: '变更前状态' })
  before_status?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, comment: '变更后状态' })
  after_status?: number;

  @Column({ type: DataType.STRING(1000), comment: '操作详情' })
  audit_detail?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人姓名' })
  operator_name?: string;

  @Column({ type: DataType.STRING(50), comment: '操作人角色' })
  operator_role?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;
}
