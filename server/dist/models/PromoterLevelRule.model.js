"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoterLevelRule = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class PromoterLevelRule extends sequelize_1.Model {
}
exports.PromoterLevelRule = PromoterLevelRule;
PromoterLevelRule.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    level: {
        type: sequelize_1.DataTypes.ENUM(enum_1.PromoterLevel.L1, enum_1.PromoterLevel.L2, enum_1.PromoterLevel.L3, enum_1.PromoterLevel.L4, enum_1.PromoterLevel.L5),
        allowNull: false,
    },
    levelName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    minMonthlyAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    minMonthlyOrders: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    minActiveDays: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    minReputationScore: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    },
    commissionRate: {
        type: sequelize_1.DataTypes.DECIMAL(5, 4),
        allowNull: true,
    },
    maxChannels: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    canUseCoupon: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
    },
    canUseCashback: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
    },
    minOrderAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    dailyWithdrawLimit: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: true,
    },
    canUsePremiumMaterial: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    canUseAdvancedAnalytics: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    effectiveFrom: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    effectiveTo: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    updatedBy: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    remark: {
        type: sequelize_1.DataTypes.TEXT,
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
    tableName: 'promoter_level_rules',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_level',
            fields: ['level'],
            unique: true,
        },
        {
            name: 'idx_effective',
            fields: ['effective_from', 'effective_to'],
        },
    ],
});
exports.default = PromoterLevelRule;
//# sourceMappingURL=PromoterLevelRule.model.js.map