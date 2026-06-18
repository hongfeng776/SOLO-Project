"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoterAuditLog = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
class PromoterAuditLog extends sequelize_1.Model {
}
exports.PromoterAuditLog = PromoterAuditLog;
PromoterAuditLog.init({
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
    action: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    fromStage: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
    },
    toStage: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
    },
    fromStatus: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
    },
    toStatus: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
    },
    operatorId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    operatorName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    remark: {
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
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'promoter_audit_logs',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_action',
            fields: ['action'],
        },
        {
            name: 'idx_operator_id',
            fields: ['operator_id'],
        },
        {
            name: 'idx_created_at',
            fields: ['created_at'],
        },
        {
            name: 'idx_from_stage_to_stage',
            fields: ['from_stage', 'to_stage'],
        },
    ],
});
exports.default = PromoterAuditLog;
//# sourceMappingURL=PromoterAuditLog.model.js.map