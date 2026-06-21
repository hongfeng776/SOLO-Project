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

let faultNoCounter = 0;

@Table({
  tableName: 'biz_device_fault_record',
  comment: '设备故障记录表'
})
export class DeviceFaultRecord extends Model<DeviceFaultRecord> {
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
    comment: '故障编号'
  })
  fault_no!: string;

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

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
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
    type: DataType.TINYINT,
    allowNull: false,
    comment: '故障等级 1-4'
  })
  fault_level!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '故障代码'
  })
  fault_code!: string;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
    comment: '故障描述'
  })
  fault_description?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '故障状态 0待处理/1处理中/2已修复/3已忽略'
  })
  fault_status!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '发生时间'
  })
  occur_time!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '恢复时间'
  })
  recover_time?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '处理人ID'
  })
  handler_id?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: '处理人姓名'
  })
  handler_name?: string;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
    comment: '处理备注'
  })
  handle_remark?: string;

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
    type: DataType.INTEGER,
    allowNull: true,
    comment: '持续分钟数'
  })
  duration_minutes?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否自动恢复 0否 1是'
  })
  is_auto_recovered!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否误报 0否 1是'
  })
  is_false_alarm!: number;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => DeviceMonitor)
  device?: DeviceMonitor;

  @BelongsTo(() => User, 'handler_id')
  handler?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: DeviceFaultRecord) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
    if (!instance.fault_no) {
      const timestamp = Date.now().toString();
      faultNoCounter = (faultNoCounter + 1) % 10000;
      const seq = faultNoCounter.toString().padStart(4, '0');
      instance.fault_no = `F${timestamp}${seq}`;
    }
  }
}
