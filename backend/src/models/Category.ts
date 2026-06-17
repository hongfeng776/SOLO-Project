import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_code',
      fields: ['code'],
      unique: true,
    },
    {
      name: 'idx_parent_id',
      fields: ['parent_id'],
    },
    {
      name: 'idx_level',
      fields: ['level'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
  ],
})
export class Category extends Model<Category> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '类目编码',
  })
  code!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: '父级类目ID，0表示顶级',
  })
  parent_id?: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '类目名称',
  })
  name!: string;

  @Column({
    type: DataType.STRING(255),
    comment: '图标',
  })
  icon?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '层级：1-一级 2-二级 3-三级',
  })
  level?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 3,
    comment: '该层级下允许的最大深度',
  })
  level_limit?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否有子级：0-否 1-是',
  })
  has_children?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序',
  })
  sort?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-禁用 1-启用',
  })
  status?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '绑定商品数量，冗余字段',
  })
  product_count?: number;

  @Column({
    type: DataType.JSON,
    comment: '必填字段规则JSON，如[{field:"spec",label:"规格",required:true,rules:[...]}]',
  })
  required_fields_json?: any;

  @Column({
    type: DataType.JSON,
    comment: '合规校验规则JSON',
  })
  compliance_rules_json?: any;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '创建人ID',
  })
  created_by?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '更新人ID',
  })
  updated_by?: number;

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
