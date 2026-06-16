import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'risk_controls',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class RiskControl extends Model<RiskControl> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '规则名称',
  })
  name!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '规则类型：1-用户 2-订单 3-商品 4-商家',
  })
  type!: number;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    comment: '规则条件配置JSON',
  })
  condition_json!: object;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '触发动作：alert-预警 block-拦截 review-审核',
  })
  action!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '阈值',
  })
  threshold?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
  })
  updated_at!: Date;
}
