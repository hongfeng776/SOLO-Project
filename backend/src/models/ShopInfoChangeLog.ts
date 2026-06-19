import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'shop_info_change_logs',
  timestamps: false,
  indexes: [
    { name: 'idx_merchant_id', fields: ['merchant_id'] },
    { name: 'idx_change_field', fields: ['change_field'] },
    { name: 'idx_risk_level', fields: ['risk_level'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
})
export class ShopInfoChangeLog extends Model<ShopInfoChangeLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT.UNSIGNED })
  id!: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, comment: '商家ID' })
  merchant_id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false, comment: '变更字段' })
  change_field!: string;

  @Column({ type: DataType.STRING(50), comment: '字段中文名' })
  field_label?: string;

  @Column({ type: DataType.TEXT, comment: '变更前值' })
  value_before?: string;

  @Column({ type: DataType.TEXT, comment: '变更后值' })
  value_after?: string;

  @Column({ type: DataType.JSON, comment: '命中的敏感词列表' })
  sensitive_words?: any;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 0, comment: '风险等级' })
  risk_level?: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'merchant', comment: '变更来源' })
  change_source!: string;

  @Column({ type: DataType.BIGINT.UNSIGNED, comment: '操作人ID' })
  operator_id?: number;

  @Column({ type: DataType.STRING(50), comment: '操作人姓名' })
  operator_name?: string;

  @Column({ type: DataType.STRING(500), comment: '修改原因' })
  change_reason?: string;

  @Column({ type: DataType.TINYINT.UNSIGNED, defaultValue: 0, comment: '审核状态' })
  audit_status?: number;

  @Column({ type: DataType.STRING(500), comment: '审核备注' })
  audit_remark?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;
}
