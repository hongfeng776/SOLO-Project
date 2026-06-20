import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum VoucherStatus {
  VALID = 1,
  INVALID = 2,
}

export const VOUCHER_STATUS_MAP: Record<number, string> = {
  [VoucherStatus.VALID]: '有效',
  [VoucherStatus.INVALID]: '作废',
};

@Table({
  tableName: 'settle_transfer_vouchers',
  timestamps: false,
  indexes: [
    { name: 'uk_settle_apply_id', fields: ['settle_apply_id'], unique: true },
    { name: 'idx_merchant_id', fields: ['merchant_id'] },
    { name: 'idx_transfer_no', fields: ['transfer_no'] },
    { name: 'idx_voucher_status', fields: ['voucher_status'] },
  ],
})
export class SettleTransferVoucher extends Model<SettleTransferVoucher> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '结算申请单ID' })
  settle_apply_id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商家ID' })
  merchant_id!: number;

  @Column({ type: DataType.STRING(64), allowNull: false, comment: '银行流水号' })
  transfer_no!: string;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, comment: '转账金额' })
  transfer_amount!: number;

  @Column({ type: DataType.DATE, allowNull: false, comment: '转账时间' })
  transfer_time!: Date;

  @Column({ type: DataType.STRING(100), comment: '付款银行' })
  transfer_bank?: string;

  @Column({ type: DataType.STRING(100), comment: '收款银行' })
  receive_bank?: string;

  @Column({ type: DataType.STRING(500), comment: '凭证图片URL' })
  voucher_url?: string;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '凭证状态：1-有效 2-作废' })
  voucher_status?: number;

  @Column({ type: DataType.STRING(500), comment: '备注' })
  remark?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人姓名' })
  operator_name?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;
}
