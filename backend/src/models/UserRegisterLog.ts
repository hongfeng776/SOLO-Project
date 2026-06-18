import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'user_register_logs',
  timestamps: false,
})
export class UserRegisterLog extends Model<UserRegisterLog> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    unique: true,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '用户名',
  })
  username!: string;

  @Column({
    type: DataType.STRING(20),
    comment: '手机号',
  })
  phone?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '邮箱',
  })
  email?: string;

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
    type: DataType.STRING(100),
    comment: '注册地点',
  })
  register_location?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '设备类型',
  })
  device_type?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '浏览器UA',
  })
  user_agent?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '邀请码',
  })
  invite_code?: string;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    comment: '邀请人ID',
  })
  inviter_id?: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '审核状态：0-待审核 1-已通过 2-已拒绝',
  })
  audit_status?: number;

  @Column({
    type: DataType.STRING(255),
    comment: '审核备注',
  })
  audit_remark?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
