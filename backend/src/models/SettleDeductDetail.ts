import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum DeductType {
  PLATFORM_FEE = 1,
  AFTERSALE_REFUND = 2,
  PENALTY_FINE = 3,
  DEPOSIT_DEDUCT = 4,
  OTHER = 5,
}

export const DEDUCT_TYPE_MAP: Record<number, string> = {
  [DeductType.PLATFORM_FEE]: '平台手续费',
  [DeductType.AFTERSALE_REFUND]: '售后退款',
  [DeductType.PENALTY_FINE]: '违规罚款',
  [DeductType.DEPOSIT_DEDUCT]: '保证金扣除',
  [DeductType.OTHER]: '其他',
};

@Table({
  tableName: 'settle_deduct_details',
  timestamps: false,
  indexes: [
    { name: 'idx_settle_apply_id', fields: ['settle_apply_id'] },
    { name: 'idx_merchant_id', fields: ['merchant_id'] },
    { name: 'idx_deduct_type', fields: ['deduct_type'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class SettleDeductDetail extends Model<SettleDeductDetail> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '结算申请单ID' })
  settle_apply_id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商家ID' })
  merchant_id!: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, comment: '扣减类型：1-平台手续费 2-售后退款 3-违规罚款 4-保证金扣除 5-其他' })
  deduct_type!: number;

  @Column({ type: DataType.STRING(50), comment: '扣减类型标签' })
  deduct_type_label?: string;

  @Column({ type: DataType.STRING(32), comment: '关联订单/售后/处罚单号' })
  relate_order_no?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '关联ID' })
  relate_id?: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, comment: '扣减金额' })
  deduct_amount!: number;

  @Column({ type: DataType.STRING(500), allowNull: false, comment: '扣减原因' })
  deduct_reason!: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人姓名' })
  operator_name?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;
}
