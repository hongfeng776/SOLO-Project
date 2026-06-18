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
import { CustomerProfile } from './CustomerProfile';

@Table({
  tableName: 'biz_customer_profile_log',
  comment: '客户档案变更日志表'
})
export class CustomerProfileLog extends Model<CustomerProfileLog> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '主键ID'
  })
  id!: string;

  @Index
  @ForeignKey(() => CustomerProfile)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    comment: '客户档案ID'
  })
  profile_id!: string;

  @BelongsTo(() => CustomerProfile)
  profile?: CustomerProfile;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '客户档案编号'
  })
  profile_no?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '变更类型 1建档 2信息变更 3等级变更 4销户 5锁定 6解锁 7复核通过'
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
    comment: '变更前内容，JSON格式'
  })
  before_content?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '变更后内容，JSON格式'
  })
  after_content?: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '变更说明'
  })
  change_remark?: string;

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
  static generateId(instance: CustomerProfileLog) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
