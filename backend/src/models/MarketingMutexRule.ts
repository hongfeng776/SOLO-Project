import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketing_mutex_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class MarketingMutexRule extends Model<MarketingMutexRule> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '活动类型',
  })
  type!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '互斥活动类型',
  })
  mutex_type!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '规则名称',
  })
  rule_name!: string;

  @Column({
    type: DataType.STRING(500),
    comment: '规则描述',
  })
  description?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  updated_at!: Date;
}
