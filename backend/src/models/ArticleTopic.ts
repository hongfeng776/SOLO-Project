import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'article_topics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uk_code',
      fields: ['unique_code'],
      unique: true,
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_channel',
      fields: ['channel'],
    },
    {
      name: 'idx_date',
      fields: ['start_date', 'end_date'],
    },
  ],
})
export class ArticleTopic extends Model<ArticleTopic> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '专题名称',
  })
  name!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '专题编码',
  })
  unique_code!: string;

  @Column({
    type: DataType.STRING(255),
    comment: '封面图',
  })
  cover_image?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '描述',
  })
  description?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '专题banner',
  })
  banner_image?: string;

  @Column({
    type: DataType.JSON,
    comment: '资源位配置[{"slot_id","location","sort"}]',
  })
  resource_slot_json?: unknown;

  @Column({
    type: DataType.STRING(50),
    comment: '所属频道',
  })
  channel?: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序',
  })
  sort?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '状态：0未启用 1启用 2结束',
  })
  status?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '已发布图文数量',
  })
  published_count?: number;

  @Column({
    type: DataType.DATEONLY,
    comment: '开始日期',
  })
  start_date?: string;

  @Column({
    type: DataType.DATEONLY,
    comment: '结束日期',
  })
  end_date?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '创建人ID',
  })
  created_by?: number;

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
