import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'category_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_category_role',
      fields: ['category_id', 'role_id'],
    },
    {
      name: 'idx_permission',
      fields: ['permission_type', 'scope'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
  ],
})
export class CategoryPermission extends Model<CategoryPermission> {
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
    allowNull: false,
    comment: '角色ID：1-超级管理员 2-普通运维 3-商家 4-只读',
  })
  role_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '权限类型：1-可查看 2-可编辑 3-可新增子级 4-批量操作',
  })
  permission_type?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '作用范围：1-仅当前层级 2-含所有子级',
  })
  scope?: number;

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

export default CategoryPermission;
