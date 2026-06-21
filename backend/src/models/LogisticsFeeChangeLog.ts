import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

export enum FeeChangeType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ENABLE = 'enable',
  DISABLE = 'disable',
}

@Table({
  tableName: 'logistics_fee_change_logs',
  timestamps: false,
  indexes: [
    {
      name: 'idx_provider_id',
      fields: ['provider_id'],
    },
    {
      name: 'idx_fee_standard_id',
      fields: ['fee_standard_id'],
    },
    {
      name: 'idx_change_type',
      fields: ['change_type'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class LogisticsFeeChangeLog extends Model<LogisticsFeeChangeLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    comment: '变更记录单号',
  })
  log_no?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '物流服务商ID',
  })
  provider_id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '资费标准ID',
  })
  fee_standard_id?: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '变更类型：create-新增 update-修改 delete-删除 enable-启用 disable-禁用',
  })
  change_type!: string;

  @Column({
    type: DataType.STRING(200),
    comment: '资费方案名称',
  })
  fee_name?: string;

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
    comment: '变更说明',
  })
  change_reason?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: '是否涉及违规资费配置',
  })
  is_violation?: boolean;

  @Column({
    type: DataType.STRING(500),
    comment: '违规说明',
  })
  violation_remark?: string;

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
    type: DataType.BIGINT.UNSIGNED,
    comment: '二次确认人ID（核心参数修改）',
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

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
