import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt, Unique, Default, HasMany } from 'sequelize-typescript';
import Content from './Content';

export interface CategoryAttributes {
  id: number;
  name: string;
  description?: string;
  sort: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryCreationAttributes extends Omit<CategoryAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description' | 'sort' | 'status'> {
  description?: string;
  sort?: number;
  status?: number;
}

@Table({ tableName: 'cms_category' })
export default class Category extends Model<CategoryAttributes, CategoryCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Unique
  @Column({ type: DataType.STRING(50), allowNull: false, comment: '分类名称' })
  name!: string;

  @Column({ type: DataType.STRING(200), comment: '分类描述' })
  description?: string;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false, comment: '排序' })
  sort!: number;

  @Default(1)
  @Column({ type: DataType.TINYINT, allowNull: false, comment: '状态: 1启用 0禁用' })
  status!: number;

  @HasMany(() => Content)
  contents?: Content[];

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  updatedAt!: Date;
}
