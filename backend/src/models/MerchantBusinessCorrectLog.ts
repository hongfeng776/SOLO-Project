import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'merchant_business_correct_logs',
  timestamps: false,
  indexes: [
    { name: 'idx_merchant_id', fields: ['merchant_id'] },
    { name: 'idx_business_data_id', fields: ['business_data_id'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class MerchantBusinessCorrectLog extends Model<MerchantBusinessCorrectLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '经营数据ID' })
  business_data_id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商家ID' })
  merchant_id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false, comment: '修正字段名' })
  correct_field!: string;

  @Column({ type: DataType.STRING(50), comment: '字段中文名' })
  field_label?: string;

  @Column({ type: DataType.DECIMAL(14, 2), comment: '修正前值' })
  value_before?: number;

  @Column({ type: DataType.DECIMAL(14, 2), comment: '修正后值' })
  value_after?: number;

  @Column({ type: DataType.DECIMAL(14, 2), comment: '差值' })
  diff_value?: number;

  @Column({ type: DataType.DECIMAL(8, 2), comment: '变动百分比' })
  diff_percent?: number;

  @Column({ type: DataType.STRING(500), allowNull: false, comment: '修正原因' })
  correct_reason!: string;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 1, comment: '逻辑一致性校验：1-通过 2-警告 3-不通过' })
  consistency_check?: number;

  @Column({ type: DataType.STRING(1000), comment: '一致性校验详情' })
  consistency_detail?: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人姓名' })
  operator_name?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;
}
