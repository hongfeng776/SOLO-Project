import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt, Unique, Default, BelongsToMany } from 'sequelize-typescript';
import Content from './Content';
import ContentTag from './ContentTag';

export interface TagAttributes {
  id: number;
  name: string;
  remark?: string;
  sort: number;
  color?: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagCreationAttributes extends Omit<TagAttributes, 'id' | 'createdAt' | 'updatedAt' | 'remark' | 'sort' | 'color' | 'status'> {
  remark?: string;
  sort?: number;
  color?: string;
  status?: number;
}

@Table({ tableName: 'cms_tag' })
export default class Tag extends Model<TagAttributes, TagCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Unique
  @Column({ type: DataType.STRING(30), allowNull: false, comment: '标签名称' })
  name!: string;

  @Column({ type: DataType.STRING(200), comment: '标签备注' })
  remark?: string;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false, comment: '排序权重' })
  sort!: number;

  @Column({ type: DataType.STRING(20), comment: '标签颜色' })
  color?: string;

  @Default(1)
  @Column({ type: DataType.TINYINT, allowNull: false, comment: '状态: 1启用 0禁用' })
  status!: number;

  @BelongsToMany(() => Content, () => ContentTag)
  contents?: Content[];

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  updatedAt!: Date;
}
