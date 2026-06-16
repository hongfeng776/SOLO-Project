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
import { Customer } from './Customer';
import { User } from './User';
import { Organization } from './Organization';

@Table({
  tableName: 'biz_violation_record',
  comment: '违规台账记录表'
})
export class ViolationRecord extends Model<ViolationRecord> {
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
    comment: '违规编号'
  })
  violation_no!: string;

  @Index
  @ForeignKey(() => Customer)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '关联客户ID'
  })
  customer_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '关联客户编号'
  })
  customer_no?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '关联业务ID'
  })
  biz_id?: string;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '关联业务编号'
  })
  biz_no?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '业务类型 transaction交易 product产品 customer客户'
  })
  biz_type?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '违规类型 1资金异常 2可疑账户 3操作违规 4资料不全 5反洗钱 6监管违规 7其他'
  })
  violation_type?: number;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '违规等级 1轻微 2一般 3较重 4严重 5重大'
  })
  violation_level?: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '违规描述'
  })
  description?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '违规依据/规则编号'
  })
  rule_ref?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '处理状态 0待处理 1处理中 2已整改 3已驳回 4已关闭'
  })
  status!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '发现人ID'
  })
  discoverer_id?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '发现机构ID'
  })
  discoverer_org_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '处理人ID'
  })
  handler_id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '发现时间'
  })
  discover_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '处理时间'
  })
  handle_time?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '整改措施'
  })
  rectification?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '处理备注'
  })
  remark?: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => User, 'discoverer_id')
  discoverer?: User;

  @BelongsTo(() => User, 'handler_id')
  handler?: User;

  @BelongsTo(() => Organization, 'discoverer_org_id')
  discoverer_org?: Organization;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: ViolationRecord) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
