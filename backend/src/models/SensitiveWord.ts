import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'sensitive_words',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'uk_word',
      fields: ['word'],
      unique: true,
    },
    {
      name: 'idx_type_level',
      fields: ['type', 'level'],
    },
  ],
})
export class SensitiveWord extends Model<SensitiveWord> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '敏感词',
  })
  word!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '类型：1政治 2色情 3暴力 4广告 5违规',
  })
  type!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '风险等级：1低 2中 3高',
  })
  level!: number;

  @Column({
    type: DataType.STRING(100),
    comment: '替换词',
  })
  replacement?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0禁用 1启用',
  })
  status?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
