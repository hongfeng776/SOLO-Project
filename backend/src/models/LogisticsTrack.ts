import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'logistics_tracks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uk_track_no',
      fields: ['track_no'],
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
      name: 'idx_logistics_provider_id',
      fields: ['logistics_provider_id'],
    },
    {
      name: 'idx_logistics_no',
      fields: ['logistics_no'],
    },
    {
      name: 'idx_track_status',
      fields: ['track_status'],
    },
    {
      name: 'idx_track_time',
      fields: ['track_time'],
    },
    {
      name: 'idx_is_abnormal',
      fields: ['is_abnormal'],
    },
    {
      name: 'idx_source',
      fields: ['source'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class LogisticsTrack extends Model<LogisticsTrack> {
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
    comment: '轨迹编号',
  })
  track_no!: string;

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
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '物流服务商ID',
  })
  logistics_provider_id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '物流单号',
  })
  logistics_no!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '轨迹状态：1-已揽收 2-运输中 3-派送中 4-已签收 5-异常 6-退回',
  })
  track_status!: number;

  @Column({
    type: DataType.STRING(255),
    comment: '当前位置',
  })
  location?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '省份',
  })
  province?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '城市',
  })
  city?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '区县',
  })
  district?: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    comment: '轨迹描述',
  })
  description!: string;

  @Column({
    type: DataType.STRING(100),
    comment: '操作人/快递员',
  })
  operator?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '联系电话',
  })
  operator_phone?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '轨迹时间',
  })
  track_time!: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否异常：0-否 1-是',
  })
  is_abnormal?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '异常类型',
  })
  abnormal_type?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '异常描述',
  })
  abnormal_desc?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '数据来源：1-系统录入 2-API同步 3-手动更新',
  })
  source?: number;

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
