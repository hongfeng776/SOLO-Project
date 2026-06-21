import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  Index,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { DeviceArchive } from './DeviceArchive';
import { User } from './User';

@Table({
  tableName: 'biz_device_archive_trace_log',
  comment: '设备档案溯源日志表'
})
export class DeviceArchiveTraceLog extends Model<DeviceArchiveTraceLog> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @ForeignKey(() => DeviceArchive)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '设备档案ID'
  })
  device_id!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '档案编号'
  })
  archive_no!: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '溯源类型 1采购登记 2入网登记 3建档 4领用 5归还 6维护 7报废 8资质变更 9批量处理 10合规校验'
  })
  trace_type!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '操作人ID'
  })
  operator_id?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '操作详情'
  })
  operation_detail?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '操作前状态'
  })
  before_status?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '操作后状态'
  })
  after_status?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '操作前管控等级'
  })
  before_control_level?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '操作后管控等级'
  })
  after_control_level?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否合规 0否 1是'
  })
  is_compliant!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '违规类型 1重复建档 2虚假设备 3资质过期 4型号不合规 5其他'
  })
  violation_type?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '违规详情'
  })
  violation_details?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => DeviceArchive)
  device_archive?: DeviceArchive;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: DeviceArchiveTraceLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
