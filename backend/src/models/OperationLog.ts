import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './Organization';

@Table({
  tableName: 'sys_operation_log',
  comment: '操作日志表'
})
export class OperationLog extends Model<OperationLog> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '用户ID'
  })
  user_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '用户名'
  })
  username?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '所属机构ID'
  })
  org_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '模块名称'
  })
  module!: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '操作类型'
  })
  operation!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '方法名'
  })
  method?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '请求参数'
  })
  request_params?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '响应结果'
  })
  response_result?: string;

  @Column({
    type: DataType.STRING(16),
    allowNull: true,
    comment: '请求方法'
  })
  request_method?: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    comment: '请求URL'
  })
  request_url?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: 'IP地址'
  })
  ip?: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    comment: '用户代理'
  })
  user_agent?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '执行状态 0失败 1成功'
  })
  status!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '错误信息'
  })
  error_msg?: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    comment: '耗时(毫秒)'
  })
  cost_time?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 4,
    comment: '日志类型 1登录日志 2操作日志 3异常日志 4其他'
  })
  log_type!: number;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: OperationLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}