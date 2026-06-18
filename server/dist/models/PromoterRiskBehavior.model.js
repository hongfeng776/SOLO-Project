"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoterRiskBehavior = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
class PromoterRiskBehavior extends sequelize_1.Model {
}
exports.PromoterRiskBehavior = PromoterRiskBehavior;
PromoterRiskBehavior.init({
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
    behaviorType: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    behaviorDesc: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    ipAddress: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    deviceId: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    location: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: true,
    },
    orderId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'orders',
            key: 'id',
        },
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: true,
    },
    riskFlagged: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    riskType: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: true,
    },
    riskScore: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('metadata');
            return raw ? JSON.parse(raw) : null;
        },
        set(value) {
            this.setDataValue('metadata', value ? JSON.stringify(value) : undefined);
        },
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'promoter_risk_behaviors',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_behavior_type',
            fields: ['behavior_type'],
        },
        {
            name: 'idx_risk_flagged',
            fields: ['risk_flagged'],
        },
        {
            name: 'idx_created_at',
            fields: ['created_at'],
        },
        {
            name: 'idx_order_id',
            fields: ['order_id'],
        },
    ],
});
exports.default = PromoterRiskBehavior;
//# sourceMappingURL=PromoterRiskBehavior.model.js.map