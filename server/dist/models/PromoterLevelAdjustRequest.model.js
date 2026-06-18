"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoterLevelAdjustRequest = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class PromoterLevelAdjustRequest extends sequelize_1.Model {
}
exports.PromoterLevelAdjustRequest = PromoterLevelAdjustRequest;
PromoterLevelAdjustRequest.init({
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
    fromLevel: {
        type: sequelize_1.DataTypes.ENUM(enum_1.PromoterLevel.L1, enum_1.PromoterLevel.L2, enum_1.PromoterLevel.L3, enum_1.PromoterLevel.L4, enum_1.PromoterLevel.L5),
        allowNull: true,
    },
    toLevel: {
        type: sequelize_1.DataTypes.ENUM(enum_1.PromoterLevel.L1, enum_1.PromoterLevel.L2, enum_1.PromoterLevel.L3, enum_1.PromoterLevel.L4, enum_1.PromoterLevel.L5),
        allowNull: true,
    },
    adjustReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    metricsSnapshot: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('metricsSnapshot');
            if (!value)
                return undefined;
            try {
                return JSON.parse(value);
            }
            catch {
                return undefined;
            }
        },
        set(value) {
            this.setDataValue('metricsSnapshot', value ? JSON.stringify(value) : undefined);
        },
    },
    meetsThreshold: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
    },
    approveStatus: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.ManualLevelAdjustStatus.PENDING,
    },
    approverId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    approverName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    approveRemark: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    approvedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    syncedToFrontend: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    tableName: 'promoter_level_adjust_requests',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_approve_status',
            fields: ['approve_status'],
        },
        {
            name: 'idx_from_level',
            fields: ['from_level'],
        },
        {
            name: 'idx_to_level',
            fields: ['to_level'],
        },
    ],
});
exports.default = PromoterLevelAdjustRequest;
//# sourceMappingURL=PromoterLevelAdjustRequest.model.js.map