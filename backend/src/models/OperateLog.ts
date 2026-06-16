import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'operate_logs',
  timestamps: false,
  indexes: [
    {
      name: 'idx_operator',
      fields: ['operator_id', 'operator_type'],
    },
    {
      name: 'idx_module_action',
      fields: ['module', 'action'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class OperateLog extends Model<OperateLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '操作人类型：1-用户 2-管理员 3-系统',
  })
  operator_type?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '模块',
  })
  module?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '操作',
  })
  action?: string;

  @Column({
    type: DataType.STRING(10),
    comment: '请求方法：GET/POST/PUT/DELETE',
  })
  method?: string;

  @Column({
    type: DataType.JSON,
    comment: '请求参数JSON',
  })
  params_json?: object;

  @Column({
    type: DataType.JSON,
    comment: '响应结果JSON',
  })
  result_json?: object;

  @Column({
    type: DataType.STRING(50),
    comment: 'IP地址',
  })
  ip?: string;

  @Column({
    type: DataType.STRING(500),
    comment: 'User Agent',
  })
  user_agent?: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    comment: '耗时（毫秒）',
  })
  cost_ms?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：0-失败 1-成功',
  })
  status?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
