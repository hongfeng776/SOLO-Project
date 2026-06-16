import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'risk_alerts',
  timestamps: false,
})
export class RiskAlert extends Model<RiskAlert> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '规则ID',
  })
  rule_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '预警类型：1-用户 2-订单 3-商品 4-商家',
  })
  type!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '目标ID',
  })
  target_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '风险等级：1-低 2-中 3-高',
  })
  level!: number;

  @Column({
    type: DataType.TEXT,
    comment: '预警内容',
  })
  content?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '处理状态：0-未处理 1-已处理',
  })
  status?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '处理人ID',
  })
  handler_id?: number;

  @Column({
    type: DataType.DATE,
    comment: '处理时间',
  })
  handled_at?: Date;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
