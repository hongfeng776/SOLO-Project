import { Table, Column, Model, DataType, ForeignKey, PrimaryKey } from 'sequelize-typescript';
import Content from './Content';
import Tag from './Tag';

@Table({ tableName: 'cms_content_tag', timestamps: false })
export default class ContentTag extends Model {
  @PrimaryKey
  @ForeignKey(() => Content)
  @Column({ type: DataType.INTEGER, field: 'content_id' })
  contentId!: number;

  @PrimaryKey
  @ForeignKey(() => Tag)
  @Column({ type: DataType.INTEGER, field: 'tag_id' })
  tagId!: number;
}
