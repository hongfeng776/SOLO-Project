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
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '权限ID',
  })
  permission_id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '权限编码（冗余）',
  })
  permission_code!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '授予方式：1-默认授予 2-手动授予 3-升级获得 4-活动获得',
  })
  grant_type?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '授予人ID（手动授予时）',
  })
  granted_by?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '授予人姓名',
  })
  granted_by_name?: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    comment: '授予时间',
  })
  granted_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '过期时间（NULL表示永久）',
  })
  expire_time?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-已回收 1-生效 2-已过期',
  })
  status?: number;

  @Column({
    type: DataType.STRING(255),
    comment: '回收原因',
  })
  revoke_reason?: string;

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
  revoked_time?: Date;

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
