import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { PromoterLevel, PromoterStatus, AuditStage, AuditStatus, VerifyStatus, PromoteStatus, SettleStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface PromoterAttributes {
  id: string;
  channelId?: string;
  code: string;
  name: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  wechatId?: string;
  idCard?: string;
  idCardFrontImg?: string;
  idCardBackImg?: string;
  level: PromoterLevel;
  status: PromoterStatus;
  auditStage: AuditStage;
  auditStatus: AuditStatus;
  firstAuditorId?: string;
  firstAuditAt?: Date;
  firstAuditRemark?: string;
  secondAuditorId?: string;
  secondAuditAt?: Date;
  secondAuditRemark?: string;
  rejectReasonCode?: string;
  rejectCustomRemark?: string;
  rejectedAt?: Date;
  lockUntil?: Date;
  applyCount?: number;
  lastApplyAt?: Date;
  dataHash?: string;
  riskFlagged?: boolean;
  riskReason?: string;
  parentId?: string;
  totalOrders?: number;
  totalAmount?: number;
  totalCommission?: number;
  availableCommission?: number;
  frozenCommission?: number;
  registerAt?: Date;
  lastActiveAt?: Date;
  remark?: string;
  verifyStatus?: number;
  verifiedAt?: Date;
  realName?: string;
  promoteStatus?: number;
  settleStatus?: number;
  commissionRate?: number;
  qualificationImgs?: string;
  qualificationExpireAt?: Date;
  qualificationRemark?: string;
  monthlyOrders?: number;
  monthlyAmount?: number;
  activeDays?: number;
  reputationScore?: number;
  isCorePromoter?: boolean;
  levelChangedCount?: number;
  lastLevelChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface PromoterCreationAttributes extends Optional<PromoterAttributes, 'id' | 'channelId' | 'nickname' | 'avatar' | 'phone' | 'email' | 'wechatId' | 'idCard' | 'idCardFrontImg' | 'idCardBackImg' | 'level' | 'status' | 'auditStage' | 'auditStatus' | 'firstAuditorId' | 'firstAuditAt' | 'firstAuditRemark' | 'secondAuditorId' | 'secondAuditAt' | 'secondAuditRemark' | 'rejectReasonCode' | 'rejectCustomRemark' | 'rejectedAt' | 'lockUntil' | 'applyCount' | 'lastApplyAt' | 'dataHash' | 'riskFlagged' | 'riskReason' | 'parentId' | 'totalOrders' | 'totalAmount' | 'totalCommission' | 'availableCommission' | 'frozenCommission' | 'registerAt' | 'lastActiveAt' | 'remark' | 'verifyStatus' | 'verifiedAt' | 'realName' | 'promoteStatus' | 'settleStatus' | 'commissionRate' | 'qualificationImgs' | 'qualificationExpireAt' | 'qualificationRemark' | 'monthlyOrders' | 'monthlyAmount' | 'activeDays' | 'reputationScore' | 'isCorePromoter' | 'levelChangedCount' | 'lastLevelChangedAt' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Promoter extends Model<PromoterAttributes, PromoterCreationAttributes> implements PromoterAttributes {
  public id!: string;
  public channelId?: string;
  public code!: string;
  public name!: string;
  public nickname?: string;
  public avatar?: string;
  public phone?: string;
  public email?: string;
  public wechatId?: string;
  public idCard?: string;
  public idCardFrontImg?: string;
  public idCardBackImg?: string;
  public level!: PromoterLevel;
  public status!: PromoterStatus;
  public auditStage!: AuditStage;
  public auditStatus!: AuditStatus;
  public firstAuditorId?: string;
  public firstAuditAt?: Date;
  public firstAuditRemark?: string;
  public secondAuditorId?: string;
  public secondAuditAt?: Date;
  public secondAuditRemark?: string;
  public rejectReasonCode?: string;
  public rejectCustomRemark?: string;
  public rejectedAt?: Date;
  public lockUntil?: Date;
  public applyCount?: number;
  public lastApplyAt?: Date;
  public dataHash?: string;
  public riskFlagged?: boolean;
  public riskReason?: string;
  public parentId?: string;
  public totalOrders?: number;
  public totalAmount?: number;
  public totalCommission?: number;
  public availableCommission?: number;
  public frozenCommission?: number;
  public registerAt?: Date;
  public lastActiveAt?: Date;
  public remark?: string;
  public verifyStatus?: number;
  public verifiedAt?: Date;
  public realName?: string;
  public promoteStatus?: number;
  public settleStatus?: number;
  public commissionRate?: number;
  public qualificationImgs?: string;
  public qualificationExpireAt?: Date;
  public qualificationRemark?: string;
  public monthlyOrders?: number;
  public monthlyAmount?: number;
  public activeDays?: number;
  public reputationScore?: number;
  public isCorePromoter?: boolean;
  public levelChangedCount?: number;
  public lastLevelChangedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Promoter.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    channelId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'channels',
        key: 'id',
      },
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    wechatId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    idCard: {
      type: DataTypes.STRING(30),
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
    level: {
      type: DataTypes.ENUM(PromoterLevel.L1, PromoterLevel.L2, PromoterLevel.L3, PromoterLevel.L4, PromoterLevel.L5),
      allowNull: false,
      defaultValue: PromoterLevel.L1,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: PromoterStatus.PENDING,
    },
    auditStage: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: AuditStage.FIRST_AUDIT,
    },
    auditStatus: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: AuditStatus.FIRST_AUDITING,
    },
    firstAuditorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    firstAuditAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    firstAuditRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    secondAuditorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    secondAuditAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    secondAuditRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectReasonCode: {
      type: DataTypes.STRING(50),
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
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    riskFlagged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    riskReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parentId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'promoters',
        key: 'id',
      },
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalCommission: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    availableCommission: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    frozenCommission: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    registerAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verifyStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: VerifyStatus.UNVERIFIED,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    promoteStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: PromoteStatus.ACTIVE,
    },
    settleStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: SettleStatus.NORMAL,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
    },
    qualificationImgs: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    qualificationExpireAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    qualificationRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    monthlyOrders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    monthlyAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    activeDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reputationScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 100,
    },
    isCorePromoter: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    levelChangedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastLevelChangedAt: {
      type: DataTypes.DATE,
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
    tableName: 'promoters',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_code',
        fields: ['code'],
      },
      {
        name: 'idx_phone',
        fields: ['phone'],
      },
      {
        name: 'idx_id_card',
        fields: ['id_card'],
      },
      {
        name: 'idx_channel_id',
        fields: ['channel_id'],
      },
      {
        name: 'idx_parent_id',
        fields: ['parent_id'],
      },
      {
        name: 'idx_level',
        fields: ['level'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
      {
        name: 'idx_audit_stage',
        fields: ['audit_stage'],
      },
      {
        name: 'idx_audit_status',
        fields: ['audit_status'],
      },
      {
        name: 'idx_lock_until',
        fields: ['lock_until'],
      },
      {
        name: 'idx_risk_flagged',
        fields: ['risk_flagged'],
      },
      {
        name: 'idx_verify_status',
        fields: ['verify_status'],
      },
      {
        name: 'idx_promote_status',
        fields: ['promote_status'],
      },
      {
        name: 'idx_settle_status',
        fields: ['settle_status'],
      },
      {
        name: 'idx_is_core_promoter',
        fields: ['is_core_promoter'],
      },
      {
        name: 'idx_reputation_score',
        fields: ['reputation_score'],
      },
    ],
  }
);

export { Promoter, PromoterAttributes, PromoterCreationAttributes };
export default Promoter;
