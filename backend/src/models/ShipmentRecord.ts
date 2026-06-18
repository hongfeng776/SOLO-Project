import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'shipment_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uk_shipment_no',
      fields: ['shipment_no'],
      unique: true,
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
      name: 'idx_tracking_no',
      fields: ['tracking_no'],
    },
    {
      name: 'idx_provider_id',
      fields: ['provider_id'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'idx_created_at',
      fields: ['created_at'],
    },
  ],
})
export class ShipmentRecord extends Model<ShipmentRecord> {
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
    comment: '订单号',
  })
  order_no!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '物流服务商ID',
  })
  provider_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '物流服务商名称',
  })
  provider_name!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '物流单号',
  })
  tracking_no!: string;

  @Column({
    type: DataType.STRING(200),
    comment: '发货地址',
  })
  from_address?: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    comment: '收货地址',
  })
  to_address!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '收货人姓名',
  })
  receiver_name!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '收货人电话',
  })
  receiver_phone!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '运费',
  })
  freight?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '发货状态：0-待发货 1-已发货 2-运输中 3-已签收 4-已拒收 5-已退回',
  })
  status?: number;

  @Column({
    type: DataType.DATE,
    comment: '发货时间',
  })
  ship_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '签收时间',
  })
  sign_time?: Date;

  @Column({
    type: DataType.STRING(50),
    comment: '签收人',
  })
  signer?: string;

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
    type: DataType.STRING(1000),
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
