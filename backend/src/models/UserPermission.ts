import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'user_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class UserPermission extends Model<UserPermission> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '权限ID',
  })
  permission_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '权限编码',
  })
  permission_code!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '授权类型：1-默认授权 2-手动授予 3-临时授权 4-批量授予',
  })
  grant_type?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '授权来源：manual-手动 batch-批量 promotion-活动 upgrade-升级',
  })
  grant_source?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '授权人ID',
  })
  granted_by?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '授权人姓名',
  })
  granted_by_name?: string;

  @Column({
    type: DataType.DATE,
    comment: '授权时间',
  })
  granted_at?: Date;

  @Column({
    type: DataType.DATE,
    comment: '过期时间（临时权限用）',
  })
  expire_time?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否已回收：0-否 1-是',
  })
  is_revoked?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '回收人ID',
  })
  revoked_by?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '回收人姓名',
  })
  revoked_by_name?: string;

  @Column({
    type: DataType.DATE,
    comment: '回收时间',
  })
  revoked_at?: Date;

  @Column({
    type: DataType.STRING(255),
    comment: '回收原因',
  })
  revoke_reason?: string;

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
