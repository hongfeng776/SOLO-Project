import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'admin_user_scope',
  timestamps: false,
})
export class AdminUserScope extends Model<AdminUserScope> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '管理员ID',
  })
  admin_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '管辖类型：1-直接管辖 2-间接管辖',
  })
  scope_type?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '授权人ID',
  })
  granted_by?: number;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    comment: '授权时间',
  })
  granted_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '授权过期时间',
  })
  expire_time?: Date;

  @Column({
    type: DataType.STRING(255),
    comment: '备注',
  })
  remark?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
