import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum SettlePeriod {
  DAILY = 1,
  WEEKLY = 2,
  MONTHLY = 3,
  QUARTERLY = 4,
}

export const SETTLE_PERIOD_MAP: Record<number, string> = {
  [SettlePeriod.DAILY]: '日结',
  [SettlePeriod.WEEKLY]: '周结',
  [SettlePeriod.MONTHLY]: '月结',
  [SettlePeriod.QUARTERLY]: '季结',
};

export enum ApplyStatus {
  PENDING_AUDIT = 1,
  AUDIT_APPROVED = 2,
  AUDIT_REJECTED = 3,
  TRANSFERRING = 4,
  TRANSFERRED = 5,
  TRANSFER_FAILED = 6,
}

export const APPLY_STATUS_MAP: Record<number, string> = {
  [ApplyStatus.PENDING_AUDIT]: '待审核',
  [ApplyStatus.AUDIT_APPROVED]: '审核通过',
  [ApplyStatus.AUDIT_REJECTED]: '审核驳回',
  [ApplyStatus.TRANSFERRING]: '打款中',
  [ApplyStatus.TRANSFERRED]: '已到账',
  [ApplyStatus.TRANSFER_FAILED]: '打款失败',
};

export enum ApplySource {
  MERCHANT_INITIATIVE = 1,
  SYSTEM_AUTO = 2,
  PLATFORM_BATCH = 3,
}

export const APPLY_SOURCE_MAP: Record<number, string> = {
  [ApplySource.MERCHANT_INITIATIVE]: '商家主动',
  [ApplySource.SYSTEM_AUTO]: '系统自动',
  [ApplySource.PLATFORM_BATCH]: '平台批量',
};

@Table({
  tableName: 'settle_apply_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'uk_apply_no', fields: ['apply_no'], unique: true },
    { name: 'idx_merchant_id', fields: ['merchant_id'] },
    { name: 'idx_apply_status', fields: ['apply_status'] },
    { name: 'idx_period', fields: ['settle_period_type', 'period_start_date', 'period_end_date'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class SettleApplyOrder extends Model<SettleApplyOrder> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, comment: '申请单号' })
  apply_no!: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商家ID' })
  merchant_id!: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, comment: '结算周期：1-日结 2-周结 3-月结 4-季结' })
  settle_period_type!: number;

  @Column({ type: DataType.DATEONLY, allowNull: false, comment: '周期开始日期' })
  period_start_date!: Date;

  @Column({ type: DataType.DATEONLY, allowNull: false, comment: '周期结束日期' })
  period_end_date!: Date;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '本期订单数' })
  total_order_count?: number;

  @Column({ type: DataType.DECIMAL(14, 2), defaultValue: 0, comment: '本期应收总额' })
  total_settle_base?: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0, comment: '平台手续费' })
  platform_fee_amount?: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0, comment: '售后扣减金额' })
  aftersale_deduct_amount?: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0, comment: '违规罚款金额' })
  penalty_deduct_amount?: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0, comment: '其他扣减' })
  other_deduct_amount?: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, comment: '实际结算金额' })
  actual_settle_amount!: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '申请状态：1-待审核 2-审核通过 3-审核驳回 4-打款中 5-已到账 6-打款失败' })
  apply_status?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '申请来源：1-商家主动 2-系统自动 3-平台批量' })
  apply_source?: number;

  @Column({ type: DataType.JSON, comment: '银行卡信息快照JSON' })
  bank_snapshot?: any;

  @Column({ type: DataType.STRING(500), comment: '驳回原因' })
  reject_reason?: string;

  @Column({ type: DataType.DATE, comment: '审核时间' })
  audit_time?: Date;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '审核人ID' })
  auditor_id?: number;

  @Column({ type: DataType.STRING(50), comment: '审核人姓名' })
  auditor_name?: string;

  @Column({ type: DataType.DATE, comment: '打款时间' })
  transfer_time?: Date;

  @Column({ type: DataType.DATE, comment: '到账时间' })
  arrive_time?: Date;

  @Column({ type: DataType.STRING(500), comment: '打款凭证' })
  transfer_voucher_url?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人姓名' })
  operator_name?: string;

  @Column({ type: DataType.STRING(1000), comment: '备注' })
  remark?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
