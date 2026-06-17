import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'article_review_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_article',
      fields: ['article_id', 'version'],
    },
    {
      name: 'idx_reviewer',
      fields: ['reviewer_id'],
    },
    {
      name: 'idx_action',
      fields: ['action'],
    },
  ],
})
export class ArticleReviewLog extends Model<ArticleReviewLog> {
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
    comment: '版本号',
  })
  version?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '审核人ID',
  })
  reviewer_id!: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '动作：submit/pass/reject/offline',
  })
  action!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '动作前状态',
  })
  before_status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '动作后状态',
  })
  after_status?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '备注',
  })
  remark?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
