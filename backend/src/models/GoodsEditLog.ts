import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'goods_edit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class GoodsEditLog extends Model<GoodsEditLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商品ID',
  })
  goods_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '编辑人ID',
  })
  editor_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '编辑人类型：1-管理员 2-商家',
  })
  editor_type!: number;

  @Column({
    type: DataType.JSON,
    comment: '编辑前数据JSON',
  })
  old_data_json?: any;

  @Column({
    type: DataType.JSON,
    comment: '编辑后数据JSON',
  })
  new_data_json?: any;

  @Column({
    type: DataType.JSON,
    comment: '变更字段JSON数组',
  })
  changed_fields?: any;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
