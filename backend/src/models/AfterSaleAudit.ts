import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'after_sale_audits',
  timestamps: false,
})
export class AfterSaleAudit extends Model<AfterSaleAudit> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '售后申请ID',
  })
  aftersale_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '审核人ID',
  })
  auditor_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '审核级别：1-初审 2-终审',
  })
  level!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '审核结果：1-通过 2-拒绝',
  })
  status!: number;

  @Column({
    type: DataType.TEXT,
    comment: '审核备注',
  })
  remark?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
