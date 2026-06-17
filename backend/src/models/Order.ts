import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Order extends Model<Order> {
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
    comment: '订单号',
  })
  order_no!: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '订单总金额',
  })
  total_amount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '实付金额',
  })
  pay_amount!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '商家ID',
  })
  merchant_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '订单状态：0-待支付 1-待发货 2-已发货 3-已完成 4-已取消',
  })
  status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '支付状态：0-未支付 1-已支付',
  })
  pay_status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '支付方式：0-未知 1-微信支付 2-支付宝 3-银行卡',
  })
  pay_type?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '收货人姓名',
  })
  receiver_name?: string;

  @Column({
    type: DataType.STRING(20),
    comment: '收货人电话',
  })
  receiver_phone?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '收货省份',
  })
  receiver_province?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '收货城市',
  })
  receiver_city?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '收货区县',
  })
  receiver_district?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '详细地址',
  })
  receiver_address?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '运费金额',
  })
  freight_amount?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '优惠金额',
  })
  discount_amount?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '订单备注',
  })
  remark?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否异常：0-否 1-是',
  })
  is_exception?: number;

  @Column({
    type: DataType.TEXT,
    comment: '异常原因',
  })
  exception_reason?: string;

  @Column({
    type: DataType.JSON,
    comment: '异常字段列表',
  })
  exception_fields?: any;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否已归档：0-否 1-是',
  })
  is_archived?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '物流公司',
  })
  logistics_company?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '物流单号',
  })
  logistics_no?: string;

  @Column({
    type: DataType.DATE,
    comment: '支付时间',
  })
  pay_time?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '发货状态：0-未发货 1-已发货',
  })
  shipping_status?: number;

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
