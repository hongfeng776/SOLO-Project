import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'qualification_change_logs',
  timestamps: false,
})
export class QualificationChangeLog extends Model<QualificationChangeLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商家ID',
  })
  merchant_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '资质ID',
  })
  qualification_id?: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '变更字段',
  })
  change_field!: string;

  @Column({
    type: DataType.TEXT,
    comment: '变更前值',
  })
  value_before?: string;

  @Column({
    type: DataType.TEXT,
    comment: '变更后值',
  })
  value_after?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '操作人姓名',
  })
  operator_name?: string;

  @Column({
    type: DataType.STRING(1000),
    comment: '变更原因',
  })
  change_reason?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
