import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'user_permission_logs',
  timestamps: false,
})
export class UserPermissionLog extends Model<UserPermissionLog> {
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
    type: DataType.STRING(50),
    comment: '用户名（冗余）',
  })
  username?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '日志类型：1-权限授予 2-权限回收 3-权限重置 4-状态变更联动 5-批量操作',
  })
  log_type!: number;

  @Column({
    type: DataType.TEXT,
    comment: '涉及权限编码，多个逗号分隔',
  })
  permission_codes?: string;

  @Column({
    type: DataType.TEXT,
    comment: '权限变更明细JSON',
  })
  permission_details?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '操作人姓名',
  })
  operator_name?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '操作人角色：super_admin-超级管理员 admin-普通管理员 system-系统',
  })
  operator_role?: string;

  @Column({
    type: DataType.STRING(45),
    comment: '操作IP',
  })
  operate_ip?: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    comment: '操作时间',
  })
  operate_time?: Date;

  @Column({
    type: DataType.STRING(20),
    defaultValue: 'single',
    comment: '操作范围：single-单个 batch-批量 global-全局',
  })
  operate_scope?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '操作原因/备注',
  })
  reason?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '操作前状态',
  })
  before_status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '操作后状态',
  })
  after_status?: number;

  @Column({
    type: DataType.TEXT,
    comment: '操作前权限快照JSON',
  })
  before_permissions?: string;

  @Column({
    type: DataType.TEXT,
    comment: '操作后权限快照JSON',
  })
  after_permissions?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
