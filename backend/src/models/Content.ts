import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt, Default, BelongsTo, ForeignKey, BelongsToMany } from 'sequelize-typescript';
import Category from './Category';
import Tag from './Tag';
import ContentTag from './ContentTag';

export type ContentStatus = 'draft' | 'pending' | 'published' | 'offline';

export interface ContentAttributes {
  id: number;
  title: string;
  content: string;
  coverImage?: string;
  status: ContentStatus;
  views: number;
  categoryId?: number;
  publishTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentCreationAttributes extends Omit<ContentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'views'> {
  views?: number;
  tagIds?: number[];
}

@Table({ tableName: 'cms_content' })
export default class Content extends Model<ContentAttributes, ContentCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false, comment: '内容标题' })
  title!: string;

  @Column({ type: DataType.TEXT, allowNull: false, comment: '正文内容' })
  content!: string;

  @Column({ type: DataType.STRING(500), comment: '封面图URL' })
  coverImage?: string;

  @Default('draft')
  @Column({ type: DataType.ENUM('draft', 'pending', 'published', 'offline'), allowNull: false, comment: '状态: draft草稿 pending待审核 published已发布 offline已下线' })
  status!: ContentStatus;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false, comment: '浏览量' })
  views!: number;

  @ForeignKey(() => Category)
  @Column({ type: DataType.INTEGER, comment: '分类ID' })
  categoryId?: number;

  @BelongsTo(() => Category)
  category?: Category;

  @BelongsToMany(() => Tag, () => ContentTag)
  tags?: Tag[];

  @Column({ type: DataType.DATE, field: 'publish_time', comment: '发布时间' })
  publishTime?: Date;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  updatedAt!: Date;
}
