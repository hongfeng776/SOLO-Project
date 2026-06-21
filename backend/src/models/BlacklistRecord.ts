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
  BelongsTo,
  HasMany
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Customer } from './Customer';
import { User } from './User';
import { Organization } from './Organization';
import { BlacklistBatch } from './BlacklistBatch';
import { BlacklistTraceLog } from './BlacklistTraceLog';
import dayjs from 'dayjs';

@Table({
  tableName: 'biz_blacklist_record',
  comment: '黑名单记录表',
  paranoid: true
})
export class BlacklistRecord extends Model<BlacklistRecord> {
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
    comment: '黑名单编号'
  })
  blacklist_no!: string;

  @Index
  @ForeignKey(() => Customer)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '关联客户ID'
  })
  customer_id!: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '关联客户编号'
  })
  customer_no!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '客户名称'
  })
  customer_name!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '证件号码'
  })
  id_card_no?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '客户类型 1个人 2企业'
  })
  customer_type?: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '违规类型 1资金异常 2可疑账户 3操作违规 4资料不全 5反洗钱 6监管违规 7信用违约 8欺诈 9其他'
  })
  violation_type!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '违规等级 1轻微 2一般 3较重 4严重 5重大'
  })
  violation_level!: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    comment: '黑名单等级 1临时 2短期 3长期 4永久'
  })
  grade!: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '状态 0待审核 1生效中 2复核中 3已到期 4已移除 5已驳回'
  })
  status!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: '违规描述'
  })
  description!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '关联违规记录ID列表'
  })
  violation_record_ids?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '证据项列表'
  })
  evidence_items?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '业务限制配置'
  })
  business_restrictions?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '生效日期'
  })
  effective_date!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '到期日期'
  })
  expire_date?: Date;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否自动提醒 0否 1是'
  })
  auto_remind!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '复核次数'
  })
  review_count!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '上次复核日期'
  })
  last_review_date?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '下次复核日期'
  })
  next_review_date?: Date;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '锁定账户信息'
  })
  locked_accounts?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '锁定业务信息'
  })
  locked_businesses?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '创建人ID'
  })
  creator_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '审核人ID'
  })
  reviewer_id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '审核时间'
  })
  review_time?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '审核意见'
  })
  review_opinion?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '移除原因'
  })
  remove_reason?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '移除时间'
  })
  remove_time?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '移除人ID'
  })
  remover_id?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '归属机构ID'
  })
  org_id?: string;

  @ForeignKey(() => BlacklistBatch)
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
    type: DataType.TINYINT,
    allowNull: true,
    comment: '是否合规 0否 1是'
  })
  is_compliant?: number;

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

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => User, 'creator_id')
  creator?: User;

  @BelongsTo(() => User, 'reviewer_id')
  reviewer?: User;

  @BelongsTo(() => User, 'remover_id')
  remover?: User;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @BelongsTo(() => BlacklistBatch)
  batch?: BlacklistBatch;

  @HasMany(() => BlacklistTraceLog)
  trace_logs?: BlacklistTraceLog[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: BlacklistRecord) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
    if (!instance.effective_date) {
      instance.effective_date = dayjs().toDate();
    }
  }
}
