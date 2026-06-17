import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'article_versions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_article_version',
      fields: ['article_id', 'version'],
    },
    {
      name: 'idx_editor',
      fields: ['editor_id'],
    },
    {
      name: 'idx_reviewed',
      fields: ['reviewed_status', 'reviewer_id'],
    },
  ],
})
export class ArticleVersion extends Model<ArticleVersion> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '图文ID',
  })
  article_id!: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '版本号',
  })
  version!: number;

  @Column({
    type: DataType.STRING(255),
    comment: '标题',
  })
  title?: string;

  @Column({
    type: DataType.TEXT('long'),
    comment: '该版本完整快照',
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
    type: DataType.STRING(500),
    comment: '修改说明',
  })
  change_log?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '编辑人ID',
  })
  editor_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '修改类型：1增量修改 2全覆盖修改',
  })
  edit_type?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '审核状态：0未提交 1待审 2通过 3拒绝',
  })
  reviewed_status?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '审核人ID',
  })
  reviewer_id?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '审核备注',
  })
  review_remark?: string;

  @Column({
    type: DataType.DATE,
    comment: '审核时间',
  })
  reviewed_at?: Date;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
