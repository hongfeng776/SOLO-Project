import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

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
    type: DataType.BIGINT.UNSIGNED,
    comment: '权限ID',
  })
  permission_id?: number;

  @Column({
    type: DataType.STRING(100),
    comment: '权限编码',
  })
  permission_code?: string;

  @Column({
    type: DataType.STRING(30),
    allowNull: false,
    comment: '操作类型：grant-授予 revoke-回收 batch_grant-批量授予 batch_revoke-批量回收 reset-重置 status_change-状态变更',
  })
  operation_type!: string;

  @Column({
    type: DataType.STRING(30),
    defaultValue: 'single',
    comment: '操作范围：single-单用户 batch-批量 global-全局',
  })
  operation_scope?: string;

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
    comment: '操作人角色',
  })
  operator_role?: string;

  @Column({
    type: DataType.DATE,
    comment: '操作时间',
  })
  operate_time?: Date;

  @Column({
    type: DataType.STRING(45),
    comment: '操作IP',
  })
  operate_ip?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '操作原因',
  })
  reason?: string;

  @Column({
    type: DataType.TEXT,
    comment: '变更前权限列表JSON',
  })
  before_permissions?: string;

  @Column({
    type: DataType.TEXT,
    comment: '变更后权限列表JSON',
  })
  after_permissions?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '备注',
  })
  remark?: string;
}
