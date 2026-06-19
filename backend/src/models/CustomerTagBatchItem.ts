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
import { CustomerTagBatch } from './CustomerTagBatch';

@Table({
  tableName: 'biz_customer_tag_batch_item',
  comment: '客户标签批量操作明细表'
})
export class CustomerTagBatchItem extends Model<CustomerTagBatchItem> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @ForeignKey(() => CustomerTagBatch)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '批次ID'
  })
  batch_id!: string;

  @BelongsTo(() => CustomerTagBatch)
  batch?: CustomerTagBatch;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '行号'
  })
  row_index!: number;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '客户ID'
  })
  customer_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '客户编号'
  })
  customer_no?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '客户姓名'
  })
  customer_name?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '当前客户等级'
  })
  current_level?: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '当前标签，逗号分隔'
  })
  current_tags?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '处理结果 0未处理 1成功 2失败 3越权拦截 4违规拦截'
  })
  process_result!: number;

  @Column({
    type: DataType.STRING(1024),
    allowNull: true,
    comment: '处理结果描述'
  })
  process_message?: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '拦截原因'
  })
  block_reason?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态 1有效 0无效'
  })
  status!: number;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: CustomerTagBatchItem) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
