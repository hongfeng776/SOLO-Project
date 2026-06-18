import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ChannelAuditStage, ChannelAuditStatus, ChannelPriority } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ChannelAuditAttributes {
  id: string;
  channelId?: string;
  name: string;
  code?: string;
  type?: string;
  companyName?: string;
  creditCode?: string;
  legalPerson?: string;
  legalPersonIdCard?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  businessLicenseImg?: string;
  idCardFrontImg?: string;
  idCardBackImg?: string;
  otherQualificationImgs?: any;
  commissionRate?: number;
  priority: ChannelPriority;
  auditStage: ChannelAuditStage;
  auditStatus: ChannelAuditStatus;
  isKeyChannel?: boolean;
  riskFlagged?: boolean;
  riskReason?: string;
  applyCount?: number;
  lastApplyAt?: Date;
  dataHash?: string;
  rejectIssueTypes?: any;
  rejectCustomRemark?: string;
  rejectedAt?: Date;
  lockUntil?: Date;
  dataAuditorId?: string;
  dataAuditAt?: Date;
  dataAuditRemark?: string;
  qualificationAuditorId?: string;
  qualificationAuditAt?: Date;
  qualificationAuditRemark?: string;
  permissionAuditorId?: string;
  permissionAuditAt?: Date;
  permissionAuditRemark?: string;
  activatedAt?: Date;
  creditCheckResult?: any;
  blacklistMatched?: boolean;
  blacklistItems?: any;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface ChannelAuditCreationAttributes extends Optional<ChannelAuditAttributes,
  'id' | 'priority' | 'auditStage' | 'auditStatus' | 'applyCount' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class ChannelAudit extends Model<ChannelAuditAttributes, ChannelAuditCreationAttributes> implements ChannelAuditAttributes {
  public id!: string;
  public channelId?: string;
  public name!: string;
  public code?: string;
  public type?: string;
  public companyName?: string;
  public creditCode?: string;
  public legalPerson?: string;
  public legalPersonIdCard?: string;
  public contactName!: string;
  public contactPhone!: string;
  public contactEmail?: string;
  public address?: string;
  public businessLicenseImg?: string;
  public idCardFrontImg?: string;
  public idCardBackImg?: string;
  public otherQualificationImgs?: any;
  public commissionRate?: number;
  public priority!: ChannelPriority;
  public auditStage!: ChannelAuditStage;
  public auditStatus!: ChannelAuditStatus;
  public isKeyChannel?: boolean;
  public riskFlagged?: boolean;
  public riskReason?: string;
  public applyCount?: number;
  public lastApplyAt?: Date;
  public dataHash?: string;
  public rejectIssueTypes?: any;
  public rejectCustomRemark?: string;
  public rejectedAt?: Date;
  public lockUntil?: Date;
  public dataAuditorId?: string;
  public dataAuditAt?: Date;
  public dataAuditRemark?: string;
  public qualificationAuditorId?: string;
  public qualificationAuditAt?: Date;
  public qualificationAuditRemark?: string;
  public permissionAuditorId?: string;
  public permissionAuditAt?: Date;
  public permissionAuditRemark?: string;
  public activatedAt?: Date;
  public creditCheckResult?: any;
  public blacklistMatched?: boolean;
  public blacklistItems?: any;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

ChannelAudit.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    channelId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: { model: 'channels', key: 'id' },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    creditCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    legalPerson: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    legalPersonIdCard: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    contactName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    contactEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    businessLicenseImg: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    idCardFrontImg: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    idCardBackImg: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    otherQualificationImgs: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      defaultValue: 0,
    },
    priority: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: ChannelPriority.NORMAL,
    },
    auditStage: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: ChannelAuditStage.PENDING_SUBMIT,
    },
    auditStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: ChannelAuditStatus.PENDING,
    },
    isKeyChannel: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    riskFlagged: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    riskReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    applyCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    lastApplyAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dataHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    rejectIssueTypes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    rejectCustomRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dataAuditorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    dataAuditAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dataAuditRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    qualificationAuditorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    qualificationAuditAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    qualificationAuditRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    permissionAuditorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    permissionAuditAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    permissionAuditRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    creditCheckResult: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    blacklistMatched: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    blacklistItems: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'channel_audits',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { name: 'idx_channel_id', fields: ['channel_id'] },
      { name: 'idx_audit_stage', fields: ['audit_stage'] },
      { name: 'idx_audit_status', fields: ['audit_status'] },
      { name: 'idx_contact_phone', fields: ['contact_phone'] },
      { name: 'idx_credit_code', fields: ['credit_code'] },
      { name: 'idx_company_name', fields: ['company_name'] },
      { name: 'idx_priority', fields: ['priority'] },
      { name: 'idx_risk_flagged', fields: ['risk_flagged'] },
      { name: 'idx_created_at', fields: ['created_at'] },
    ],
  }
);

export { ChannelAudit, ChannelAuditAttributes, ChannelAuditCreationAttributes };
export default ChannelAudit;
