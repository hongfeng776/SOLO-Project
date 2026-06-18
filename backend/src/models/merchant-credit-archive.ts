import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class MerchantCreditArchive extends Model<InferAttributes<MerchantCreditArchive>, InferCreationAttributes<MerchantCreditArchive>> {
  declare id: CreationOptional<number>
  declare applyId: number
  declare merchantName: string
  declare businessLicenseNo: string
  declare legalPersonIdCard: string
  declare creditScore: number
  declare creditLevel: string
  declare onboardingCount: number
  declare violationCount: number
  declare fakeQualificationCount: number
  declare crossIndustryCount: number
  declare duplicateApplyCount: number
  declare lastViolationTime: CreationOptional<Date | null>
  declare lastOnboardingTime: CreationOptional<Date | null>
  declare creditDetail: CreationOptional<string>
  declare remark: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

MerchantCreditArchive.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    applyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '入驻申请ID'
    },
    merchantName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '商家名称'
    },
    businessLicenseNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '营业执照编号'
    },
    legalPersonIdCard: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '法人身份证号'
    },
    creditScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      comment: '信用评分 0-100'
    },
    creditLevel: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'A',
      comment: '信用等级 A/B/C/D'
    },
    onboardingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '入驻申请次数'
    },
    violationCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '违规次数'
    },
    fakeQualificationCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '虚假资质次数'
    },
    crossIndustryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '跨行业违规次数'
    },
    duplicateApplyCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '重复申请次数'
    },
    lastViolationTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最近违规时间'
    },
    lastOnboardingTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最近入驻时间'
    },
    creditDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '信用明细JSON'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '备注'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_merchant_credit_archive',
    modelName: 'MerchantCreditArchive',
    indexes: [
      { fields: ['business_license_no'] },
      { fields: ['legal_person_id_card'] },
      { fields: ['credit_level'] },
      { fields: ['credit_score'] }
    ]
  }
)

export default MerchantCreditArchive
