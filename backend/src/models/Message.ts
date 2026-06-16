import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'messages',
  timestamps: false,
  indexes: [
    {
      name: 'idx_user',
      fields: ['user_type', 'user_id'],
    },
    {
      name: 'idx_is_read',
      fields: ['is_read'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class Message extends Model<Message> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '接收人类型：1-用户 2-商家 3-管理员',
  })
  user_type!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '接收人ID',
  })
  user_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '消息类型：1-系统通知 2-订单通知 3-风控预警 4-营销消息',
  })
  type!: number;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    comment: '消息标题',
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    comment: '消息内容',
  })
  content?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否已读：0-未读 1-已读',
  })
  is_read?: number;

  @Column({
    type: DataType.DATE,
    comment: '读取时间',
  })
  read_at?: Date;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
