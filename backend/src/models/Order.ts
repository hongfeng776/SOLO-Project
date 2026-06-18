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

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '物流服务商ID',
  })
  logistics_provider_id?: number;

  @Column({
    type: DataType.DATE,
    comment: '发货时间',
  })
  shipped_at?: Date;

  @Column({
    type: DataType.STRING(50),
    comment: '收件人姓名',
  })
  signer_name?: string;

  @Column({
    type: DataType.DATE,
    comment: '签收时间',
  })
  signed_at?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '物流状态：0-待发货 1-已揽收 2-运输中 3-派送中 4-已签收 5-签收异常 6-已退回',
  })
  logistics_status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '物流异常标记：0-正常 1-地址异常 2-物流停滞 3-拒收 4-破损',
  })
  logistics_abnormal_flag?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '物流异常原因',
  })
  logistics_abnormal_reason?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '实际运费',
  })
  actual_freight?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '售后状态：0-无售后 1-售后中 2-售后完成 3-售后拒绝',
  })
  after_sale_status?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '售后申请次数',
  })
  after_sale_count?: number;

  @Column({
    type: DataType.DATE,
    comment: '售后时效截止时间',
  })
  after_sale_deadline?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '终止类型：0-未终止 1-主动取消 2-超时取消 3-违规取消 4-售后终止',
  })
  terminate_type?: number;

  @Column({
    type: DataType.DATE,
    comment: '终止时间',
  })
  terminated_at?: Date;

  @Column({
    type: DataType.STRING(500),
    comment: '终止原因',
  })
  terminate_reason?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '终止操作人ID',
  })
  terminate_operator_id?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '终止操作人姓名',
  })
  terminate_operator_name?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '退款状态：0-无退款 1-退款中 2-已退款 3-退款拒绝',
  })
  refund_status?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '退款金额',
  })
  refund_amount?: number;

  @Column({
    type: DataType.DATE,
    comment: '退款时间',
  })
  refund_time?: Date;

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
