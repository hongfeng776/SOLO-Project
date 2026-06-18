"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoterChangeLog = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
class PromoterChangeLog extends sequelize_1.Model {
}
exports.PromoterChangeLog = PromoterChangeLog;
PromoterChangeLog.init({
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
    operatorId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    operatorName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    fieldName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    fieldLabel: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    oldValue: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    newValue: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    changeType: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    remark: {
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
    tableName: 'promoter_change_logs',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_operator_id',
            fields: ['operator_id'],
        },
        {
            name: 'idx_field_name',
            fields: ['field_name'],
        },
        {
            name: 'idx_created_at',
            fields: ['created_at'],
        },
    ],
});
exports.default = PromoterChangeLog;
//# sourceMappingURL=PromoterChangeLog.model.js.map