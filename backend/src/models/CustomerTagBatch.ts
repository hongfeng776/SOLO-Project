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
import { Organization } from './Organization';
import { CustomerTagBatchItem } from './CustomerTagBatchItem';

@Table({
  tableName: 'biz_customer_tag_batch',
  comment: '客户标签批量操作批次表'
})
export class CustomerTagBatch extends Model<CustomerTagBatch> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    comment: '批次编号'
  })
  batch_no!: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '归属机构ID'
  })
  org_id?: string;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '批次名称'
  })
  batch_name?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '操作类型 1批量新增 2批量替换 3批量移除 4批量调整等级'
  })
  operation_type!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '目标标签编码'
  })
  target_tag_code?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '目标标签名称'
  })
  target_tag_name?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总记录数'
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
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '越权拦截数'
  })
  unauthorized_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '违规拦截数'
  })
  violation_count!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '批次状态 0待处理 1处理中 2已完成 3部分完成 4已取消'
  })
  status!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '失败原因'
  })
  fail_reason?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '创建人ID'
  })
  creator_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '创建人姓名'
  })
  creator_name?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '创建时间'
  })
  create_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '完成时间'
  })
  finish_time?: Date;

  @HasMany(() => CustomerTagBatchItem, { foreignKey: 'batch_id', constraints: false })
  items?: CustomerTagBatchItem[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: CustomerTagBatch) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
