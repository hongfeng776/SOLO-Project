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
import { CustomerTag } from './CustomerTag';

@Table({
  tableName: 'biz_customer_tag_log',
  comment: '客户标签变更日志表'
})
export class CustomerTagLog extends Model<CustomerTagLog> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @ForeignKey(() => CustomerTag)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '标签记录ID'
  })
  tag_id!: string;

  @BelongsTo(() => CustomerTag)
  tag?: CustomerTag;

  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '客户ID'
  })
  customer_id!: string;

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
    type: DataType.STRING(64),
    allowNull: true,
    comment: '标签编码'
  })
  tag_code?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '标签名称'
  })
  tag_name?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '变更类型 1标签新增 2标签调整 3标签移除 4标签替换 5等级变更 6批量赋值 7系统自动更新 8锁定 9解锁'
  })
  change_type!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '变更类型名称'
  })
  change_type_name?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '变更前内容JSON'
  })
  before_content?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '变更后内容JSON'
  })
  after_content?: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '变更说明'
  })
  change_remark?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否越权操作 0否 1是(被拦截)'
  })
  is_unauthorized!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否违规操作 0否 1是(被拦截)'
  })
  is_violation!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '拦截原因'
  })
  block_reason?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作人ID'
  })
  operator_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作人姓名'
  })
  operator_name?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '操作机构ID'
  })
  operator_org_id?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '操作机构名称'
  })
  operator_org_name?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '操作时间'
  })
  operate_time?: Date;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '复核人ID'
  })
  reviewer_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '复核人姓名'
  })
  reviewer_name?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '复核时间'
  })
  review_time?: Date;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态 1有效 0无效'
  })
  status!: number;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: CustomerTagLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
