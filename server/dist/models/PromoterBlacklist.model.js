"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoterBlacklist = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class PromoterBlacklist extends sequelize_1.Model {
}
exports.PromoterBlacklist = PromoterBlacklist;
PromoterBlacklist.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(enum_1.BlacklistType.PHONE, enum_1.BlacklistType.ID_CARD, enum_1.BlacklistType.NAME, enum_1.BlacklistType.WECHAT),
        allowNull: false,
    },
    value: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    reason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    operatorId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    source: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    expiredAt: {
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
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'promoter_blacklists',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_type_value',
            fields: ['type', 'value'],
            unique: true,
        },
        {
            name: 'idx_is_active',
            fields: ['is_active'],
        },
        {
            name: 'idx_expired_at',
            fields: ['expired_at'],
        },
    ],
});
exports.default = PromoterBlacklist;
//# sourceMappingURL=PromoterBlacklist.model.js.map