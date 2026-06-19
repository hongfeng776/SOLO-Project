import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum BusinessStatPeriod {
  DAY = 1,
  WEEK = 2,
  MONTH = 3,
  QUARTER = 4,
  YEAR = 5,
}

export const BUSINESS_STAT_PERIOD_MAP: Record<number, string> = {
  [BusinessStatPeriod.DAY]: '日',
  [BusinessStatPeriod.WEEK]: '周',
  [BusinessStatPeriod.MONTH]: '月',
  [BusinessStatPeriod.QUARTER]: '季',
  [BusinessStatPeriod.YEAR]: '年',
};

export enum BusinessDataStatus {
  NORMAL = 1,
  CORRECTED = 2,
  ABNORMAL = 3,
  CALIBRATED = 4,
}

export const BUSINESS_DATA_STATUS_MAP: Record<number, string> = {
  [BusinessDataStatus.NORMAL]: '正常',
  [BusinessDataStatus.CORRECTED]: '已修正',
  [BusinessDataStatus.ABNORMAL]: '异常',
  [BusinessDataStatus.CALIBRATED]: '已校准',
};

export enum BusinessDataSource {
  SYSTEM = 1,
  MANUAL = 2,
  BATCH_IMPORT = 3,
}

export const BUSINESS_DATA_SOURCE_MAP: Record<number, string> = {
  [BusinessDataSource.SYSTEM]: '系统自动',
  [BusinessDataSource.MANUAL]: '手动录入',
  [BusinessDataSource.BATCH_IMPORT]: '批量导入',
};

export enum RiskLevel {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

export const RISK_LEVEL_MAP: Record<number, string> = {
  [RiskLevel.NONE]: '无',
  [RiskLevel.LOW]: '低',
  [RiskLevel.MEDIUM]: '中',
  [RiskLevel.HIGH]: '高',
};

export enum BusinessQualityLevel {
  NOT_ASSESSED = 0,
  HIGH_QUALITY = 1,
  NORMAL = 2,
  LOW_QUALITY = 3,
}

export const BUSINESS_QUALITY_LEVEL_MAP: Record<number, string> = {
  [BusinessQualityLevel.NOT_ASSESSED]: '未评定',
  [BusinessQualityLevel.HIGH_QUALITY]: '优质',
  [BusinessQualityLevel.NORMAL]: '普通',
  [BusinessQualityLevel.LOW_QUALITY]: '劣质',
};

@Table({
  tableName: 'merchant_business_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'uk_merchant_period', fields: ['merchant_id', 'stat_period_type', 'stat_start_date', 'stat_end_date'], unique: true },
    { name: 'idx_merchant_id', fields: ['merchant_id'] },
    { name: 'idx_stat_date', fields: ['stat_start_date', 'stat_end_date'] },
    { name: 'idx_data_status', fields: ['data_status'] },
    { name: 'idx_shop_category', fields: ['shop_category'] },
    { name: 'idx_shop_level', fields: ['shop_level'] },
    { name: 'idx_risk_level', fields: ['risk_level'] },
  ],
})
export class MerchantBusinessData extends Model<MerchantBusinessData> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商家ID' })
  merchant_id!: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, comment: '统计周期：1-日 2-周 3-月 4-季 5-年' })
  stat_period_type!: number;

  @Column({ type: DataType.DATEONLY, allowNull: false, comment: '统计开始日期' })
  stat_start_date!: Date;

  @Column({ type: DataType.DATEONLY, allowNull: false, comment: '统计结束日期' })
  stat_end_date!: Date;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '订单总数' })
  total_order_count?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '有效订单数（剔除取消/退款）' })
  valid_order_count?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '已完成订单数' })
  completed_order_count?: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0, comment: '销售额' })
  total_sales_amount?: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0, comment: '有效销售额' })
  valid_sales_amount?: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0, comment: '已结算金额' })
  settled_amount?: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0, comment: '待结算金额' })
  unsettled_amount?: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0, comment: '退款总额' })
  total_refund_amount?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '退款订单数' })
  refund_order_count?: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0, comment: '客单价' })
  avg_order_amount?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '新客数' })
  new_customer_count?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '复购客数' })
  repeat_customer_count?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, defaultValue: 0, comment: '有效评价数' })
  valid_review_count?: number;

  @Column({ type: DataType.DECIMAL(5, 2), defaultValue: 0, comment: '好评率' })
  positive_review_rate?: number;

  @Column({ type: DataType.STRING(50), comment: '经营类目快照' })
  shop_category?: string;

  @Column({ type: DataType.TINYINT.UNSIGNED, comment: '店铺等级快照' })
  shop_level?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '数据状态：1-正常 2-已修正 3-异常 4-已校准' })
  data_status?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '数据来源：1-系统自动 2-手动录入 3-批量导入' })
  data_source?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 0, comment: '是否异常波动' })
  is_abnormal?: number;

  @Column({ type: DataType.STRING(500), comment: '异常原因' })
  abnormal_reason?: string;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 0, comment: '风险等级：0-无 1-低 2-中 3-高' })
  risk_level?: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人姓名' })
  operator_name?: string;

  @Column({ type: DataType.STRING(500), comment: '备注' })
  remark?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
