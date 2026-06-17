import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Category extends Model<Category> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

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
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '层级：1-一级 2-二级 3-三级',
  })
  level?: number;

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
    type: DataType.JSON,
    comment: '必填字段规则JSON，如[{field:"spec",label:"规格",required:true,rules:[...]}]',
  })
  required_fields_json?: any;

  @Column({
    type: DataType.JSON,
    comment: '合规校验规则JSON',
  })
  compliance_rules_json?: any;

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
