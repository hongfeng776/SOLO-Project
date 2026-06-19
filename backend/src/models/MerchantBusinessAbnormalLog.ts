import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum AbnormalType {
  SURGE = 1,
  PLUNGE = 2,
  DUPLICATE = 3,
  LOGIC_CONFLICT = 4,
}

export const ABNORMAL_TYPE_MAP: Record<number, string> = {
  [AbnormalType.SURGE]: '突增',
  [AbnormalType.PLUNGE]: '突降',
  [AbnormalType.DUPLICATE]: '重复统计',
  [AbnormalType.LOGIC_CONFLICT]: '逻辑矛盾',
};

export enum AbnormalLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

export const ABNORMAL_LEVEL_MAP: Record<number, string> = {
  [AbnormalLevel.LOW]: '低',
  [AbnormalLevel.MEDIUM]: '中',
  [AbnormalLevel.HIGH]: '高',
};

export enum AbnormalCheckStatus {
  PENDING = 1,
  CALIBRATED = 2,
  IGNORED = 3,
  MARKED_RISK = 4,
}

export const ABNORMAL_CHECK_STATUS_MAP: Record<number, string> = {
  [AbnormalCheckStatus.PENDING]: '待处理',
  [AbnormalCheckStatus.CALIBRATED]: '已校准',
  [AbnormalCheckStatus.IGNORED]: '已忽略',
  [AbnormalCheckStatus.MARKED_RISK]: '标记风险',
};

@Table({
  tableName: 'merchant_business_abnormal_logs',
  timestamps: false,
  indexes: [
    { name: 'idx_merchant_id', fields: ['merchant_id'] },
    { name: 'idx_abnormal_type', fields: ['abnormal_type'] },
    { name: 'idx_check_status', fields: ['check_status'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class MerchantBusinessAbnormalLog extends Model<MerchantBusinessAbnormalLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商家ID' })
  merchant_id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '经营数据ID' })
  business_data_id?: number;

  @Column({ type: DataType.STRING(50), allowNull: false, comment: '异常字段' })
  abnormal_field!: string;

  @Column({ type: DataType.STRING(50), comment: '字段中文名' })
  field_label?: string;

  @Column({ type: DataType.DECIMAL(14, 2), comment: '当前值' })
  current_value?: number;

  @Column({ type: DataType.DECIMAL(14, 2), comment: '历史平均值' })
  history_avg_value?: number;

  @Column({ type: DataType.DECIMAL(8, 2), comment: '偏差百分比' })
  diff_percent?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, comment: '异常类型：1-突增 2-突降 3-重复统计 4-逻辑矛盾' })
  abnormal_type!: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 2, comment: '异常等级：1-低 2-中 3-高' })
  abnormal_level?: number;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '处理状态：1-待处理 2-已校准 3-已忽略 4-标记风险' })
  check_status?: number;

  @Column({ type: DataType.STRING(500), comment: '处理原因' })
  check_reason?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人姓名' })
  operator_name?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @Column({ type: DataType.DATE, comment: '处理时间' })
  checked_at?: Date;
}
