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
import { CustomerProfileLog } from './CustomerProfileLog';

@Table({
  tableName: 'biz_customer_profile',
  comment: '个人客户档案表'
})
export class CustomerProfile extends Model<CustomerProfile> {
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
    comment: '客户档案编号'
  })
  profile_no!: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '归属机构ID'
  })
  org_id?: string;

  @BelongsTo(() => Organization)
  organization?: Organization;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '客户姓名'
  })
  customer_name!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    comment: '证件号码'
  })
  id_card_no!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '证件类型 1身份证 2护照 3军官证 4港澳台居民证'
  })
  id_type!: number;

  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    comment: '性别 M男 F女 U未知'
  })
  gender!: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '出生日期'
  })
  birth_date?: Date;

  @Column({
    type: DataType.STRING(16),
    allowNull: true,
    comment: '民族'
  })
  nation?: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '手机号'
  })
  mobile!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '电子邮箱'
  })
  email?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: false,
    comment: '户籍地址'
  })
  registered_address!: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: false,
    comment: '居住地址'
  })
  residential_address!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '职业'
  })
  occupation?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '工作单位'
  })
  employer?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '职位'
  })
  position?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '学历'
  })
  education?: string;

  @Column({
    type: DataType.STRING(16),
    allowNull: true,
    comment: '婚姻状况'
  })
  marital_status?: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '资产规模（元）'
  })
  total_assets!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '月均交易频次'
  })
  monthly_transaction_count!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '客户留存天数'
  })
  retention_days!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '客户等级 1普通客户 2优质客户 3贵宾客户 4潜力客户'
  })
  customer_level!: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '客户标签，逗号分隔'
  })
  customer_tags?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '服务权限，JSON格式'
  })
  service_permissions?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '实名证件校验状态 0未校验 1校验通过 2校验失败'
  })
  id_verify_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '人脸核验状态 0未核验 1核验通过 2核验失败'
  })
  face_verify_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '手机号校验状态 0未校验 1校验通过 2校验失败'
  })
  mobile_verify_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '公安备案校验 0未校验 1一致 2不一致'
  })
  police_verify_status!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '公安备案校验不通过原因'
  })
  police_verify_reason?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '信息完整性 0不完整 1完整'
  })
  info_completeness!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '缺失信息项列表，逗号分隔'
  })
  missing_fields?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '待完善标记 0完善 1待完善'
  })
  need_complete!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '异常标记 0正常 1异常锁定待复核'
  })
  is_abnormal!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '异常原因'
  })
  abnormal_reason?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '档案状态 0草稿 1已建档 2已变更 3已销户 4锁定待复核'
  })
  status!: number;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '关联客户ID（对应biz_customer表）'
  })
  related_customer_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '建档人ID'
  })
  creator_id?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '建档人姓名'
  })
  creator_name?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '建档时间'
  })
  profile_time?: Date;

  @HasMany(() => CustomerProfileLog, { foreignKey: 'profile_id', constraints: false })
  change_logs?: CustomerProfileLog[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: CustomerProfile) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
