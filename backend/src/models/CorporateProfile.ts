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
import { CorporateProfileLog } from './CorporateProfileLog';

@Table({
  tableName: 'biz_corporate_profile',
  comment: '对公客户信息表'
})
export class CorporateProfile extends Model<CorporateProfile> {
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
    comment: '对公客户编号'
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
    type: DataType.STRING(128),
    allowNull: false,
    comment: '企业名称'
  })
  enterprise_name!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    comment: '统一社会信用代码'
  })
  credit_code!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '企业简称'
  })
  enterprise_short_name?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '法人姓名'
  })
  legal_representative!: string;

  @Index
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    comment: '法人证件号码'
  })
  legal_id_card_no!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '法人证件类型 1身份证 2护照'
  })
  legal_id_type!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '法人手机号'
  })
  legal_mobile?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '行业分类'
  })
  industry_type?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '行业分类代码'
  })
  industry_code?: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '注册资本（万元）'
  })
  registered_capital!: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: false,
    comment: '注册地址'
  })
  registered_address!: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '经营地址'
  })
  business_address?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '成立日期'
  })
  establish_date?: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '经营年限'
  })
  business_years!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '经营状态 1正常 2停业 3注销 4吊销 5迁出 6异常'
  })
  business_status!: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '经营范围'
  })
  business_scope?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '营业执照编号'
  })
  license_no?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '营业执照有效期起'
  })
  license_valid_from?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '营业执照有效期止'
  })
  license_valid_to?: Date;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '营业执照长期有效 0否 1是'
  })
  license_permanent!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '客户类型 1小微企业 2中型企业 3大型企业 4集团客户'
  })
  customer_type!: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '授信额度（万元）'
  })
  credit_limit!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '服务等级 1基础 2标准 3优先 4专属'
  })
  service_level!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '风控等级 1低风险 2中风险 3高风险 4极高风验'
  })
  risk_level!: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '风控标签，逗号分隔'
  })
  risk_tags?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '企业联系人'
  })
  contact_person?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '联系人电话'
  })
  contact_phone?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '联系人邮箱'
  })
  contact_email?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '企业备案校验 0未校验 1通过 2不通过'
  })
  filing_verify_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '法人实名校验 0未校验 1通过 2不通过'
  })
  legal_verify_status!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '经营资质校验 0未校验 1通过 2不通过'
  })
  qualification_verify_status!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '校验不通过原因'
  })
  verify_fail_reason?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '失信企业标记 0否 1是'
  })
  is_dishonest!: number;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: '失信信息'
  })
  dishonest_info?: string;

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
    comment: '缺失信息项，逗号分隔'
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
    type: DataType.TEXT,
    allowNull: true,
    comment: '服务权限JSON'
  })
  service_permissions?: string;

  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '关联客户ID'
  })
  related_customer_id?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '信息状态 0草稿 1已建档 2已变更 3已销户 4锁定待复核'
  })
  status!: number;

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

  @HasMany(() => CorporateProfileLog, { foreignKey: 'profile_id', constraints: false })
  change_logs?: CorporateProfileLog[];

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: CorporateProfile) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
