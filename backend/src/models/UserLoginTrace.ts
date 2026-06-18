import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'user_login_traces',
  timestamps: false,
})
export class UserLoginTrace extends Model<UserLoginTrace> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT.UNSIGNED,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '用户ID',
  })
  user_id!: number;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '登录类型：1-正常登录 2-异常登录 3-退出登录',
  })
  login_type?: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    comment: '登录时间',
  })
  login_time!: Date;

  @Column({
    type: DataType.STRING(45),
    comment: '登录IP',
  })
  login_ip?: string;

  @Column({
    type: DataType.STRING(100),
    comment: '登录地点',
  })
  login_location?: string;

  @Column({
    type: DataType.STRING(50),
    comment: '设备类型',
  })
  device_type?: string;

  @Column({
    type: DataType.STRING(255),
    comment: '设备信息',
  })
  device_info?: string;

  @Column({
    type: DataType.STRING(500),
    comment: '浏览器UA',
  })
  user_agent?: string;

  @Column({
    type: DataType.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '登录状态：0-失败 1-成功',
  })
  login_status?: number;

  @Column({
    type: DataType.STRING(255),
    comment: '失败原因',
  })
  fail_reason?: string;
}
