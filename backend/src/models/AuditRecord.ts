import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User';
import { Organization } from './Organization';

@Table({
  tableName: 'biz_audit_record',
  comment: '审核记录表'
})
export class AuditRecord extends Model<AuditRecord> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '业务类型'
  })
  biz_type!: string;

  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '业务ID'
  })
  biz_id!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '业务编号'
  })
  biz_no!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '审核类型 1普通审核 2金额审核 3特殊审核'
  })
  type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 1,
    comment: '审核级别 1一级 2二级 3三级'
  })
  level?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '审核状态 0待审核 1审核中 2已完成 3已取消'
  })
  status!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '提交人ID'
  })
  submitter_id?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '提交机构ID'
  })
  submitter_org_id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '提交时间'
  })
  submit_time?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '审核人ID'
  })
  auditor_id?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '审核机构ID'
  })
  auditor_org_id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '审核时间'
  })
  audit_time?: Date;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '审核结果 1通过 2拒绝'
  })
  result?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '审核意见'
  })
  audit_remark?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '当前节点'
  })
  current_node?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '下一审核人ID'
  })
  next_auditor_id?: string;

  @BelongsTo(() => User, 'submitter_id')
  submitter?: User;

  @BelongsTo(() => User, 'auditor_id')
  auditor?: User;

  @BeforeCreate
  static generateId(instance: AuditRecord) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}