import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'marketings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Marketing extends Model<Marketing> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '活动名称',
  })
  name!: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    comment: '活动类型：1-折扣 2-满减 3-优惠券 4-拼团',
  })
  type?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '状态：0-未开始 1-进行中 2-已结束 3-已下架',
  })
  status?: number;

  @Column({
    type: DataType.DATE,
    comment: '开始时间',
  })
  start_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '结束时间',
  })
  end_time?: Date;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '折扣率/减免金额',
  })
  discount?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '适用类目ID，多个用逗号分隔',
  })
  category_ids?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '适用商家ID，多个用逗号分隔',
  })
  merchant_ids?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '优惠类型：1-满减 2-折扣 3-优惠券',
  })
  discount_type?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: '最低消费金额',
  })
  min_amount?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '最大优惠金额',
  })
  max_discount?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    comment: '优惠值：金额或折扣率',
  })
  discount_value?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '发放总数量',
  })
  total_count?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '已使用数量',
  })
  used_count?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 1,
    comment: '每人限领数量',
  })
  per_user_limit?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '审核状态：0-待审核 1-已通过 2-已拒绝',
  })
  audit_status?: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '审核人ID',
  })
  audit_user_id?: number;

  @Column({
    type: DataType.DATE,
    comment: '审核时间',
  })
  audit_time?: Date;

  @Column({
    type: DataType.STRING(500),
    comment: '审核备注',
  })
  audit_remark?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '创建人ID',
  })
  create_user_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否违规：0-否 1-是',
  })
  is_violation?: number;

  @Column({
    type: DataType.STRING(500),
    comment: '违规说明',
  })
  violation_remark?: string;

  @Column({
    type: DataType.TEXT,
    comment: '活动描述',
  })
  description?: string;

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
