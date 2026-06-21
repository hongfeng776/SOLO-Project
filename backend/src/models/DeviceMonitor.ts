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
  HasMany,
  Index
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './Organization';
import { User } from './User';
import { DeviceMonitorLog } from './DeviceMonitorLog';
import { DeviceFaultRecord } from './DeviceFaultRecord';

@Table({
  tableName: 'biz_device_monitor',
  comment: '设备监控主表'
})
export class DeviceMonitor extends Model<DeviceMonitor> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    comment: '设备档案号'
  })
  archive_no!: string;

  @Index
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
    comment: '设备SN码'
  })
  sn_code!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '设备类型'
  })
  device_type!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '设备型号'
  })
  device_model!: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
    comment: '生产厂家'
  })
  manufacturer?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '监控状态 1正常/2待机/3故障/4维护'
  })
  monitor_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '故障等级 1-4'
  })
  fault_level?: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '故障代码'
  })
  fault_code?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '数据连接状态 0中断/1正常/2延迟'
  })
  connect_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '监控策略 1定时轮询/2重点监控'
  })
  monitor_strategy!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '最后数据时间'
  })
  last_data_time?: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '数据延迟秒数'
  })
  data_delay_seconds?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    comment: 'CPU使用率'
  })
  cpu_usage?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    comment: '内存使用率'
  })
  memory_usage?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    comment: '磁盘使用率'
  })
  disk_usage?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    comment: '温度'
  })
  temperature?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '网速'
  })
  network_speed?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '运行天数'
  })
  run_duration_days?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '7日故障数'
  })
  fault_count_7d?: number;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '所属机构ID'
  })
  org_id?: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
    comment: '所属机构名称'
  })
  org_name?: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    comment: '安装位置'
  })
  install_location?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否重点设备 0否 1是'
  })
  is_key_device!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '最后故障时间'
  })
  last_fault_time?: Date;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '创建人ID'
  })
  creator_id?: string;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => User, 'creator_id')
  creator?: User;

  @HasMany(() => DeviceMonitorLog)
  monitorLogs?: DeviceMonitorLog[];

  @HasMany(() => DeviceFaultRecord)
  faultRecords?: DeviceFaultRecord[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: DeviceMonitor) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
