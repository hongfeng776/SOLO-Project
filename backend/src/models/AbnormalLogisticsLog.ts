import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'abnormal_logistics_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uk_log_no',
      fields: ['log_no'],
      unique: true,
    },
    {
      name: 'idx_shipment_id',
      fields: ['shipment_id'],
    },
    {
      name: 'idx_shipment_no',
      fields: ['shipment_no'],
    },
    {
      name: 'idx_order_id',
      fields: ['order_id'],
    },
    {
      name: 'idx_order_no',
      fields: ['order_no'],
    },
    {
      name: 'idx_logistics_no',
      fields: ['logistics_no'],
    },
    {
      name: 'idx_abnormal_type',
      fields: ['abnormal_type'],
    },
    {
      name: 'idx_abnormal_level',
      fields: ['abnormal_level'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_operator_id',
      fields: ['operator_id'],
    },
    {
      name: 'idx_reported_at',
      fields: ['reported_at'],
    },
    {
      name: 'idx_handled_at',
      fields: ['handled_at'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class AbnormalLogisticsLog extends Model<AbnormalLogisticsLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    comment: '日志编号',
  })
  log_no!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '发货记录ID',
  })
  shipment_id!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '发货单号',
  })
  shipment_no!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '订单ID',
  })
  order_id!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '订单编号',
  })
  order_no!: string;

  @Column({
    type: DataType.STRING(50),
    comment: '物流单号',
  })
  logistics_no?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '异常类型：1-地址异常 2-物流停滞 3-拒收 4-破损 5-丢件',
  })
  abnormal_type!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '异常等级：1-轻微 2-一般 3-严重',
  })
  abnormal_level?: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    comment: '异常描述',
  })
  abnormal_desc!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '处理状态：0-待处理 1-处理中 2-已处理 3-已关闭',
  })
  status?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '处理结果',
  })
  handle_result?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '处理方式',
  })
  handle_method?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '处理人ID',
  })
  operator_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '处理人姓名',
  })
  operator_name?: string;

  @Column({
    type: DataType.DATE,
    comment: '上报时间',
  })
  reported_at?: Date;

  @Column({
    type: DataType.DATE,
    comment: '处理完成时间',
  })
  handled_at?: Date;

  @Column({
    type: DataType.DATE,
    comment: '关闭时间',
  })
  closed_at?: Date;

  @Column({
    type: DataType.STRING(500),
    comment: '备注',
  })
  remark?: string;

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
