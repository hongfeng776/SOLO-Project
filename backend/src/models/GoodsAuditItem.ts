import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'goods_audit_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_audit_id',
      fields: ['audit_id'],
    },
    {
      name: 'idx_category',
      fields: ['category'],
    },
    {
      name: 'idx_result',
      fields: ['check_result'],
    },
  ],
})
export class GoodsAuditItem extends Model<GoodsAuditItem> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '审核主表ID',
  })
  audit_id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '检查分类：info_complete/qualification/category_compliance/image_text',
  })
  category!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '检查项名称',
  })
  item_name!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '检查项编码',
  })
  item_code!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '检查结果：0未检查 1通过 2不通过 3需补充',
  })
  check_result?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '是否必填：0否 1是',
  })
  required?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '检查详情/问题描述',
  })
  detail?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '补齐建议',
  })
  suggestion?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
