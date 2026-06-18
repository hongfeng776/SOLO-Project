import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum MerchantApplyStatus {
  DRAFT = 0,
  PENDING_INITIAL = 1,
  PENDING_FINAL = 2,
  INITIAL_PASSED = 3,
  APPROVED = 4,
  REJECTED = 5,
  RETURNED = 6
}

export enum MerchantType {
  NORMAL = 'normal',
  BRAND = 'brand'
}

export enum MerchantRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export const MERCHANT_APPLY_STATUS_NAMES: Record<number, string> = {
  [MerchantApplyStatus.DRAFT]: '草稿',
  [MerchantApplyStatus.PENDING_INITIAL]: '待初审',
  [MerchantApplyStatus.PENDING_FINAL]: '待终审',
  [MerchantApplyStatus.INITIAL_PASSED]: '初审通过',
  [MerchantApplyStatus.APPROVED]: '终审通过',
  [MerchantApplyStatus.REJECTED]: '已驳回',
  [MerchantApplyStatus.RETURNED]: '已退回'
}

class MerchantOnboardingApply extends Model<InferAttributes<MerchantOnboardingApply>, InferCreationAttributes<MerchantOnboardingApply>> {
  declare id: CreationOptional<number>
  declare applyNo: string
  declare merchantName: string
  declare merchantType: string
  declare storeName: string
  declare status: number
  declare riskLevel: string
  declare businessLicense: string
  declare businessLicenseNo: string
  declare businessScope: CreationOptional<string>
  declare legalPersonName: string
  declare legalPersonIdCard: string
  declare legalPersonIdCardFront: string
  declare legalPersonIdCardBack: string
  declare legalPersonPhone: string
  declare industryCategory: string
  declare industryQualification: CreationOptional<string>
  declare industryQualificationNo: CreationOptional<string>
  declare qualificationExpireTime: CreationOptional<Date | null>
  declare contactName: string
  declare contactPhone: string
  declare contactEmail: CreationOptional<string>
  declare shopAddress: CreationOptional<string>
  declare brandAuthorization: CreationOptional<string>
  declare brandName: CreationOptional<string>
  declare otherMaterials: CreationOptional<string>
  declare preCheckResult: CreationOptional<string>
  declare preCheckPassed: CreationOptional<number>
  declare initialAuditorId: CreationOptional<number>
  declare initialAuditorName: CreationOptional<string>
  declare initialAuditTime: CreationOptional<Date | null>
  declare initialAuditRemark: CreationOptional<string>
  declare finalAuditorId: CreationOptional<number>
  declare finalAuditorName: CreationOptional<string>
  declare finalAuditTime: CreationOptional<Date | null>
  declare finalAuditRemark: CreationOptional<string>
  declare rejectReason: CreationOptional<string>
  declare rejectDimension: CreationOptional<string>
  declare returnReason: CreationOptional<string>
  declare storeOpened: CreationOptional<number>
  declare listingEnabled: CreationOptional<number>
  declare marketingEnabled: CreationOptional<number>
  declare isDuplicate: CreationOptional<number>
  declare isFakeQualification: CreationOptional<number>
  declare isCrossIndustry: CreationOptional<number>
  declare creditScore: CreationOptional<number>
  declare submitTime: CreationOptional<Date | null>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

MerchantOnboardingApply.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    applyNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '申请编号'
    },
    merchantName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '商家名称'
    },
    merchantType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'normal',
      comment: '商家类型 normal普通 brand品牌'
    },
    storeName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '店铺名称'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '状态 0草稿 1待初审 2待终审 3初审通过 4终审通过 5已驳回 6已退回'
    },
    riskLevel: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'low',
      comment: '风险等级 low medium high'
    },
    businessLicense: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '营业执照图片'
    },
    businessLicenseNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '营业执照编号'
    },
    businessScope: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '经营范围'
    },
    legalPersonName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '法人姓名'
    },
    legalPersonIdCard: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '法人身份证号'
    },
    legalPersonIdCardFront: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '法人身份证正面'
    },
    legalPersonIdCardBack: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '法人身份证反面'
    },
    legalPersonPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '法人手机号'
    },
    industryCategory: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '行业类目'
    },
    industryQualification: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '行业资质证书'
    },
    industryQualificationNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '行业资质证编号'
    },
    qualificationExpireTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '资质到期时间'
    },
    contactName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '联系人姓名'
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '联系人电话'
    },
    contactEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '联系邮箱'
    },
    shopAddress: {
      type: DataTypes.STRING(300),
      allowNull: true,
      defaultValue: '',
      comment: '店铺地址'
    },
    brandAuthorization: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '品牌授权书'
    },
    brandName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '品牌名称'
    },
    otherMaterials: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '其他材料JSON数组'
    },
    preCheckResult: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '前置校验结果JSON'
    },
    preCheckPassed: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '前置校验是否通过 0否 1是'
    },
    initialAuditorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '初审人ID'
    },
    initialAuditorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '初审人姓名'
    },
    initialAuditTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '初审时间'
    },
    initialAuditRemark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '初审备注'
    },
    finalAuditorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '终审人ID'
    },
    finalAuditorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '终审人姓名'
    },
    finalAuditTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '终审时间'
    },
    finalAuditRemark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '终审备注'
    },
    rejectReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '驳回原因'
    },
    rejectDimension: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '驳回维度'
    },
    returnReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '退回原因'
    },
    storeOpened: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '店铺开通 0未开通 1已开通'
    },
    listingEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '上架权限 0未开通 1已开通'
    },
    marketingEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '营销权限 0未开通 1已开通'
    },
    isDuplicate: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否重复入驻 0否 1是'
    },
    isFakeQualification: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否虚假资质 0否 1是'
    },
    isCrossIndustry: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否跨行业违规 0否 1是'
    },
    creditScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      comment: '信用评分 0-100'
    },
    submitTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '提交时间'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_merchant_onboarding_apply',
    modelName: 'MerchantOnboardingApply',
    indexes: [
      { fields: ['apply_no'], unique: true },
      { fields: ['status'] },
      { fields: ['merchant_type', 'status'] },
      { fields: ['business_license_no'] },
      { fields: ['store_name'] },
      { fields: ['risk_level'] },
      { fields: ['legal_person_id_card'] }
    ]
  }
)

export default MerchantOnboardingApply
