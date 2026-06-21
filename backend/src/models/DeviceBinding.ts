import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  ForeignKey,
  BelongsTo,
  Index
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Customer } from './Customer';
import { User } from './User';
import { Account } from './Account';

export type DeviceType = 1 | 2 | 3 | 4;
export type BindingStatus = 0 | 1 | 2;

@Table({
  tableName: 'biz_device_binding',
  comment: '设备绑定表'
})
export class DeviceBinding extends Model<DeviceBinding> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: false,
    comment: '设备ID'
  })
  device_id!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '设备名称'
  })
  device_name?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '设备类型 1手机 2平板 3电脑 4其他'
  })
  device_type?: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '设备型号'
  })
  device_model?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '操作系统'
  })
  os?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '操作系统版本'
  })
  os_version?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: 'APP版本'
  })
  app_version?: string;

  @ForeignKey(() => User)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '用户ID'
  })
  user_id?: string;

  @ForeignKey(() => Customer)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '客户ID'
  })
  customer_id?: string;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '账户号'
  })
  account_no?: string;

  @ForeignKey(() => Account)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '账户ID'
  })
  account_id?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否可信设备'
  })
  is_trusted!: boolean;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '最后登录IP'
  })
  last_login_ip?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '最后登录时间'
  })
  last_login_time?: Date;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '最后登录位置'
  })
  last_login_location?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '绑定状态 0未绑定 1已绑定 2已解绑'
  })
  status!: BindingStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '绑定时间'
  })
  bind_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '解绑时间'
  })
  unbind_time?: Date;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => User)
  user?: User;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => Account)
  account?: Account;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: DeviceBinding) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
