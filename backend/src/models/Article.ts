import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'articles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uk_unique_code',
      fields: ['unique_code'],
      unique: true,
    },
    {
      name: 'idx_domain',
      fields: ['domain_category_id'],
    },
    {
      name: 'idx_channel',
      fields: ['channel'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_publisher',
      fields: ['publisher_id', 'publisher_type'],
    },
    {
      name: 'idx_published_at',
      fields: ['published_at'],
    },
    {
      name: 'idx_top_sort',
      fields: ['top_flag', 'sort_weight'],
    },
  ],
})
export class Article extends Model<Article> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '图文唯一编码',
  })
  unique_code!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '标题',
  })
  title!: string;

  @Column({
    type: DataType.STRING(500),
    comment: '摘要',
  })
  summary?: string;

  @Column({
    type: DataType.TEXT('long'),
    comment: '正文内容(JSON富文本/Markdown)',
  })
  content?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '封面图',
  })
  cover_image?: string;

  @Column({
    type: DataType.JSON,
    comment: '配图数组',
  })
  images_json?: unknown;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '领域分类ID',
  })
  domain_category_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '发布渠道：homepage首页/infopage资讯页/special专题页',
  })
  channel?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '排版模板：article_default/banner_list/full_width/topic_special',
  })
  template?: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    comment: '字数',
  })
  word_count?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '阅读量',
  })
  view_count?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '点赞量',
  })
  like_count?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '评论量',
  })
  comment_count?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '分享量',
  })
  share_count?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否置顶：0否 1是',
  })
  top_flag?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序权重',
  })
  sort_weight?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '状态：0草稿 1待审核 2已发布 3已下架 4审核拒绝',
  })
  status!: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 1,
    comment: '当前版本号',
  })
  version?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '关联专题',
  })
  topic_id?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '发布人ID',
  })
  publisher_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '发布人类型：1管理员 2运营 3商家',
  })
  publisher_type?: number;

  @Column({
    type: DataType.DATE,
    comment: '发布时间',
  })
  published_at?: Date;

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
