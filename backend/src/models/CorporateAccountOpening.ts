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
  tableName: 'biz_corporate_opening',
  comment: '对公账户开户申请表'
})
export class CorporateAccountOpening extends Model<CorporateAccountOpening> {
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
    comment: '开户申请流水号（CO+时间戳）'
  })
  opening_no!: string;

  @ForeignKey(() => Customer)
  @Index
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '关联企业客户ID'
  })
  customer_id?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '企业客户编号'
  })
  customer_no?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '申请账户类型 1基本户 2一般户 3专用账户 4临时账户'
  })
  account_type!: number;

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
    comment: '统一社会信用代码'
  })
  credit_code!: string;

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
    allowNull: true,
    comment: '营业执照是否长期有效 0否 1是'
  })
  license_permanent?: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '法定代表人姓名'
  })
  legal_representative?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '法定代表人身份证号'
  })
  legal_id_card_no?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '法人实名备案状态 0未备案 1已备案 2待核验'
  })
  legal_verified?: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '经办人姓名'
  })
  agent_name?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '经办人身份证号'
  })
  agent_id_card_no?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '经办人手机号'
  })
  agent_mobile?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '经办人实名状态 0未核验 1已核验 2待核验'
  })
  agent_verified?: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '企业注册地址'
  })
  registered_address?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '实际经营地址'
  })
  business_address?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '经营状态 1正常经营 2停业 3注销 4吊销 5迁入 6迁出'
  })
  business_status?: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '税务登记号'
  })
  tax_registration_no?: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '税务信息一致性 0不一致 1一致 2待核验'
  })
  tax_info_consistent?: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '行业类型'
  })
  industry_type?: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
    comment: '注册资本（万元）'
  })
  registered_capital?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '经营年限（年）'
  })
  business_years?: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    comment: '对公开户授权文件 0缺失 1完整 2待核验'
  })
  authorization_complete?: number;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.STRING(36),
    allowNull: true,
    comment: '拟开户机构ID'
  })
  target_org_id?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '开户用途'
  })
  open_purpose?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '开户佐证材料URL（JSON数组）'
  })
  supporting_materials?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '审批层级 1一级 2二级 3三级'
  })
  approval_level?: string;

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
    comment: '来源渠道 counter柜面 ebank网银'
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
    comment: '是否失信企业 0否 1是'
  })
  is_dishonest!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否经营异常 0否 1是'
  })
  is_abnormal!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否暂停处理 0否 1是（批量中单条暂停）'
  })
  is_paused!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否异常隔离 0正常 1已隔离'
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
  static generateId(instance: CorporateAccountOpening) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
