import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum LedgerOperationType {
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  EXPIRE = 'expire',
  CHANGE = 'change',
  FREEZE = 'freeze',
  UNFREEZE = 'unfreeze',
}

export const LEDGER_OPERATION_TYPE_MAP: Record<string, string> = {
  [LedgerOperationType.SUBMIT]: '资质提交',
  [LedgerOperationType.APPROVE]: '审核通过',
  [LedgerOperationType.REJECT]: '审核驳回',
  [LedgerOperationType.EXPIRE]: '资质过期',
  [LedgerOperationType.CHANGE]: '材料变更',
  [LedgerOperationType.FREEZE]: '权限冻结',
  [LedgerOperationType.UNFREEZE]: '权限解冻',
};

@Table({
  tableName: 'merchant_qualification_ledgers',
  timestamps: false,
})
export class MerchantQualificationLedger extends Model<MerchantQualificationLedger> {
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
    comment: '资质ID',
  })
  qualification_id?: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '操作类型：submit-提交 approve-通过 reject-驳回 expire-过期 change-变更 freeze-冻结 unfreeze-解冻',
  })
  operation_type!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '操作前状态',
  })
  status_before?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '操作后状态',
  })
  status_after?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '入驻状态操作前',
  })
  settle_status_before?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '入驻状态操作后',
  })
  settle_status_after?: number;

  @Column({
    type: DataType.DATEONLY,
    comment: '有效期起始操作前',
  })
  valid_from_before?: Date;

  @Column({
    type: DataType.DATEONLY,
    comment: '有效期起始操作后',
  })
  valid_from_after?: Date;

  @Column({
    type: DataType.DATEONLY,
    comment: '有效期终止操作前',
  })
  valid_to_before?: Date;

  @Column({
    type: DataType.DATEONLY,
    comment: '有效期终止操作后',
  })
  valid_to_after?: Date;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '操作人姓名',
  })
  operator_name?: string;

  @Column({
    type: DataType.STRING(2000),
    comment: '操作备注',
  })
  operation_remark?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
