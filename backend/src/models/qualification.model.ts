import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { QualificationAuditStatus, BusinessStatus } from '../constants/recruitment.enum';

interface QualificationAttributes {
  id: number;
  companyId?: number;
  companyName: string;
  unifiedCreditCode: string;
  registeredAddress: string;
  legalPerson: string;
  legalPersonIdCard?: string;
  businessStatus: BusinessStatus;
  industryCategory: string;
  businessScope?: string;
  registeredCapital?: string;
  establishedDate?: Date;
  businessLicenseNo?: string;
  businessLicenseStart?: Date;
  businessLicenseEnd?: Date;
  businessLicenseImage?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  auditStatus: QualificationAuditStatus;
  auditRemark?: string;
  rejectReason?: string;
  auditUserId?: number;
  auditTime?: Date;
  creatorId?: number;
  creatorName?: string;
  isRealNameVerified: boolean;
  remark?: string;
}

interface QualificationCreationAttributes
  extends Optional<
    QualificationAttributes,
    | 'id'
    | 'auditStatus'
    | 'isRealNameVerified'
    | 'businessStatus'
  > {}

class Qualification
  extends Model<QualificationAttributes, QualificationCreationAttributes>
  implements QualificationAttributes
{
  public id!: number;
  public companyId?: number;
  public companyName!: string;
  public unifiedCreditCode!: string;
  public registeredAddress!: string;
  public legalPerson!: string;
  public legalPersonIdCard?: string;
  public businessStatus!: BusinessStatus;
  public industryCategory!: string;
  public businessScope?: string;
  public registeredCapital?: string;
  public establishedDate?: Date;
  public businessLicenseNo?: string;
  public businessLicenseStart?: Date;
  public businessLicenseEnd?: Date;
  public businessLicenseImage?: string;
  public contactPerson!: string;
  public contactPhone!: string;
  public contactEmail?: string;
  public auditStatus!: QualificationAuditStatus;
  public auditRemark?: string;
  public rejectReason?: string;
  public auditUserId?: number;
  public auditTime?: Date;
  public creatorId?: number;
  public creatorName?: string;
  public isRealNameVerified!: boolean;
  public remark?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Qualification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '资质ID',
    },
    companyId: {
      type: DataTypes.INTEGER,
      comment: '关联企业ID',
    },
    companyName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '企业名称',
    },
    unifiedCreditCode: {
      type: DataTypes.STRING(18),
      allowNull: false,
      comment: '统一社会信用代码',
    },
    registeredAddress: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '注册地址',
    },
    legalPerson: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '法定代表人',
    },
    legalPersonIdCard: {
      type: DataTypes.STRING(18),
      comment: '法人身份证号',
    },
    businessStatus: {
      type: DataTypes.ENUM('active', 'revoked', 'cancelled', 'relocated'),
      defaultValue: BusinessStatus.ACTIVE,
      comment: '经营状态',
    },
    industryCategory: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '行业分类',
    },
    businessScope: {
      type: DataTypes.TEXT,
      comment: '经营范围',
    },
    registeredCapital: {
      type: DataTypes.STRING(50),
      comment: '注册资本',
    },
    establishedDate: {
      type: DataTypes.DATE,
      comment: '成立日期',
    },
    businessLicenseNo: {
      type: DataTypes.STRING(50),
      comment: '营业执照编号',
    },
    businessLicenseStart: {
      type: DataTypes.DATE,
      comment: '营业执照有效期起',
    },
    businessLicenseEnd: {
      type: DataTypes.DATE,
      comment: '营业执照有效期止',
    },
    businessLicenseImage: {
      type: DataTypes.STRING(500),
      comment: '营业执照图片',
    },
    contactPerson: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '联系人',
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '联系电话',
    },
    contactEmail: {
      type: DataTypes.STRING(100),
      comment: '联系邮箱',
    },
    auditStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
      defaultValue: QualificationAuditStatus.PENDING,
      comment: '审核状态 pending-待审核 approved-审核通过 rejected-审核驳回 expired-资质过期',
    },
    auditRemark: {
      type: DataTypes.TEXT,
      comment: '审核备注',
    },
    rejectReason: {
      type: DataTypes.TEXT,
      comment: '驳回原因',
    },
    auditUserId: {
      type: DataTypes.INTEGER,
      comment: '审核人ID',
    },
    auditTime: {
      type: DataTypes.DATE,
      comment: '审核时间',
    },
    creatorId: {
      type: DataTypes.INTEGER,
      comment: '创建人ID',
    },
    creatorName: {
      type: DataTypes.STRING(50),
      comment: '创建人姓名',
    },
    isRealNameVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否完成实名认证',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'qualification',
    comment: '企业资质表',
    indexes: [
      {
        unique: true,
        fields: ['unified_credit_code'],
      },
    ],
  }
);

export default Qualification;
