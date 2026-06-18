"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoterRiskRecord = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class PromoterRiskRecord extends sequelize_1.Model {
}
exports.PromoterRiskRecord = PromoterRiskRecord;
PromoterRiskRecord.init({
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
    riskLevel: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    riskType: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
    },
    riskTitle: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    riskDescription: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    riskEvidence: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('riskEvidence');
            return raw ? JSON.parse(raw) : null;
        },
        set(value) {
            this.setDataValue('riskEvidence', value ? JSON.stringify(value) : undefined);
        },
    },
    operatorId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    operatorName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    controlStatus: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: true,
        defaultValue: enum_1.RiskControlStatus.NORMAL,
    },
    permissionsSnapshot: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('permissionsSnapshot');
            return raw ? JSON.parse(raw) : null;
        },
        set(value) {
            this.setDataValue('permissionsSnapshot', value ? JSON.stringify(value) : undefined);
        },
    },
    expireAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'promoter_risk_records',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_risk_level',
            fields: ['risk_level'],
        },
        {
            name: 'idx_risk_type',
            fields: ['risk_type'],
        },
        {
            name: 'idx_created_at',
            fields: ['created_at'],
        },
        {
            name: 'idx_is_active',
            fields: ['is_active'],
        },
    ],
});
exports.default = PromoterRiskRecord;
//# sourceMappingURL=PromoterRiskRecord.model.js.map