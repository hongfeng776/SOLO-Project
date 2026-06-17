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
import { User } from './User';

@Table({
  tableName: 'biz_status_change_log',
  comment: '开户状态变更日志表'
})
export class StatusChangeLog extends Model<StatusChangeLog> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '开户类型 1=个人 2=对公'
  })
  opening_type!: number;

  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '开户申请ID'
  })
  opening_id!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '开户申请流水号'
  })
  opening_no!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '变更前状态'
  })
  status_before!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '变更前状态文本'
  })
  status_before_text!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '变更后状态'
  })
  status_after!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '变更后状态文本'
  })
  status_after_text!: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '操作类型 submit/review_approve/review_reject/cancel/void/resubmit/supplement/open_account'
  })
  operation_type!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '操作类型文本'
  })
  operation_type_text!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '操作人ID'
  })
  operator_id!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '操作人姓名'
  })
  operator_name!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作人角色'
  })
  operator_role?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '合规校验结果 0=违规 1=合规 2=越权'
  })
  compliance_check!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '违规/预警详情'
  })
  violation_details?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '联动同步结果（JSON）'
  })
  sync_result?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作节点（业务步骤）'
  })
  operation_node?: string;

  @BelongsTo(() => User)
  operator?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: StatusChangeLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
