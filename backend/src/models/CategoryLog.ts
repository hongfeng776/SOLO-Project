import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'category_logs',
  timestamps: false,
  indexes: [
    {
      name: 'idx_category_id',
      fields: ['category_id'],
    },
    {
      name: 'idx_operator',
      fields: ['operator_id', 'operator_type'],
    },
    {
      name: 'idx_action',
      fields: ['action'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class CategoryLog extends Model<CategoryLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '类目ID',
  })
  category_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '操作人类型：1-管理员 2-商家 3-系统',
  })
  operator_type?: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '动作类型：create/update/enable/disable/sort/move/delete',
  })
  action!: string;

  @Column({
    type: DataType.JSON,
    comment: '变更前快照(含parent_id/name/sort/status)',
  })
  old_data_json?: any;

  @Column({
    type: DataType.JSON,
    comment: '变更后快照',
  })
  new_data_json?: any;

  @Column({
    type: DataType.JSON,
    comment: '变更字段数组',
  })
  changed_fields?: any;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}

export default CategoryLog;
