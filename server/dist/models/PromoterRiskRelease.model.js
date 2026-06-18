"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoterRiskRelease = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class PromoterRiskRelease extends sequelize_1.Model {
}
exports.PromoterRiskRelease = PromoterRiskRelease;
PromoterRiskRelease.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    promoterId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'promoters',
            key: 'id',
        },
    },
    applicantId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    applicantName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    riskRecordId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'promoter_risk_records',
            key: 'id',
        },
    },
    releaseReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    proofMaterials: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('proofMaterials');
            return raw ? JSON.parse(raw) : null;
        },
        set(value) {
            this.setDataValue('proofMaterials', value ? JSON.stringify(value) : undefined);
        },
    },
    rectificationDesc: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    abnormalDataCleared: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    verifyStatus: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.RiskReleaseStatus.PENDING,
    },
    verifierId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    verifierName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    verifyRemark: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    verifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    restoreStage: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
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
    tableName: 'promoter_risk_releases',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_verify_status',
            fields: ['verify_status'],
        },
        {
            name: 'idx_risk_record_id',
            fields: ['risk_record_id'],
        },
    ],
});
exports.default = PromoterRiskRelease;
//# sourceMappingURL=PromoterRiskRelease.model.js.map