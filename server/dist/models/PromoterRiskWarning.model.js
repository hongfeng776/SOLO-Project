"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoterRiskWarning = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
class PromoterRiskWarning extends sequelize_1.Model {
}
exports.PromoterRiskWarning = PromoterRiskWarning;
PromoterRiskWarning.init({
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
    warningLevel: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: true,
    },
    warningType: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: true,
    },
    warningTitle: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    warningDesc: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    ruleCode: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    riskScore: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    isHandled: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    handledBy: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    handledAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    handleRemark: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'promoter_risk_warnings',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_warning_level',
            fields: ['warning_level'],
        },
        {
            name: 'idx_is_handled',
            fields: ['is_handled'],
        },
        {
            name: 'idx_created_at',
            fields: ['created_at'],
        },
    ],
});
exports.default = PromoterRiskWarning;
//# sourceMappingURL=PromoterRiskWarning.model.js.map