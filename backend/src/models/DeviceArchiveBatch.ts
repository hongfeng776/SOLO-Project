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
import { User } from './User';
import { Organization } from './Organization';

@Table({
  tableName: 'biz_device_archive_batch',
  comment: '设备档案批次表',
  paranoid: true
})
export class DeviceArchiveBatch extends Model<DeviceArchiveBatch> {
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
    comment: '批次编号'
  })
  batch_no!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '批次名称'
  })
  batch_name!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '批次类型 1批量建档 2批量更新 3批量资质校验'
  })
  batch_type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '状态 0待执行 1执行中 2已完成 3执行失败'
  })
  status!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总数'
  })
  total_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '成功数'
  })
  success_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '失败数'
  })
  fail_count!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '设备类型'
  })
  device_type?: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '采购批次'
  })
  purchase_batch?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '筛选条件'
  })
  filter_condition?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '处理原因'
  })
  handle_reason?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '执行开始时间'
  })
  execute_start_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '执行结束时间'
  })
  execute_end_time?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '执行日志'
  })
  execute_log?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '创建人ID'
  })
  creator_id?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '归属机构ID'
  })
  org_id?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => User, 'creator_id')
  creator?: User;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: DeviceArchiveBatch) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
