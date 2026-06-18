import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum QualificationApplyStatus {
  PENDING = 0,
  UNDER_REVIEW = 1,
  APPROVED = 2,
  REJECTED = 3,
  EXPIRED = 4
}

export enum QualificationType {
  ID_CARD = 'id_card',
  BUSINESS_LICENSE = 'business_license',
  INDUSTRY_CERT = 'industry_cert',
  OTHER = 'other'
}

export const QUALIFICATION_APPLY_STATUS_NAMES: Record<number, string> = {
  [QualificationApplyStatus.PENDING]: '待提交',
  [QualificationApplyStatus.UNDER_REVIEW]: '审核中',
  [QualificationApplyStatus.APPROVED]: '已通过',
  [QualificationApplyStatus.REJECTED]: '已驳回',
  [QualificationApplyStatus.EXPIRED]: '已过期'
}

export const QUALIFICATION_TYPE_NAMES: Record<string, string> = {
  [QualificationType.ID_CARD]: '身份证件',
  [QualificationType.BUSINESS_LICENSE]: '营业执照',
  [QualificationType.INDUSTRY_CERT]: '行业资质证',
  [QualificationType.OTHER]: '其他材料'
}

class CreatorQualificationApply extends Model<InferAttributes<CreatorQualificationApply>, InferCreationAttributes<CreatorQualificationApply>> {
  declare id: CreationOptional<number>
  declare creatorId: number
  declare applyNo: string
  declare status: number
  declare qualificationType: string
  declare realName: string
  declare idCard: string
  declare idCardFront: string
  declare idCardBack: string
  declare businessLicense: string
  declare businessLicenseNo: string
  declare industryCert: string
  declare industryCertNo: string
  declare industryCategory: string
  declare otherMaterials: CreationOptional<string>
  declare preCheckResult: CreationOptional<string>
  declare preCheckPassed: CreationOptional<number>
  declare rejectReason: CreationOptional<string>
  declare auditorId: CreationOptional<number>
  declare auditorName: CreationOptional<string>
  declare auditTime: CreationOptional<Date | null>
  declare expireTime: CreationOptional<Date | null>
  declare isExpiringSoon: CreationOptional<number>
  declare isFake: CreationOptional<number>
  declare fakeReason: CreationOptional<string>
  declare submitTime: CreationOptional<Date | null>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

CreatorQualificationApply.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    creatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '达人ID'
    },
    applyNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '申请编号'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '状态 0待提交 1审核中 2已通过 3已驳回 4已过期'
    },
    qualificationType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'business_license',
      comment: '资质类型'
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '真实姓名'
    },
    idCard: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '身份证号'
    },
    idCardFront: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '身份证正面'
    },
    idCardBack: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '身份证反面'
    },
    businessLicense: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '营业执照图片'
    },
    businessLicenseNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '营业执照编号'
    },
    industryCert: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '行业资质证书'
    },
    industryCertNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '行业资质证编号'
    },
    industryCategory: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '所属行业类目'
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
    rejectReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '驳回原因'
    },
    auditorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '审核人ID'
    },
    auditorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '审核人姓名'
    },
    auditTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '审核时间'
    },
    expireTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '资质到期时间'
    },
    isExpiringSoon: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否即将过期 0否 1是'
    },
    isFake: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否虚假资质 0否 1是'
    },
    fakeReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '虚假判定原因'
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
    tableName: 'biz_creator_qualification_apply',
    modelName: 'CreatorQualificationApply',
    indexes: [
      { fields: ['creator_id', 'status'] },
      { fields: ['status'] },
      { fields: ['apply_no'], unique: true },
      { fields: ['expire_time'] },
      { fields: ['is_expiring_soon'] }
    ]
  }
)

export default CreatorQualificationApply
