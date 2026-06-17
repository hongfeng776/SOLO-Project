import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'goods_audit_resubmits',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_audit',
      fields: ['audit_id'],
    },
    {
      name: 'idx_goods',
      fields: ['goods_id'],
    },
    {
      name: 'idx_submit',
      fields: ['submit_at'],
    },
  ],
})
export class GoodsAuditResubmit extends Model<GoodsAuditResubmit> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '关联审核主表',
  })
  audit_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商品ID',
  })
  goods_id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '第N次重提',
  })
  resubmit_no!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '重提前状态',
  })
  previous_status?: number;

  @Column({
    type: DataType.JSON,
    comment: '本次修改字段["price","images"]',
  })
  change_fields?: object;

  @Column({
    type: DataType.JSON,
    comment: '补充材料[{"name","url","type"}]',
  })
  supplement_materials_json?: object;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '提交人',
  })
  submitter_id?: number;

  @Column({
    type: DataType.DATE,
    comment: '提交时间',
  })
  submit_at?: Date;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
