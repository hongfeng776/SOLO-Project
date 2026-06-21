import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum ProviderChangeType {
  CREATE = 'create',
  UPDATE = 'update',
  STATUS_CHANGE = 'status_change',
  COOPERATION_STATUS = 'cooperation_status',
  PARAM_UPDATE = 'param_update',
  MATCH_RULE = 'match_rule',
  LEVEL_CHANGE = 'level_change',
  ARCHIVE = 'archive',
}

@Table({
  tableName: 'logistics_provider_operation_logs',
  timestamps: false,
  indexes: [
    {
      name: 'idx_provider_id',
      fields: ['provider_id'],
    },
    {
      name: 'idx_change_type',
      fields: ['change_type'],
    },
    {
      name: 'idx_operator_id',
      fields: ['operator_id'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class LogisticsProviderOperationLog extends Model<LogisticsProviderOperationLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '物流服务商ID',
  })
  provider_id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '变更类型',
  })
  change_type!: string;

  @Column({
    type: DataType.STRING(200),
    comment: '变更内容标题',
  })
  change_title?: string;

  @Column({
    type: DataType.JSON,
    comment: '变更前数据',
  })
  before_data?: any;

  @Column({
    type: DataType.JSON,
    comment: '变更后数据',
  })
  after_data?: any;

  @Column({
    type: DataType.TEXT,
    comment: '变更详细说明',
  })
  change_detail?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '变更原因',
  })
  change_reason?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: '是否核心参数变更（需二次确认）',
  })
  is_core_change?: boolean;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '二次确认人ID',
  })
  confirmed_by?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '二次确认人名称',
  })
  confirmed_by_name?: string;

  @Column({
    type: DataType.DATE,
    comment: '二次确认时间',
  })
  confirmed_at?: Date;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '操作人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '操作人名称',
  })
  operator_name?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '操作人角色',
  })
  operator_role?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
