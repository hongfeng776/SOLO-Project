"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Promoter = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class Promoter extends sequelize_1.Model {
}
exports.Promoter = Promoter;
Promoter.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    channelId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'channels',
            key: 'id',
        },
    },
    code: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    nickname: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    avatar: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true,
        },
    },
    wechatId: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    idCard: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: true,
    },
    idCardFrontImg: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    idCardBackImg: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    level: {
        type: sequelize_1.DataTypes.ENUM(enum_1.PromoterLevel.L1, enum_1.PromoterLevel.L2, enum_1.PromoterLevel.L3, enum_1.PromoterLevel.L4, enum_1.PromoterLevel.L5),
        allowNull: false,
        defaultValue: enum_1.PromoterLevel.L1,
    },
    status: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.PromoterStatus.PENDING,
    },
    auditStage: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.AuditStage.FIRST_AUDIT,
    },
    auditStatus: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
        defaultValue: enum_1.AuditStatus.FIRST_AUDITING,
    },
    firstAuditorId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    firstAuditAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    firstAuditRemark: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    secondAuditorId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    secondAuditAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    secondAuditRemark: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    rejectReasonCode: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    rejectCustomRemark: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    rejectedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    lockUntil: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    applyCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    lastApplyAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    dataHash: {
        type: sequelize_1.DataTypes.STRING(128),
        allowNull: true,
    },
    riskFlagged: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    riskReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    parentId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'promoters',
            key: 'id',
        },
    },
    totalOrders: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    totalCommission: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    availableCommission: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    frozenCommission: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    registerAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    lastActiveAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    remark: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    verifyStatus: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.VerifyStatus.UNVERIFIED,
    },
    verifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    realName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    promoteStatus: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.PromoteStatus.ACTIVE,
    },
    settleStatus: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.SettleStatus.NORMAL,
    },
    commissionRate: {
        type: sequelize_1.DataTypes.DECIMAL(5, 4),
        allowNull: true,
    },
    qualificationImgs: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    qualificationExpireAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    qualificationRemark: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    monthlyOrders: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    monthlyAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    activeDays: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    reputationScore: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100,
    },
    isCorePromoter: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    levelChangedCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    lastLevelChangedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    riskControlStatus: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.RiskControlStatus.NORMAL,
    },
    riskLevel: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    riskType: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: true,
    },
    riskMarkedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    riskMarkedBy: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    riskMarkedReason: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    riskExpireAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    riskControlPermissions: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('riskControlPermissions');
            return raw ? JSON.parse(raw) : null;
        },
        set(value) {
            this.setDataValue('riskControlPermissions', value ? JSON.stringify(value) : undefined);
        },
    },
    lastRiskWarningAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
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
        {
            name: 'idx_risk_control_status',
            fields: ['risk_control_status'],
        },
        {
            name: 'idx_risk_level',
            fields: ['risk_level'],
        },
        {
            name: 'idx_risk_type',
            fields: ['risk_type'],
        },
    ],
});
exports.default = Promoter;
//# sourceMappingURL=Promoter.model.js.map