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
import { DeviceWorkOrderLog } from './DeviceWorkOrderLog';

@Table({
  tableName: 'biz_device_work_order',
  comment: '运维工单主表'
})
export class DeviceWorkOrder extends Model<DeviceWorkOrder> {
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
    comment: '工单编号（WO+时间戳+序号）'
  })
  order_no!: string;

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
    comment: '工单类型(1日常保养/2故障维修/3定期检修/4报废核验)'
  })
  order_type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '运维等级(1-4)'
  })
  maintenance_level!: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '状态(0草稿/1待派单/2已派单/3处理中/4待验收/5已完成/6已取消)'
  })
  status!: number;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
    comment: '故障描述'
  })
  fault_description?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '故障代码'
  })
  fault_code?: string;

  @Column({
    type: DataType.STRING(2000),
    allowNull: true,
    comment: '运维内容'
  })
  maintenance_content?: string;

  @Column({
    type: DataType.STRING(2000),
    allowNull: true,
    comment: '运维结果'
  })
  maintenance_result?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '验收状态(0未验收/1通过/2不通过/3验收中)'
  })
  acceptance_status!: number;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
    comment: '验收备注'
  })
  acceptance_remark?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '验收时间'
  })
  acceptance_time?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '验收人ID'
  })
  acceptance_by?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: '验收人姓名'
  })
  acceptance_by_name?: string;

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
    type: DataType.STRING(500),
    allowNull: true,
    comment: '安装位置'
  })
  install_location?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 2,
    comment: '优先级(1低/2中/3高/4紧急)'
  })
  priority!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '预计完成时间'
  })
  expected_finish_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '实际完成时间'
  })
  actual_finish_time?: Date;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
    comment: '预估费用'
  })
  cost_estimate?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
    comment: '实际费用'
  })
  cost_actual?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否逾期 0否 1是'
  })
  is_overdue!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '保修状态(0不在保/1在保/2即将到期)'
  })
  warranty_status!: number;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '使用配件(JSON格式)'
  })
  used_parts?: object;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '运维工时(小时)'
  })
  maintenance_hours?: number;

  @BelongsTo(() => User, 'creator_id')
  creator?: User;

  @BelongsTo(() => User, 'assignee_id')
  assignee?: User;

  @BelongsTo(() => User, 'acceptance_by')
  acceptanceUser?: User;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @HasMany(() => DeviceWorkOrderLog)
  logs?: DeviceWorkOrderLog[];

  @BeforeValidate
  @BeforeCreate
  static generateIdAndOrderNo(instance: DeviceWorkOrder) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
    if (!instance.order_no) {
      const timestamp = new Date().getTime().toString();
      const random = Math.floor(1000 + Math.random() * 9000).toString();
      instance.order_no = `WO${timestamp}${random}`;
    }
  }
}
