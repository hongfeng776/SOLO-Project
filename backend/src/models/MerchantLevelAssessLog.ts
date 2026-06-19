import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum AssessPeriodType {
  MONTHLY = 1,
  QUARTERLY = 2,
  YEARLY = 3,
}

export const ASSESS_PERIOD_TYPE_MAP: Record<number, string> = {
  [AssessPeriodType.MONTHLY]: '月度',
  [AssessPeriodType.QUARTERLY]: '季度',
  [AssessPeriodType.YEARLY]: '年度',
};

@Table({
  tableName: 'merchant_level_assess_logs',
  timestamps: false,
  indexes: [
    { name: 'idx_merchant_id', fields: ['merchant_id'] },
    { name: 'idx_assess_date', fields: ['assess_start_date', 'assess_end_date'] },
    { name: 'idx_new_level', fields: ['new_shop_level'] },
  ],
})
export class MerchantLevelAssessLog extends Model<MerchantLevelAssessLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商家ID' })
  merchant_id!: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, comment: '评定周期：1-月度 2-季度 3-年度' })
  assess_period_type!: number;

  @Column({ type: DataType.DATEONLY, allowNull: false, comment: '评定开始日期' })
  assess_start_date!: Date;

  @Column({ type: DataType.DATEONLY, allowNull: false, comment: '评定结束日期' })
  assess_end_date!: Date;

  @Column({ type: DataType.TINYINT.UNSIGNED, comment: '变更前店铺等级' })
  old_shop_level?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, comment: '变更后店铺等级' })
  new_shop_level!: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, comment: '变更前经营排名' })
  old_business_rank?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, comment: '变更后经营排名' })
  new_business_rank!: number;

  @Column({ type: DataType.DECIMAL(12, 2), comment: '变更前预估结算金额' })
  old_estimated_settle?: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, comment: '变更后预估结算金额' })
  new_estimated_settle!: number;

  @Column({ type: DataType.JSON, comment: '评定依据（各项指标JSON）' })
  assess_basis?: any;

  @Column({ type: DataType.STRING(500), comment: '评定原因' })
  assess_reason?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人姓名' })
  operator_name?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;
}
