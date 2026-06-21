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
import { BlacklistRecord } from './BlacklistRecord';
import { User } from './User';

@Table({
  tableName: 'biz_blacklist_trace_log',
  comment: '黑名单溯源日志表'
})
export class BlacklistTraceLog extends Model<BlacklistTraceLog> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @ForeignKey(() => BlacklistRecord)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '关联黑名单记录ID'
  })
  blacklist_id!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '黑名单编号'
  })
  blacklist_no!: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '溯源类型 1加入黑名单 2审核通过 3审核驳回 4移除黑名单 5延期 6等级变更 7合规校验 8批量处理'
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
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作人名称'
  })
  operator_name?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '操作详情'
  })
  operation_detail?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '变更前等级'
  })
  before_grade?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '变更后等级'
  })
  after_grade?: number;

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
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否合规 0否 1是'
  })
  is_compliant!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '违规类型'
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

  @BelongsTo(() => BlacklistRecord)
  blacklist?: BlacklistRecord;

  @BelongsTo(() => User, 'operator_id')
  operator?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: BlacklistTraceLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
