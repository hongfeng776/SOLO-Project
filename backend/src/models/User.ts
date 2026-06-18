import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class User extends Model<User> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名',
  })
  username!: string;

  @Column({
    type: DataType.STRING(50),
    comment: '昵称',
  })
  nickname?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '真实姓名',
  })
  real_name?: string;

  @Column({
    type: DataType.STRING(18),
    unique: true,
    comment: '身份证号',
  })
  id_card?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '性别：0-未知 1-男 2-女',
  })
  gender?: number;

  @Column({
    type: DataType.DATEONLY,
    comment: '出生日期',
  })
  birthday?: Date;

  @Column({
    type: DataType.STRING(20),
    unique: true,
    comment: '手机号',
  })
  phone?: string;

  @Column({
    type: DataType.STRING(100),
    unique: true,
    comment: '邮箱',
  })
  email?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '头像',
  })
  avatar?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态：1-正常 2-冻结 3-注销',
  })
  status?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '用户等级：1-普通 2-银卡 3-金卡 4-钻石 5-至尊',
  })
  level?: number;

  @Column({
    type: DataType.STRING(255),
    comment: '用户标签，多个用逗号分隔',
  })
  tags?: string;

  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0.00,
    comment: '累计消费金额',
  })
  total_amount?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '累计订单数',
  })
  total_orders?: number;

  @Column({
    type: DataType.STRING(50),
    comment: '注册渠道',
  })
  register_channel?: string;

  @Column({
    type: DataType.STRING(45),
    comment: '注册IP',
  })
  register_ip?: string;

  @Column({
    type: DataType.DATE,
    comment: '最后登录时间',
  })
  last_login_time?: Date;

  @Column({
    type: DataType.STRING(45),
    comment: '最后登录IP',
  })
  last_login_ip?: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '用户积分',
  })
  points?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '累计支付积分',
  })
  total_pay_points?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 3,
    comment: '信用等级：1-差 2-一般 3-良好 4-优秀 5-卓越',
  })
  credit_level?: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 100,
    comment: '信用分',
  })
  credit_score?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '售后申请次数',
  })
  after_sale_count?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '违规售后次数',
  })
  violation_count?: number;

  @Column({
    type: DataType.TEXT,
    comment: '用户备注',
  })
  remark?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '冻结原因',
  })
  frozen_reason?: string;

  @Column({
    type: DataType.DATE,
    comment: '冻结时间',
  })
  frozen_time?: Date;

  @Column({
    type: DataType.DATE,
    comment: '注销时间',
  })
  cancel_time?: Date;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '风控预警：0-无 1-有',
  })
  risk_warning?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '风险等级：0-低 1-中 2-高',
  })
  risk_level?: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 100,
    comment: '合规分数',
  })
  compliance_score?: number;

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
