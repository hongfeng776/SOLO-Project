import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BeforeCreate,
  BeforeValidate,
  Index
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

export type MerchantType = 1 | 2 | 3 | 4 | 5;
export type MerchantStatus = 0 | 1 | 2 | 3;
export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5;

@Table({
  tableName: 'biz_merchant_info',
  comment: '商户信息表'
})
export class MerchantInfo extends Model<MerchantInfo> {
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
    comment: '商户编号'
  })
  merchant_no!: string;

  @Index
  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '商户名称'
  })
  merchant_name!: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '商户简称'
  })
  short_name?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '商户类型 1个人商户 2个体工商户 3企业商户 4事业单位 5其他'
  })
  merchant_type!: MerchantType;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '营业执照号'
  })
  business_license?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '统一社会信用代码'
  })
  credit_code?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '法定代表人'
  })
  legal_person?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '法人身份证号'
  })
  legal_id_card?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '联系人'
  })
  contact_person?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: '联系电话'
  })
  contact_phone?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '联系邮箱'
  })
  contact_email?: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '经营地址'
  })
  business_address?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '所属行业'
  })
  industry?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '结算账户号'
  })
  settlement_account?: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '结算账户户名'
  })
  settlement_account_name?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '结算开户行'
  })
  settlement_bank?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '风险等级 0无风险 1低 2中低 3中 4中高 5高'
  })
  risk_level!: RiskLevel;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '风险标签 逗号分隔'
  })
  risk_tags?: string;

  @Index
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '商户状态 0待审核 1正常 2冻结 3注销'
  })
  status!: MerchantStatus;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '入驻时间'
  })
  entry_time?: Date;

  @BeforeValidate
  @BeforeCreate
  static generateId(instance: MerchantInfo) {
    if (!instance.id) {
      instance.id = uuidv4().replace(/-/g, '');
    }
  }
}
