"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoterLevelChangeLog = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class PromoterLevelChangeLog extends sequelize_1.Model {
}
exports.PromoterLevelChangeLog = PromoterLevelChangeLog;
PromoterLevelChangeLog.init({
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
    changeSource: {
        type: sequelize_1.DataTypes.STRING(20),
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
    operatorId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    operatorName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    metricsAtChange: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('metricsAtChange');
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
            this.setDataValue('metricsAtChange', value ? JSON.stringify(value) : undefined);
        },
    },
    meetsThreshold: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
    },
    adjustRequestId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    changeReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    complianceCheck: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('complianceCheck');
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
            this.setDataValue('complianceCheck', value ? JSON.stringify(value) : undefined);
        },
    },
    anomalyFlagged: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    anomalyReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    iterationCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'promoter_level_change_logs',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_change_source',
            fields: ['change_source'],
        },
        {
            name: 'idx_anomaly_flagged',
            fields: ['anomaly_flagged'],
        },
        {
            name: 'idx_created_at',
            fields: ['created_at'],
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
exports.default = PromoterLevelChangeLog;
//# sourceMappingURL=PromoterLevelChangeLog.model.js.map