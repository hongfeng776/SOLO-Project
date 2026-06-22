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
import { Organization } from './Organization';
import { User } from './User';

@Table({
  tableName: 'biz_device_maintenance_task',
  comment: '批量运维任务表'
})
export class DeviceMaintenanceTask extends Model<DeviceMaintenanceTask> {
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
    comment: '任务编号(MT+时间戳+序号)'
  })
  task_no!: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    comment: '任务名称'
  })
  task_name!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '工单类型'
  })
  order_type!: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '任务状态(0草稿/1待执行/2执行中/3已完成/4已取消)'
  })
  task_status!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '设备总数'
  })
  total_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '已完成数量'
  })
  completed_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '待处理数量'
  })
  pending_count!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '执行进度(百分比)'
  })
  progress!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '开始日期'
  })
  start_date!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '结束日期'
  })
  end_date!: Date;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 2,
    comment: '优先级(1低/2中/3高/4紧急)'
  })
  priority!: number;

  @ForeignKey(() => User)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '指派人ID'
  })
  assignee_id?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: '指派人姓名'
  })
  assignee_name?: string;

  @ForeignKey(() => User)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '创建人ID'
  })
  creator_id!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '创建人姓名'
  })
  creator_name!: string;

  @ForeignKey(() => Organization)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '机构ID'
  })
  org_id?: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
    comment: '机构名称'
  })
  org_name?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否筛选老旧设备 0否 1是'
  })
  is_old_device_filter!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '最小故障频率'
  })
  fault_frequency_min?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '最小使用年限'
  })
  min_usage_years?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '最大使用年限'
  })
  max_usage_years?: number;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '设备ID列表(JSON格式)'
  })
  device_list?: object;

  @BelongsTo(() => User, 'creator_id')
  creator?: User;

  @BelongsTo(() => User, 'assignee_id')
  assignee?: User;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BeforeValidate
  @BeforeCreate
  static generateIdAndTaskNo(instance: DeviceMaintenanceTask) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
    if (!instance.task_no) {
      const timestamp = new Date().getTime().toString();
      const random = Math.floor(1000 + Math.random() * 9000).toString();
      instance.task_no = `MT${timestamp}${random}`;
    }
  }
}
