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
import { DeviceMonitor } from './DeviceMonitor';
import { User } from './User';

@Table({
  tableName: 'biz_device_monitor_log',
  comment: '设备监控日志表'
})
export class DeviceMonitorLog extends Model<DeviceMonitorLog> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @ForeignKey(() => DeviceMonitor)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '设备ID'
  })
  device_id!: string;

  @Index
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '设备档案号'
  })
  archive_no!: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '日志类型 1状态变更/2故障上报/3数据接入/4数据中断/5参数异常/6运维操作/7预警通知/8合规校验'
  })
  log_type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '变更前状态'
  })
  before_status?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '变更后状态'
  })
  after_status?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '故障等级'
  })
  fault_level?: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '故障代码'
  })
  fault_code?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '操作详情(JSON)'
  })
  operation_detail?: object;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '操作人ID'
  })
  operator_id?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: '操作人姓名'
  })
  operator_name?: string;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
    comment: '操作备注'
  })
  operation_remark?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否告警 0否 1是'
  })
  is_alert!: number;

  @BelongsTo(() => DeviceMonitor)
  device?: DeviceMonitor;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: DeviceMonitorLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
