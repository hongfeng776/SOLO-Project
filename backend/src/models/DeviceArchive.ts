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
import { DeviceArchiveBatch } from './DeviceArchiveBatch';
import { DeviceArchiveTraceLog } from './DeviceArchiveTraceLog';

@Table({
  tableName: 'biz_device_archive',
  comment: '设备档案表'
})
export class DeviceArchive extends Model<DeviceArchive> {
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
    unique: true,
    comment: '档案编号'
  })
  archive_no!: string;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '设备SN码'
  })
  sn_code!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '设备类型 1ATM设备 2自助终端 3柜台设备 4移动展业设备'
  })
  device_type!: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '设备型号'
  })
  device_model!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '生产厂家'
  })
  manufacturer?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '生产日期'
  })
  production_date?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '采购日期'
  })
  procurement_date?: Date;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '采购批次'
  })
  purchase_batch?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '归属网点ID'
  })
  org_id?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '归属网点名称'
  })
  org_name?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '安装位置'
  })
  install_location?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '使用场景 counter柜面 lobby大堂 outdoor户外 mobile移动'
  })
  usage_scene?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '入网日期'
  })
  network_date?: Date;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '管控等级 1一般管控 2重点管控 3严格管控'
  })
  control_level!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 90,
    comment: '运维周期(天)'
  })
  operation_cycle_days!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '入网资质状态 0未提交 1已通过 2已过期'
  })
  qualification_status!: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '资质信息列表'
  })
  qualifications?: object;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否老旧设备 0否 1是'
  })
  is_old_device!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否重点运维对象 0否 1是'
  })
  is_key_operation!: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '状态 0待入库 1已入库 2已领用 3维护中 4已报废 5已退回'
  })
  status!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '建档人ID'
  })
  creator_id?: string;

  @ForeignKey(() => DeviceArchiveBatch)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '批次ID'
  })
  batch_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '批次编号'
  })
  batch_no?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => User, 'creator_id')
  creator?: User;

  @BelongsTo(() => DeviceArchiveBatch)
  batch?: DeviceArchiveBatch;

  @HasMany(() => DeviceArchiveTraceLog)
  traceLogs?: DeviceArchiveTraceLog[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: DeviceArchive) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
