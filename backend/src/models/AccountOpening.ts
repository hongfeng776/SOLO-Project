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
import { Organization } from './Organization';
import { User } from './User';

@Table({
  tableName: 'biz_account_opening',
  comment: '个人账户开户申请表'
})
export class AccountOpening extends Model<AccountOpening> {
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
    comment: '开户申请流水号（AO+时间戳）'
  })
  opening_no!: string;

  @ForeignKey(() => Customer)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '关联客户ID（实名后自动绑定）'
  })
  customer_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '客户编号'
  })
  customer_no?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '申请账户类型 1一类账户(普通) 2二类账户 3三类账户'
  })
  account_type!: number;

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
    comment: '身份证号'
  })
  id_card_no!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '证件类型 1身份证 2护照 3军官证'
  })
  id_type?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '身份证有效期起'
  })
  id_valid_from?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '身份证有效期止'
  })
  id_valid_to?: Date;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '身份证是否长期有效 0否 1是'
  })
  id_permanent?: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '手机号'
  })
  mobile!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '手机号是否本人实名 0否 1是 2待核验'
  })
  mobile_verified?: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '居住地地址'
  })
  residential_address?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '居住地省/直辖市编码'
  })
  residential_province_code?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '拟开户机构ID'
  })
  target_org_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '拟开户机构所在地省/直辖市编码'
  })
  target_org_province_code?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '居住地与开户行属地是否匹配 0不匹配 1匹配 2待核验'
  })
  region_matched?: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '开户用途'
  })
  open_purpose?: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '开户资料影像URL（逗号分隔：身份证正面/身份证反面/人脸照/手持照）'
  })
  image_urls?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '影像清晰度评分 0-100'
  })
  image_clarity_score?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '风险等级 0无风险 1低 2中低 3中 4中高 5高'
  })
  risk_level!: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '风险标签 逗号分隔'
  })
  risk_tags?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '来源渠道 counter柜面 mobile手机 ebank网银 atm自助'
  })
  channel_code?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '申请状态 0待预检 1预检通过待录入 2录入中 3待复核 4复核通过待开户 5已开户 6已驳回 7已取消 8已拒绝'
  })
  status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '预检结果 0不通过 1通过'
  })
  precheck_result?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '预检不通过原因（JSON数组，支持多维度）'
  })
  precheck_reasons?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '驳回/拒绝原因'
  })
  reject_reason?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '复核人ID'
  })
  reviewer_id?: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '提交机构ID'
  })
  submit_org_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '提交操作员ID'
  })
  submitter_id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '提交时间'
  })
  submit_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '复核时间'
  })
  review_time?: Date;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '开户成功后生成的账户ID'
  })
  account_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '开户成功后生成的账户号'
  })
  account_no?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否异常隔离 0正常 1已隔离（异常数据）'
  })
  is_isolated!: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '异常隔离原因'
  })
  isolate_reason?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => Organization, 'target_org_id')
  target_org?: Organization;

  @BelongsTo(() => Organization, 'submit_org_id')
  submit_org?: Organization;

  @BelongsTo(() => User, 'submitter_id')
  submitter?: User;

  @BelongsTo(() => User, 'reviewer_id')
  reviewer?: User;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: AccountOpening) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
