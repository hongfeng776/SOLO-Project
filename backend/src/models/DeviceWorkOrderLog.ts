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
import { DeviceWorkOrder } from './DeviceWorkOrder';

@Table({
  tableName: 'biz_device_work_order_log',
  comment: '工单操作日志表'
})
export class DeviceWorkOrderLog extends Model<DeviceWorkOrderLog> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @ForeignKey(() => DeviceWorkOrder)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '工单ID'
  })
  order_id!: string;

  @Index
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '工单编号'
  })
  order_no!: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '日志类型(1创建/2派单/3开始处理/4提交验收/5验收通过/6验收不通过/7取消)'
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
    type: DataType.JSON,
    allowNull: true,
    comment: '操作详情(JSON)'
  })
  operation_detail?: object;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '操作人ID'
  })
  operator_id!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '操作人姓名'
  })
  operator_name!: string;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
    comment: '操作备注'
  })
  operation_remark?: string;

  @BelongsTo(() => DeviceWorkOrder)
  workOrder?: DeviceWorkOrder;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: DeviceWorkOrderLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
